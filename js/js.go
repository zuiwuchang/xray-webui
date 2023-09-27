package js

import (
	"github.com/dop251/goja"
	"github.com/dop251/goja_nodejs/require"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
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

	ret, e := requireModule.Require(path)
	if e != nil {
		return
	}
	o, ok := ret.(*goja.Object)
	if !ok {
		e = status.Error(codes.Unimplemented, `script must exports an Object`)
		return
	}
	create, ok := goja.AssertFunction(o.Get(`create`))
	if !ok {
		e = status.Error(codes.Unimplemented, `script must export function create`)
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
	}
	for _, name := range names {
		_, ok := goja.AssertFunction(self.ToObject(vm.Runtime).Get(name))
		if !ok {
			e = status.Error(codes.Unimplemented, `script method `+name+` not implemented`)
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
		e = status.Error(codes.FailedPrecondition, `script method create must  return Provider`)
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
		e = status.Error(codes.Unimplemented, `script method `+name+` not implemented`)
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
