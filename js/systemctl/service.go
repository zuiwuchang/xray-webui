package systemctl

import (
	"errors"
	"os/exec"
	"sync/atomic"
)

var ErrorServiceKilled = errors.New(`service alreay killed`)

type Service struct {
	install *InstallOptions
	done    chan struct{}
	command chan *_Command
	killed  int32
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
	// 服務進程目前是否處於啓動狀態
	Run bool
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
				evt.Result = &Status{
					Install: *s.install,
					Code:    code,
					Count:   count,
					Run:     cmd != nil,
				}
				close(evt.Error)
			}
		}
	}
}
func (s *Service) start() (cmd *_Cmd, e error) {
	return
}

type _Cmd struct {
	cmd *exec.Cmd
}

func (c *_Cmd) Wait() int {
	return 0
}
