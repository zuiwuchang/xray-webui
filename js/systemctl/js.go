package systemctl

import (
	"errors"
	"time"

	"github.com/dop251/goja"
	"github.com/zuiwuchang/xray_webui/js/args"
)

const (
	ModuleID = `xray/systemctl`
)
const (
	// 不執行任何額外工作，只是進行註冊
	RunNone = 1
	// 註冊成功後立刻運行服務
	RunStart = 2
)
const (
	// 不執行重啓
	RestartNone = 1
	// 進程錯誤時重啓
	RestartFail = 2
	// 始終執行重啓
	RestartAlways = 3
)

func Require(runtime *goja.Runtime, module *goja.Object) {
	obj := module.Get("exports").(*goja.Object)

	run := runtime.NewObject()
	obj.Set(`Run`, run)
	run.Set(`none`, RunNone)
	run.Set(`start`, RunStart)

	restart := runtime.NewObject()
	obj.Set(`Restart`, restart)
	restart.Set(`none`, RestartNone)
	restart.Set(`fail`, RestartFail)
	restart.Set(`always`, RestartAlways)

	bridge := &_Bridge{
		runtime:   runtime,
		systemctl: New(),
	}
	obj.Set(`install`, bridge.Install)
	obj.Set(`uninstall`, bridge.Uninstall)
	obj.Set(`start`, bridge.Start)
	obj.Set(`stop`, bridge.Stop)
	obj.Set(`status`, bridge.Status)

}

type _Bridge struct {
	runtime   *goja.Runtime
	systemctl *Systemctl
}

func (b *_Bridge) Install(call goja.FunctionCall) goja.Value {
	obj, ok := call.Argument(0).(*goja.Object)
	if !ok {
		panic(b.runtime.NewGoError(errors.New(`install args[0] invalid`)))
	}
	id, ok := args.GetString(obj.Get(`id`))
	if !ok {
		panic(b.runtime.NewGoError(errors.New(`install args[0].id must be a string`)))
	}
	name, ok := args.GetString(obj.Get(`name`))
	if !ok {
		panic(b.runtime.NewGoError(errors.New(`install args[0].name must be a string`)))
	}
	arg, ok := args.GetStringsDefault(obj.Get(`args`), nil)
	if !ok {
		panic(b.runtime.NewGoError(errors.New(`install args[0].args must be an Array or null or undefined`)))
	}
	dir, ok := args.GetStringDefault(obj.Get(`dir`), ``)
	if !ok {
		panic(b.runtime.NewGoError(errors.New(`install args[0].dir must be a string or null or undefined`)))
	}
	interval, ok := args.GetIntDefault(obj.Get(`interval`), 0)
	if !ok {
		panic(b.runtime.NewGoError(errors.New(`install args[0].interval must be a number or null or undefined`)))
	}
	restart, ok := args.GetIntDefault(obj.Get(`restart`), 1)
	if !ok {
		panic(b.runtime.NewGoError(errors.New(`install args[0].restart must be a number or null or undefined`)))
	}
	run, ok := args.GetIntDefault(obj.Get(`run`), 1)
	if !ok {
		panic(b.runtime.NewGoError(errors.New(`install args[0].run must be a number or null or undefined`)))
	}
	log, ok := args.GetBoolDefault(obj.Get(`log`), false)
	if !ok {
		panic(b.runtime.NewGoError(errors.New(`install args[0].log must be a boolean or null or undefined`)))
	}

	ok, e := b.systemctl.Install(InstallOptions{
		ID:       id,
		Name:     name,
		Args:     arg,
		Dir:      dir,
		Interval: time.Millisecond * time.Duration(interval),
		Restart:  restart,
		Run:      run,
		Log:      log,
	})
	if e != nil {
		panic(b.runtime.NewGoError(e))
	}
	return b.runtime.ToValue(ok)
}
func (b *_Bridge) Uninstall(call goja.FunctionCall) goja.Value {
	if len(call.Arguments) == 0 {
		panic(b.runtime.NewGoError(errors.New(`uninstall id invalid`)))
	}
	id, ok := args.GetString(call.Arguments[0])
	if !ok {
		panic(b.runtime.NewGoError(errors.New(`uninstall id invalid`)))
	}

	ok = b.systemctl.Uninstall(id)
	return b.runtime.ToValue(ok)
}
func (b *_Bridge) Start(call goja.FunctionCall) goja.Value {
	if len(call.Arguments) == 0 {
		panic(b.runtime.NewGoError(errors.New(`start id invalid`)))
	}
	id, ok := args.GetString(call.Arguments[0])
	if !ok {
		panic(b.runtime.NewGoError(errors.New(`start id invalid`)))
	}

	do, e := b.systemctl.Start(id)
	if e != nil {
		panic(b.runtime.NewGoError(e))
	}
	return b.runtime.ToValue(do)
}
func (b *_Bridge) Stop(call goja.FunctionCall) goja.Value {
	if len(call.Arguments) == 0 {
		panic(b.runtime.NewGoError(errors.New(`stop id invalid`)))
	}
	id, ok := args.GetString(call.Arguments[0])
	if !ok {
		panic(b.runtime.NewGoError(errors.New(`stop id invalid`)))
	}

	do, e := b.systemctl.Stop(id)
	if e != nil {
		panic(b.runtime.NewGoError(e))
	}
	return b.runtime.ToValue(do)
}
func (b *_Bridge) ObjectSet(o *goja.Object, name string, val any) {
	if val != nil {
		e := o.Set(name, val)
		if e != nil {
			panic(b.runtime.NewGoError(e))
		}
	}
}
func (b *_Bridge) Status(call goja.FunctionCall) goja.Value {
	if len(call.Arguments) == 0 {
		panic(b.runtime.NewGoError(errors.New(`status id invalid`)))
	}
	id, ok := args.GetString(call.Arguments[0])
	if !ok {
		panic(b.runtime.NewGoError(errors.New(`status id invalid`)))
	}

	status, e := b.systemctl.Status(id)
	if e != nil {
		panic(b.runtime.NewGoError(e))
	} else if status == nil {
		return goja.Undefined()
	}
	install := b.runtime.NewObject()
	b.ObjectSet(install, `id`, status.Install.ID)
	b.ObjectSet(install, `name`, status.Install.Name)
	b.ObjectSet(install, `args`, status.Install.Args)
	b.ObjectSet(install, `dir`, status.Install.Dir)
	if status.Install.Interval > time.Millisecond {
		b.ObjectSet(install, `interval`, int(status.Install.Interval/time.Millisecond))
	}
	b.ObjectSet(install, `restart`, status.Install.Restart)
	b.ObjectSet(install, `run`, status.Install.Run)
	b.ObjectSet(install, `log`, status.Install.Log)

	o := b.runtime.NewObject()
	b.ObjectSet(o, `install`, install)
	if status.Count > 0 {
		b.ObjectSet(o, `code`, status.Code)
	}
	b.ObjectSet(o, `count`, status.Count)
	if status.PID != 0 {
		b.ObjectSet(o, `pid`, status.PID)
	}
	return o
}
