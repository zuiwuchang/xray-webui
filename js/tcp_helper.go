package js

import (
	"context"
	"net"
	"net/http"
	"runtime"
	"time"
)

type tcpWorker struct {
	ID     string
	Remote string
}
type TcpHelper struct {
	ctx     context.Context
	cancel  context.CancelFunc
	ch      chan tcpWorker
	message chan any
	err     error
	started bool
}

func NewTcpHelper() *TcpHelper {
	ctx, cancel := context.WithCancel(context.Background())
	return &TcpHelper{
		ctx:     ctx,
		cancel:  cancel,
		ch:      make(chan tcpWorker),
		message: make(chan any),
	}
}
func (h *TcpHelper) Done() <-chan struct{} {
	return h.ctx.Done()
}
func (h *TcpHelper) Close() {
	h.cancel()
}
func (h *TcpHelper) Add(id, remote string) (e error) {
	if h.err != nil {
		h.err = e
		return
	}
	if !h.started {
		e = h.start()
		if e != nil {
			h.err = e
			select {
			case <-h.ctx.Done():
			case h.message <- map[string]any{
				`code`:  http.StatusInternalServerError,
				`error`: e.Error(),
			}:
			default:
			}
			return
		}
	}

	select {
	case <-h.ctx.Done():
		e = h.ctx.Err()
		return
	case h.ch <- tcpWorker{
		ID:     id,
		Remote: remote,
	}:
	}
	return
}
func (h *TcpHelper) start() (e error) {
	n := runtime.GOMAXPROCS(0) * 2
	if n < 4 {
		n = 4
	}

	h.started = true
	// 啓動工作協程
	for i := 0; i < n; i++ {
		go h.worker()
	}
	return
}
func (h *TcpHelper) worker() {
	for {
		select {
		case <-h.ctx.Done():
			return
		case worker := <-h.ch:
			h.do(worker.ID, worker.Remote)
		}
	}
}
func (h *TcpHelper) do(id, remote string) {
	ctx, cancel := context.WithTimeout(h.ctx, time.Second*30)
	defer cancel()
	at := time.Now()
	var dialer net.Dialer
	c, e := dialer.DialContext(ctx, `tcp`, remote)
	if e != nil {
		h.send(map[string]any{
			`code`:  http.StatusOK,
			`id`:    id,
			`error`: e.Error(),
		})
		return
	}
	duration := time.Since(at)
	c.Close()
	h.send(map[string]any{
		`code`:     http.StatusOK,
		`id`:       id,
		`duration`: (int64)(duration / time.Millisecond),
	})
}
func (h *TcpHelper) send(val any) {
	select {
	case <-h.ctx.Done():
	case h.message <- val:
	}
}
func (h *TcpHelper) Message() <-chan any {
	return h.message
}
