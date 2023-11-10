package systemctl

import (
	"errors"
	"os/exec"
	"sync/atomic"

	"github.com/zuiwuchang/xray_webui/m/writer"
)

var ErrorServiceKilled = errors.New(`service alreay killed`)

type Service struct {
	install *InstallOptions
	done    chan struct{}
	command chan *_Command
	killed  int32
	exit    chan *_Cmd
}

func newService(opts *InstallOptions) *Service {
	return &Service{
		install: opts,
		done:    make(chan struct{}),
		command: make(chan *_Command),
		exit:    make(chan *_Cmd, 1),
	}
}

const (
	evtStart  = 1
	evtStop   = 2
	evtStatus = 3
)

type _Command struct {
	Evt    int
	Error  chan error
	Result any
}
type Status struct {
	// 服務安裝信息
	Install InstallOptions
	// 服務進程的退出碼，如果爲 undefined 則表示從未運行過
	Code int
	// 服務進程已經啓動了多少次
	Count int
	// 當前進程 pid
	PID int
}

func (s *Service) Kill() {
	if s.killed == 0 && atomic.CompareAndSwapInt32(&s.killed, 0, 1) {
		close(s.done)
	}
}

func (s *Service) Start() (do bool, e error) {
	cmd := &_Command{
		Evt:   evtStart,
		Error: make(chan error, 1),
	}
	select {
	case <-s.done:
		e = ErrorServiceKilled
		return
	case s.command <- cmd:
	}
	e = <-cmd.Error
	if e == nil {
		do = cmd.Result.(bool)
	}
	return
}
func (s *Service) Stop() (do bool, e error) {
	cmd := &_Command{
		Evt:   evtStop,
		Error: make(chan error, 1),
	}
	select {
	case <-s.done:
		e = ErrorServiceKilled
		return
	case s.command <- cmd:
	}
	e = <-cmd.Error
	if e == nil {
		do = cmd.Result.(bool)
	}
	return
}
func (s *Service) Status() (status *Status, e error) {
	cmd := &_Command{
		Evt:   evtStatus,
		Error: make(chan error, 1),
	}
	select {
	case <-s.done:
		e = ErrorServiceKilled
		return
	case s.command <- cmd:
	}
	e = <-cmd.Error
	if e == nil {
		status = cmd.Result.(*Status)
	}
	return
}
func (s *Service) Serve() {
	var (
		cmd   *_Cmd
		count int
		code  int
	)
	for {
		select {
		case <-s.done:
			return
		case exit := <-s.exit:
			if exit == cmd {
				code = exit.code
				cmd = nil
				count++
			}
		case evt := <-s.command:
			switch evt.Evt {
			case evtStart:
				if cmd == nil {
					evt.Result = false
					close(evt.Error)
				} else {
					c, e := s.start()
					if e == nil {
						evt.Result = true
						close(evt.Error)
						cmd = c
					} else {
						evt.Result = false
						evt.Error <- e
					}
				}
			case evtStop:
				if cmd == nil {
					evt.Result = false
				} else {
					evt.Result = true
					cmd.cmd.Process.Kill()
					code = cmd.Wait()
					cmd = nil
					count++
				}
				close(evt.Error)
			case evtStatus:
				status := &Status{
					Install: *s.install,
					Code:    code,
					Count:   count,
				}
				if cmd != nil {
					status.PID = cmd.pid
				}
				evt.Result = status
				close(evt.Error)
			}
		}
	}
}
func (s *Service) start() (cmd *_Cmd, e error) {
	c := exec.Command(s.install.Name, s.install.Args...)
	if s.install.Dir != `` {
		c.Dir = s.install.Dir
	}
	if s.install.Log {
		c.Stdout = writer.Writer()
		c.Stderr = c.Stdout
	}
	e = c.Start()
	if e != nil {
		return
	}
	ch := make(chan int, 1)
	cmd = &_Cmd{
		cmd: c,
		pid: c.Process.Pid,
		ch:  ch,
	}
	go func() {
		c.Wait()
		cmd.code = c.ProcessState.ExitCode()
		ch <- cmd.code
		s.exit <- cmd
	}()
	return
}

type _Cmd struct {
	pid, code int
	cmd       *exec.Cmd
	ch        <-chan int
}

func (c *_Cmd) Wait() int {
	return <-c.ch
}
