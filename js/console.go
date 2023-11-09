package js

import (
	"fmt"

	"github.com/dop251/goja"
	"github.com/zuiwuchang/xray_webui/js/require"
	"github.com/zuiwuchang/xray_webui/m/writer"
)

const (
	ModuleID = `console`
)

func EnableConsole(runtime *goja.Runtime) {
	runtime.Set("console", require.Require(runtime, "console"))
}

func RequireConsole(runtime *goja.Runtime, module *goja.Object) {
	obj := module.Get(`exports`).(*goja.Object)
	obj.Set(`trace`, nativeTrace)
	obj.Set(`debug`, nativeDebug)
	obj.Set(`log`, nativeLog)
	obj.Set(`info`, nativeInfo)
	obj.Set(`warn`, nativeWarn)
	obj.Set(`error`, nativeError)
}
func nativeTrace(call goja.FunctionCall) goja.Value {
	return nativeTag(call, `[TRACE]`)
}
func nativeDebug(call goja.FunctionCall) goja.Value {
	return nativeTag(call, `[DEBUG]`)
}
func nativeLog(call goja.FunctionCall) goja.Value {
	return nativeTag(call, `[LOG]`)
}
func nativeInfo(call goja.FunctionCall) goja.Value {
	return nativeTag(call, `[INFO]`)
}
func nativeWarn(call goja.FunctionCall) goja.Value {
	return nativeTag(call, `[WARN]`)
}
func nativeError(call goja.FunctionCall) goja.Value {
	return nativeTag(call, `[ERROR]`)
}
func nativeTag(call goja.FunctionCall, tag string) goja.Value {
	count := len(call.Arguments)
	if count == 0 {
		fmt.Fprintln(writer.Writer(), tag)
		return nil
	}
	arrs := make([]interface{}, count+1)
	arrs[0] = tag
	for i := 0; i < count; i++ {
		arg := call.Arguments[i]
		export := arg.Export()
		if native, ok := export.(interface {
			String() string
		}); ok {
			arrs[i+1] = native.String()
		} else {
			arrs[i+1] = arg.ToString()
		}
	}
	fmt.Fprintln(writer.Writer(), arrs...)
	return nil
}
