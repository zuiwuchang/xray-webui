package js

import (
	"bytes"
	"errors"
	"fmt"
	"os/exec"
	"runtime"

	"github.com/dop251/goja"
	"github.com/zuiwuchang/xray_webui/m/writer"
	"github.com/zuiwuchang/xray_webui/utils"
	"github.com/zuiwuchang/xray_webui/version"
)

func RegisterCore(vm *goja.Runtime, module *goja.Object) {
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
}
func (n *_Native) print(call goja.FunctionCall) goja.Value {
	return n.printAny(call, false)
}
func (n *_Native) println(call goja.FunctionCall) goja.Value {
	return n.printAny(call, true)
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

func (n *_Native) getString(val goja.Value) (ret string, ok bool) {
	if val == nil || goja.IsNull(val) || goja.IsUndefined(val) {
		return
	}
	ret, ok = val.Export().(string)
	return
}
func (n *_Native) getStringDefault(val goja.Value, def string) (ret string, ok bool) {
	if val == nil || goja.IsNull(val) || goja.IsUndefined(val) {
		ret = def
		ok = true
		return
	}
	ret, ok = val.Export().(string)
	return
}
func (n *_Native) getStrings(val goja.Value) (ret []string, ok bool) {
	if val == nil || goja.IsNull(val) || goja.IsUndefined(val) {
		return
	}
	args, ok := val.Export().([]any)
	if ok {
		ret = make([]string, len(args))
		for i, arg := range args {
			ret[i] = fmt.Sprint(arg)
		}
	}
	return
}

func (n *_Native) getStringsDefault(val goja.Value, def []string) (ret []string, ok bool) {
	if val == nil || goja.IsNull(val) || goja.IsUndefined(val) {
		ret = def
		ok = true
		return
	}
	ret, ok = n.getStrings(val)
	return
}
func (n *_Native) getBoolDefault(val goja.Value, def bool) (ret bool, ok bool) {
	if val == nil || goja.IsNull(val) || goja.IsUndefined(val) {
		ret = def
		ok = true
		return
	}
	ret, ok = val.Export().(bool)
	return
}

func (n *_Native) exec(call goja.FunctionCall) goja.Value {
	obj, ok := call.Argument(0).(*goja.Object)
	if !ok {
		panic(n.runtime.ToValue(errors.New(`exec args[0] invalid`)))
	}
	name, ok := n.getString(obj.Get(`name`))
	if !ok {
		panic(n.runtime.ToValue(errors.New(`exec args[0].name must be a string`)))
	}
	args, ok := n.getStringsDefault(obj.Get(`args`), nil)
	if !ok {
		panic(n.runtime.ToValue(errors.New(`exec args[0].args must be an Array or null or undefined`)))
	}
	dir, ok := n.getStringDefault(obj.Get(`dir`), ``)
	if !ok {
		panic(n.runtime.ToValue(errors.New(`exec args[0].dir must be a string or null or undefined`)))
	}
	safe, ok := n.getBoolDefault(obj.Get(`safe`), false)
	if !ok {
		panic(n.runtime.ToValue(errors.New(`exec args[0].safe must be a boolean or null or undefined`)))
	}
	log, ok := n.getBoolDefault(obj.Get(`log`), false)
	if !ok {
		panic(n.runtime.ToValue(errors.New(`exec args[0].safe must be a boolean or null or undefined`)))
	}

	var out bytes.Buffer
	cmd := exec.Command(name, args...)
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
