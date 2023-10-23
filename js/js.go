package js

import (
	"errors"

	"github.com/dop251/goja"
	"github.com/dop251/goja_nodejs/console"
	"github.com/dop251/goja_nodejs/require"
)

type Runtime struct {
	Runtime       *goja.Runtime
	RequireModule *require.RequireModule
	create        goja.Callable
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

	runtime = &Runtime{
		Runtime:       vm,
		RequireModule: requireModule,
		create:        create,
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
	} else if destroy != nil {
		defer destroy(self)
	}
	val, e := f(self)
	if e != nil {
		return
	}

	JSON := vm.Runtime.GlobalObject().Get(`JSON`)
	stringify := JSON.(*goja.Object).Get(`stringify`)
	callable, ok := goja.AssertFunction(stringify)
	if !ok {
		e = errors.New(`JSON.stringify not a function`)
		return
	}
	val, e = callable(JSON, val)
	if e != nil {
		return
	}
	s = val.String()
	return
}
