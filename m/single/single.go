package single

import (
	"container/list"
	"context"
	"encoding/binary"
	"encoding/json"
	"fmt"
	"log/slog"
	"os"
	"os/exec"
	"sync"
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
func Listen(closed chan struct{}) (*Listener, error) {
	return defaultServer.Listen(closed)
}

var started int32

func Run() {
	if started == 0 && atomic.CompareAndSwapInt32(&started, 0, 1) {
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
			} else if last == nil {
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
	write:   make(chan []byte),
	message: make(chan []byte, 1),
	store:   make(chan []byte, 1),

	add:    make(chan *Listener),
	delete: make(chan *Listener),
	keys:   make(map[*Listener]bool),
}

type _Server struct {
	start   chan startRequest
	stop    chan stopRequest
	close   chan closeSignal
	cmd     *_Command
	write   chan []byte
	message chan []byte
	store   chan []byte

	add    chan *Listener
	delete chan *Listener
	keys   map[*Listener]bool
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
				s.sendStop()
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
				s.sendStart(req.info)
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
	var (
		last, store []byte
		id          uint64 = 1
		cache              = list.New()
	)
	for {
		select {
		case b := <-s.write:
			if binary.LittleEndian.Uint64(b) == 0 {
				os.Stdout.Write(b[16:])
			}
			binary.LittleEndian.PutUint64(b, id)
			id++
			for l := range s.keys {
				l.Write(b)
			}
			cache.PushBack(b)
			if cache.Len() > 128 {
				cache.Remove(cache.Front())
			}
		case message := <-s.message:
			for l := range s.keys {
				l.WriteText(message)
			}
			last = message
		case store = <-s.store:
			for l := range s.keys {
				l.WriteText(store)
			}
		case l := <-s.add:
			if len(store) != 0 {
				if !l.WriteText(store) {
					return
				}
			}
			if len(last) != 0 {
				if !l.WriteText(last) {
					return
				}
			}
			for ele := cache.Front(); ele != nil; ele = ele.Next() {
				if !l.Write(ele.Value.([]byte)) {
					return
				}
			}
			s.keys[l] = true
		case l := <-s.delete:
			delete(s.keys, l)
		}
	}
}
func (s *_Server) Listen(closed chan struct{}) (l *Listener, e error) {
	l = newListener(s.delete)
	select {
	case s.add <- l:
	case <-closed:
		e = context.Canceled
	}
	return
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
		info:  req.info,
		first: true,
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
		cmd.Wait()
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
func (s *_Server) sendStore(info *data.Last) {
	b, e := json.Marshal(map[string]any{
		`what`: 2,
		`data`: info,
	})
	if e == nil {
		for {
			select {
			case s.store <- b:
				return
			default:
			}

			select {
			case s.store <- b:
				return
			case <-s.store:
			}
		}
	}
}
func (s *_Server) sendStart(info *data.Last) {
	s.sendStore(info)
	s.send(map[string]any{
		`what`: 1,
		`data`: info,
	})
}
func (s *_Server) sendStop() {
	s.send(map[string]any{
		`what`: 1,
	})
}
func (s *_Server) doStop() (e error) {
	cmd := s.cmd
	if cmd == nil {
		return
	}
	s.cmd = nil
	cmd.cmd.Process.Kill()

	// 廣播代理進程結束
	s.sendStop()

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
	close  chan closeSignal
	write  chan []byte
	cmd    *exec.Cmd
	first  bool
	locker sync.Mutex
	info   *data.Last
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

	c.locker.Lock()
	defer c.locker.Unlock()
	if c.first {
		c.first = false

		info := c.info
		text := fmt.Sprintf(`

----------------------------------------
name=%v
url=%v
subscription=%v
id=%v
strategy=%v %s
----------------------------------------

`,
			info.Name, info.URL,
			info.Subscription, info.ID, info.Strategy, info.StrategyName(),
		)
		dst := make([]byte, len(text)+16)
		binary.LittleEndian.PutUint64(dst, 1)
		binary.LittleEndian.PutUint64(dst[8:], flag)
		copy(dst[16:], text)
		c.write <- dst
	}

	dst := make([]byte, 16+n)
	copy(dst[16:], b)
	binary.LittleEndian.PutUint64(dst[8:], flag)
	c.write <- dst
	return n, nil
}

var flag = uint64(time.Now().Unix())
