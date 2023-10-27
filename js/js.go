package js

import (
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"net/url"
	"strings"

	"github.com/dop251/goja"
	"github.com/dop251/goja_nodejs/console"
	"github.com/dop251/goja_nodejs/require"
	"github.com/google/go-jsonnet"
	"github.com/zuiwuchang/xray_webui/db/manipulator"
	"github.com/zuiwuchang/xray_webui/utils"
)

type Runtime struct {
	Runtime       *goja.Runtime
	RequireModule *require.RequireModule
	create        goja.Callable

	json      *goja.Object
	stringify goja.Callable
	parse     goja.Callable
}

func New(path string) (runtime *Runtime, e error) {
	vm := goja.New()
	registry := Registry()
	requireModule := registry.Enable(vm)
	console.Enable(vm)

	ret, e := requireModule.Require(path)
	if e != nil {
		return
	}
	o, ok := ret.(*goja.Object)
	if !ok {
		e = errors.New(`script must exports an Object`)
		return
	}
	create, ok := goja.AssertFunction(o.Get(`create`))
	if !ok {
		e = errors.New(`script must export function create`)
		return
	}

	JSON := vm.GlobalObject().Get(`JSON`)
	json, ok := JSON.(*goja.Object)
	if !ok {
		e = errors.New(`JSON not found`)
		return
	}
	stringify, ok := goja.AssertFunction(json.Get(`stringify`))
	if !ok {
		e = errors.New(`JSON.stringify not a function`)
		return
	}
	parse, ok := goja.AssertFunction(json.Get(`parse`))
	if !ok {
		e = errors.New(`JSON.parse not a function`)
		return
	}
	runtime = &Runtime{
		Runtime:       vm,
		RequireModule: requireModule,
		create:        create,
		json:          json,
		stringify:     stringify,
		parse:         parse,
	}
	return
}
func (vm *Runtime) Check() (e error) {
	self, e := vm.create(goja.Undefined())
	if e != nil {
		return
	}
	names := []string{
		`getFirewall`,
		`metadata`,
		`configure`,
		`serve`,
	}
	for _, name := range names {
		_, ok := goja.AssertFunction(self.ToObject(vm.Runtime).Get(name))
		if !ok {
			e = errors.New(`script method ` + name + ` not implemented`)
			return
		}
	}
	callable, ok := goja.AssertFunction(self.ToObject(vm.Runtime).Get(`destroy`))
	if ok {
		_, e = callable(self)
	}
	return
}
func (vm *Runtime) assertFunction(name string) (self goja.Value, f, destroy goja.Callable, e error) {
	self, e = vm.create(goja.Undefined())
	if e != nil {
		return
	}
	o, ok := self.(*goja.Object)
	if !ok {
		e = errors.New(`script method create must  return Provider`)
		return
	}
	val := o.Get(`destroy`)
	callable, ok := goja.AssertFunction(val)
	if ok {
		destroy = callable
	}

	val = o.Get(name)
	callable, ok = goja.AssertFunction(val)
	if !ok {
		e = errors.New(`script method ` + name + ` not implemented`)
		if destroy != nil {
			destroy(self)
		}
		return
	}
	f = callable
	return
}
func (vm *Runtime) GetFirewall() (s string, e error) {
	self, f, destroy, e := vm.assertFunction(`getFirewall`)
	if e != nil {
		return
	} else if destroy != nil {
		defer destroy(self)
	}
	val, e := f(self)
	if e != nil {
		return
	}
	s = val.ToString().String()
	return
}
func (vm *Runtime) Metadata() (s string, e error) {
	self, f, destroy, e := vm.assertFunction(`metadata`)
	if e != nil {
		return
	}
	s, e = vm.metadata(self, f)
	if destroy != nil {
		defer destroy(self)
	}
	return
}
func (vm *Runtime) metadata(self goja.Value, f goja.Callable) (s string, e error) {
	val, e := f(self)
	if e != nil {
		return
	}

	val, e = vm.stringify(vm.json, val)
	if e != nil {
		return
	}
	s = val.String()
	return
}
func (vm *Runtime) Preview(u *url.URL, strategy uint32, env *Environment) (s, ext string, e error) {
	self, f, destroy, e := vm.assertFunction(`metadata`)
	if e != nil {
		return
	} else if destroy != nil {
		defer destroy(self)
	}
	tmp, e := vm.metadata(self, f)
	if e != nil {
		return
	}
	var metadatas []Metadata
	e = json.Unmarshal(utils.StringToBytes(tmp), &metadatas)
	if e != nil {
		return
	}
	for _, metadata := range metadatas {
		if metadata.Protocol == u.Scheme {
			s, ext, e = vm.preview(u, self, metadata, strategy, env)
			return
		}
	}
	e = errors.New(`unknow scheme: ` + u.Scheme)
	return
}
func (vm *Runtime) preview(u *url.URL, self goja.Value, metadata Metadata, strategy uint32, env *Environment) (s, ext string, e error) {
	callable, ok := goja.AssertFunction(self.(*goja.Object).Get(`configure`))
	if !ok {
		e = errors.New(`script method configure not implemented`)
		return
	}

	// userdata
	var mSettings manipulator.Settings
	general, e := mSettings.GetGeneral()
	if e != nil {
		return
	}
	userdataJSON, e := jsonnet.MakeVM().EvaluateAnonymousSnippet(`userdata.jsonnet`, general.Userdata)
	if e != nil {
		return
	}
	var userdata map[string]any
	e = json.Unmarshal(utils.StringToBytes(userdataJSON), &userdata)
	if e != nil {
		return
	}

	// strategy
	var mStrategy manipulator.Strategy
	strategyValue, e := mStrategy.Value(strategy)
	if e != nil {
		return
	}
	fileds := make(map[string]string)
	var (
		o struct {
			ok   bool
			keys map[string]any
		}
		base64 struct {
			ok       bool
			name     string
			password string
		}
		values url.Values
	)
	for _, f := range metadata.Fields {
		if f.OnlyUI {
			continue
		}
		var val string

		switch f.From.From {
		case `username`:
			if u.User != nil {
				val, e = vm.decode(f.From.Enc, u.User.Username())
				if e != nil {
					return
				}
			}
		case `password`:
			if u.User != nil {
				password, _ := u.User.Password()
				val, e = vm.decode(f.From.Enc, password)
				if e != nil {
					return
				}
			}
		case `base64-username`:
			if !base64.ok {
				base64.ok = true
				if u.User != nil {
					str, err := vm.decode(`base64`, u.User.Username())
					if err != nil {
						e = err
						return
					}
					found := strings.LastIndex(str, `:`)
					if found < 0 {
						base64.name = str
					} else {
						base64.name = str[:found]
						base64.password = str[found+1:]
					}
				}
			}
			val = base64.name
		case `base64-password`:
			if !base64.ok {
				base64.ok = true
				if u.User != nil {
					str, err := vm.decode(`base64`, u.User.Username())
					if err != nil {
						e = err
						return
					}
					found := strings.LastIndex(str, `:`)
					if found < 0 {
						base64.name = str
					} else {
						base64.name = str[:found]
						base64.password = str[found+1:]
					}
				}
			}
			val = base64.password
		case `host`:
			val, e = vm.decode(f.From.Enc, u.Hostname())
			if e != nil {
				return
			}
		case `port`:
			val, e = vm.decode(f.From.Enc, u.Port())
			if e != nil {
				return
			}
		case `path`:
			val, e = vm.decode(f.From.Enc, u.Path)
			if e != nil {
				return
			}
		case `query`:
			if values == nil {
				values = u.Query()
			}
			val, e = vm.decode(f.From.Enc, values.Get(f.From.Key))
			if e != nil {
				return
			}
		case `fragment`:
			val, e = vm.decode(f.From.Enc, u.Fragment)
			if e != nil {
				return
			}
		case `json`:
			if !o.ok {
				var str string
				str, e = vm.decode("base64", u.Host)
				if e != nil {
					return
				}
				e = json.Unmarshal(utils.StringToBytes(str), &o.keys)
				if e != nil {
					return
				}
				o.ok = true
			}
			val, e = vm.decode(f.From.Enc, fmt.Sprint(o.keys[f.From.Key]))
			if e != nil {
				return
			}
			// default:
			// 	e = errors.New(`unknow filed from: ` + f.From.From)
			// 	return
		}
		fileds[f.Key] = val

	}
	jstr, e := json.Marshal(map[string]any{
		`environment`: env,
		`fileds`:      fileds,
		`userdata`:    userdata,
		`strategy`:    strategyValue,
	})
	if e != nil {
		return
	}
	opts, e := vm.parse(vm.json, vm.Runtime.ToValue(utils.BytesToString(jstr)))
	if e != nil {
		return
	}
	val, e := callable(self, opts)
	if e != nil {
		return
	}
	if o, ok := val.(*goja.Object); ok {
		s = o.Get(`content`).String()
		ext = o.Get(`extension`).String()
	} else {
		e = errors.New(`unknow provider.configure() result`)
	}
	return
}
func (vm *Runtime) decode(enc, src string) (output string, e error) {
	if src == `` {
		output = src
		return
	}
	switch enc {
	case `base64`:
		src = strings.TrimRight(src, "=")
		var b []byte
		b, e = base64.RawStdEncoding.DecodeString(src)
		if e != nil {
			b0, e0 := base64.RawURLEncoding.DecodeString(src)
			if e0 != nil {
				return
			}
			b = b0
		}
		output = utils.BytesToString(b)
	default:
		output = src
	}
	return
}
