package args

import (
	"fmt"

	"github.com/dop251/goja"
)

func GetString(val goja.Value) (ret string, ok bool) {
	if val == nil || goja.IsNull(val) || goja.IsUndefined(val) {
		return
	}
	ret, ok = val.Export().(string)
	return
}
func GetStringDefault(val goja.Value, def string) (ret string, ok bool) {
	if val == nil || goja.IsNull(val) || goja.IsUndefined(val) {
		ret = def
		ok = true
		return
	}
	ret, ok = val.Export().(string)
	return
}
func GetStrings(val goja.Value) (ret []string, ok bool) {
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

func GetStringsDefault(val goja.Value, def []string) (ret []string, ok bool) {
	if val == nil || goja.IsNull(val) || goja.IsUndefined(val) {
		ret = def
		ok = true
		return
	}
	ret, ok = GetStrings(val)
	return
}
func GetBoolDefault(val goja.Value, def bool) (ret bool, ok bool) {
	if val == nil || goja.IsNull(val) || goja.IsUndefined(val) {
		ret = def
		ok = true
		return
	}
	ret = val.ToBoolean()
	ok = true
	return
}
func GetIntDefault(val goja.Value, def int) (ret int, ok bool) {
	if val == nil || goja.IsNull(val) || goja.IsUndefined(val) {
		ret = def
		ok = true
		return
	}
	v := val.ToInteger()
	ret = int(v)
	ok = true
	return
}
