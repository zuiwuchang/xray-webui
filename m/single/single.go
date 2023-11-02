package single

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"os"
	"os/exec"
	"sync/atomic"
	"time"

	"github.com/zuiwuchang/xray_webui/configure"
	"github.com/zuiwuchang/xray_webui/db/data"
	"github.com/zuiwuchang/xray_webui/db/manipulator"
	"github.com/zuiwuchang/xray_webui/js"
	"github.com/zuiwuchang/xray_webui/log"
)

func Start(ctx context.Context, info *data.Last) error {
	return defaultServer.Start(ctx, info)
}
func Stop(ctx context.Context) error {
	return defaultServer.Stop(ctx)
}

var started int32

func Run() {
	if atomic.CompareAndSwapInt32(&started, 0, 1) {
		go defaultServer.Run()

		var m manipulator.Settings
		general, e := m.GetGeneral()
		if e != nil {
			slog.Warn(`get general fail`, log.Error, e)
			return
		}
		if general.Run {
			last, e := m.GetLast()
			if e != nil {
				slog.Warn(`get last fail`, log.Error, e)
				return
			}
			e = defaultServer.Start(context.Background(), last)
			if e != nil {
				slog.Warn(`start last fail`, log.Error, e)
				return
			}
		}
	}
}

var defaultServer = &_Server{
	start:   make(chan startRequest),
	stop:    make(chan stopRequest),
	close:   make(chan closeSignal),
	write:   make(chan commandWrite),
	message: make(chan []byte, 1),
}

type _Server struct {
	start   chan startRequest
	stop    chan stopRequest
	close   chan closeSignal
	cmd     *_Command
	write   chan commandWrite
	message chan []byte
}

type startRequest struct {
	ctx  context.Context
	info *data.Last
	ch   chan error
}
type stopRequest struct {
	ctx context.Context
	ch  chan error
}
type commandWrite struct {
	b   []byte
	cmd *_Command
}

func (s *_Server) Run() {
	go s.runWrite()
	var e error
	var m manipulator.Settings
	var info *data.Last
	for {
		select {
		case close := <-s.close:
			if close.cmd == s.cmd {
				s.cmd = nil
				slog.Warn(`proxy process exit`,
					log.Error, close.e,
					`name`, info.Name,
					`url`, info.URL,
					`strategy`, info.Strategy,
				)
				// 廣播代理進程結束
				s.send(map[string]any{
					`what`: 2,
				})
				info = nil
			}
		case req := <-s.start:
			e = s.doStart(req)
			if e == nil {
				close(req.ch)
				slog.Info(`create proxy process`,
					`name`, req.info.Name,
					`url`, req.info.URL,
					`strategy`, req.info.Strategy,
				)
				info = req.info
				// 廣播新的廣播進程
				s.send(map[string]any{
					`what`: 1,
					`data`: map[string]any{
						`name`:         req.info.Name,
						`url`:          req.info.URL,
						`strategy`:     req.info.Strategy,
						`subscription`: req.info.Subscription,
						`id`:           req.info.ID,
					},
				})
				// 記錄最後啓動進程
				e = m.PutLast(req.info)
				if e != nil {
					slog.Warn(`save last fail`, log.Error, e)
				}
			} else {
				select {
				case req.ch <- e:
				case <-req.ctx.Done():
				}
			}
		case req := <-s.stop:
			e = s.doStop()
			if e == nil {
				close(req.ch)
			} else {
				select {
				case req.ch <- e:
				case <-req.ctx.Done():
				}
			}
		}
	}
}
func (s *_Server) send(o map[string]any) {
	b, e := json.Marshal(o)
	if e != nil {
		return
	}
	for {
		select {
		case s.message <- b:
			return
		default:
		}

		select {
		case s.message <- b:
			return
		case <-s.message:
		}
	}
}
func (s *_Server) runWrite() {
	for {
		select {
		case write := <-s.write:
			os.Stdout.Write(write.b)
		case message := <-s.message:
			fmt.Println((string)(message))
		}
	}
}
func (s *_Server) doStart(req startRequest) (e error) {
	vm, e := js.New(configure.Default().System.Script)
	if e != nil {
		return
	}
	// 創建進程 command
	cmd, e := vm.Start(req.ctx, req.info)
	if e != nil {
		return
	}
	e = req.ctx.Err()
	if e != nil {
		return
	}
	command := &_Command{
		close: s.close,
		write: s.write,
		cmd:   cmd,
	}
	// 劫持輸出
	cmd.Stdout = command
	cmd.Stderr = command

	// 啓動進程
	e = cmd.Start()
	if e != nil {
		return
	}
	e = req.ctx.Err()
	if e != nil {
		cmd.Process.Kill()
		return
	}

	// 等待進程
	e = command.Serve()
	if e != nil {
		return
	}

	// 設置當前進程
	s.cmd = command
	return
}

func (s *_Server) doStop() (e error) {
	cmd := s.cmd
	if cmd == nil {
		return
	}
	s.cmd = nil
	s.cmd.cmd.Process.Kill()
	var m manipulator.Settings
	err := m.RemoveLast()
	if err != nil {
		slog.Warn(`delete last fail`, log.Error, e)
	}
	return
}
func (s *_Server) Start(ctx context.Context, info *data.Last) (e error) {
	done := ctx.Done()
	ch := make(chan error)
	select {
	case s.start <- startRequest{
		ctx:  ctx,
		info: info,
		ch:   ch,
	}:
	case <-done:
		e = ctx.Err()
		return
	}
	select {
	case e = <-ch:
	case <-done:
		e = ctx.Err()
	}
	return
}
func (s *_Server) Stop(ctx context.Context) (e error) {
	done := ctx.Done()
	ch := make(chan error)
	select {
	case s.stop <- stopRequest{
		ctx: ctx,
		ch:  ch,
	}:
	case <-done:
		e = ctx.Err()
		return
	}
	select {
	case e = <-ch:
	case <-done:
		e = ctx.Err()
	}
	return
}

type closeSignal struct {
	cmd *_Command
	e   error
}
type _Command struct {
	close chan closeSignal
	write chan commandWrite
	cmd   *exec.Cmd
}

func (c *_Command) Serve() (e error) {
	// 等待1秒確保進程不會異常退出
	timer := time.NewTimer(time.Second * 1)
	ch := make(chan error, 1)
	go func() {
		err := c.cmd.Wait()
		ch <- err
		c.close <- closeSignal{
			e:   err,
			cmd: c,
		}
	}()
	select {
	case <-timer.C:
		// 認爲進程已經穩定運行
	case e = <-ch:
	}
	return
}
func (c *_Command) Write(b []byte) (int, error) {
	n := len(b)
	if n == 0 {
		return 0, nil
	}
	dst := make([]byte, n)
	copy(dst, b)
	c.write <- commandWrite{
		b:   dst,
		cmd: c,
	}
	return n, nil
}
