package js

import (
	"bytes"
	"errors"
	"fmt"
	"os/exec"
	"runtime"

	"github.com/dop251/goja"
	"github.com/zuiwuchang/xray_webui/utils"
	"github.com/zuiwuchang/xray_webui/version"
)

func RegisterCore(vm *goja.Runtime, module *goja.Object) {
	obj := module.Get("exports").(*goja.Object)
	obj.Set(`println`, func(args ...interface{}) {
		fmt.Println(args...)
	})
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

	var out bytes.Buffer
	cmd := exec.Command(name, args...)
	if dir != `` {
		cmd.Dir = utils.BasePath()
	}
	cmd.Stdout = &out
	cmd.Stderr = &out
	e := cmd.Run()
	s := out.String()
	if safe {
		return n.runtime.ToValue(map[string]any{
			`error`:  n.runtime.NewGoError(e),
			`code`:   cmd.ProcessState.ExitCode(),
			`output`: s,
		})
	} else {
		if e != nil {
			panic(n.runtime.NewGoError(e))
		}
		return n.runtime.ToValue(s)
	}
}
