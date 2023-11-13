package core

import (
	"bytes"
	"errors"
	"fmt"
	"net"
	"os"
	"os/exec"
	"runtime"
	"sync"
	"time"

	"github.com/dop251/goja"
	"github.com/zuiwuchang/xray_webui/js/args"
	"github.com/zuiwuchang/xray_webui/m/writer"
	"github.com/zuiwuchang/xray_webui/utils"
	"github.com/zuiwuchang/xray_webui/version"
)

const (
	ModuleID = `xray/core`
)

func Require(vm *goja.Runtime, module *goja.Object) {
	obj := module.Get("exports").(*goja.Object)
	obj.Set(`os`, runtime.GOOS)
	obj.Set(`arch`, runtime.GOARCH)
	obj.Set(`version`, version.Version)
	obj.Set(`root`, utils.BasePath())
	native := &_Native{
		runtime: vm,
	}
	native.register(obj)
}

type _Native struct {
	runtime *goja.Runtime
}

func (n *_Native) register(o *goja.Object) {
	o.Set(`exec`, n.exec)
	o.Set(`print`, n.print)
	o.Set(`println`, n.println)
	o.Set(`lookupHost`, net.LookupHost)
	o.Set(`sleep`, func(val time.Duration) {
		if val > 0 {
			time.Sleep(time.Millisecond * val)
		}
	})
	o.Set(`interfaces`, n.interfaces)
	o.Set(`writeTextFile`, func(name, text string) error {
		return os.WriteFile(name, utils.StringToBytes(text), 0666)
	})
	n.registerStorage(o)
}
func (n *_Native) registerStorage(o *goja.Object) {
	value, e := n.runtime.RunString(`(function (x) {
	class X {
		get length() {
			return x.Len();
		}
		clear() {
			return x.Clear();
		}
		getItem(key) {
			const [v, ok] = x.Get(key);
			return ok ? v : null;
		}
		key(index) {
			throw new Error('Storage.key not implemented');
		}
		removeItem(key) {
			return x.Delete(key);
		}
		setItem(key, value) {
			return x.Set(key, value);
		}
	}
	return new X();
});`)
	if e != nil {
		panic(e)
	}
	f, _ := goja.AssertFunction(value)

	storage, e := f(goja.Undefined(), n.runtime.ToValue(_storage))
	if e != nil {
		panic(e)
	}
	o.Set(`sessionStorage`, storage)
}

var _storage = &_Storage{
	keys: make(map[string]string),
}

type _Storage struct {
	keys   map[string]string
	locker sync.RWMutex
}

func (s *_Storage) Len() int {
	s.locker.RLock()
	n := len(s.keys)
	s.locker.RUnlock()

	return n
}
func (s *_Storage) Clear() {
	s.locker.Lock()
	for k := range s.keys {
		delete(s.keys, k)
	}
	s.locker.Unlock()
}
func (s *_Storage) Get(key string) (val string, exists bool) {
	s.locker.RLock()
	val, exists = s.keys[key]
	s.locker.RUnlock()
	return
}
func (s *_Storage) Delete(key string) {
	s.locker.Lock()
	delete(s.keys, key)
	s.locker.Unlock()
}
func (s *_Storage) Set(key, val string) {
	s.locker.Lock()
	s.keys[key] = val
	s.locker.Unlock()

}
func (n *_Native) print(call goja.FunctionCall) goja.Value {
	return n.printAny(call, false)
}
func (n *_Native) println(call goja.FunctionCall) goja.Value {
	return n.printAny(call, true)
}

func (n *_Native) interfaces(call goja.FunctionCall) goja.Value {
	interfaces, e := net.Interfaces()
	if e != nil {
		panic(n.runtime.NewGoError(e))
	}
	items := make([]any, len(interfaces))
	for i, item := range interfaces {
		o := n.runtime.NewObject()
		o.Set(`name`, item.Name)
		addrs, e := item.Addrs()
		if e != nil {
			panic(n.runtime.NewGoError(e))
		}
		strs := make([]string, len(addrs))
		for j := 0; j < len(addrs); j++ {
			strs[j] = addrs[j].String()
		}
		o.Set(`addrs`, strs)
		items[i] = o
	}
	return n.runtime.NewArray(items...)
}
func (n *_Native) printAny(call goja.FunctionCall, ln bool) goja.Value {
	count := len(call.Arguments)
	if count == 0 {
		if ln {
			fmt.Fprintln(writer.Writer())
		} else {
			fmt.Fprint(writer.Writer())
		}
		return nil
	}
	arrs := make([]interface{}, count)
	for i := 0; i < count; i++ {
		arg := call.Arguments[i]
		export := arg.Export()
		if native, ok := export.(interface {
			String() string
		}); ok {
			arrs[i] = native.String()
		} else {
			arrs[i] = arg.ToString()
		}
	}
	if ln {
		fmt.Fprintln(writer.Writer(), arrs...)
	} else {
		fmt.Fprint(writer.Writer(), arrs...)
	}
	return nil
}

func (n *_Native) exec(call goja.FunctionCall) goja.Value {
	obj, ok := call.Argument(0).(*goja.Object)
	if !ok {
		panic(n.runtime.NewGoError(errors.New(`exec args[0] invalid`)))
	}
	name, ok := args.GetString(obj.Get(`name`))
	if !ok {
		panic(n.runtime.NewGoError(errors.New(`exec args[0].name must be a string`)))
	}
	arg, ok := args.GetStringsDefault(obj.Get(`args`), nil)
	if !ok {
		panic(n.runtime.NewGoError(errors.New(`exec args[0].args must be an Array or null or undefined`)))
	}
	dir, ok := args.GetStringDefault(obj.Get(`dir`), ``)
	if !ok {
		panic(n.runtime.NewGoError(errors.New(`exec args[0].dir must be a string or null or undefined`)))
	}
	safe, ok := args.GetBoolDefault(obj.Get(`safe`), false)
	if !ok {
		panic(n.runtime.NewGoError(errors.New(`exec args[0].safe must be a boolean or null or undefined`)))
	}
	log, ok := args.GetBoolDefault(obj.Get(`log`), false)
	if !ok {
		panic(n.runtime.NewGoError(errors.New(`exec args[0].log must be a boolean or null or undefined`)))
	}

	var out bytes.Buffer
	cmd := exec.Command(name, arg...)
	if dir != `` {
		cmd.Dir = utils.BasePath()
	}
	if log {
		cmd.Stdout = writer.Writer()
		cmd.Stderr = cmd.Stdout
	} else {
		cmd.Stdout = &out
		cmd.Stderr = &out
	}
	e := cmd.Run()
	if safe {
		if log {
			if e == nil {
				return n.runtime.ToValue(map[string]any{
					`code`: cmd.ProcessState.ExitCode(),
				})
			}
			return n.runtime.ToValue(map[string]any{
				`error`: n.runtime.NewGoError(e),
				`code`:  cmd.ProcessState.ExitCode(),
			})
		} else if e == nil {
			return n.runtime.ToValue(map[string]any{
				`code`:   cmd.ProcessState.ExitCode(),
				`output`: out.String(),
			})
		}
		return n.runtime.ToValue(map[string]any{
			`error`:  n.runtime.NewGoError(e),
			`code`:   cmd.ProcessState.ExitCode(),
			`output`: out.String(),
		})
	} else {
		if e != nil {
			panic(n.runtime.NewGoError(e))
		}
		return n.runtime.ToValue(out.String())
	}
}
