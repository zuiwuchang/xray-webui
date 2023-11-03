package js

import (
	"context"
	"net/http"
	"runtime"
	"time"

	"github.com/zuiwuchang/xray_webui/utils"
)

type worker struct {
	ID  string
	URL string
}
type Helper struct {
	ctx            context.Context
	cancel         context.CancelFunc
	ch             chan worker
	message        chan any
	err            error
	started        bool
	getURL, script string
}

func NewHelper(script, getURL string) *Helper {
	ctx, cancel := context.WithCancel(context.Background())
	return &Helper{
		ctx:     ctx,
		cancel:  cancel,
		ch:      make(chan worker),
		message: make(chan any),
		getURL:  getURL,
		script:  script,
	}
}
func (h *Helper) Done() <-chan struct{} {
	return h.ctx.Done()
}
func (h *Helper) Close() {
	h.cancel()
}
func (h *Helper) Add(id, url string) (e error) {
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
	case h.ch <- worker{
		ID:  id,
		URL: url,
	}:
	}
	return
}
func (h *Helper) start() (e error) {
	n := runtime.GOMAXPROCS(0) * 2
	if n < 4 {
		n = 4
	}
	ports := make([]uint16, n)
	begin := uint16(40000)
	end := uint16(60000)
	for i := 0; i < n; i++ {
		port, err := GetPort(h.ctx, begin, end)
		if err != nil {
			e = err
			return
		}
		ports[i] = port

		begin = port + 1
	}
	h.started = true
	// 啓動工作協程
	for i := 0; i < n; i++ {
		go h.worker(ports[i])
	}
	return
}
func (h *Helper) worker(port uint16) {
	for {
		select {
		case <-h.ctx.Done():
			return
		case worker := <-h.ch:
			h.do(port, worker.ID, worker.URL)
		}
	}
}
func (h *Helper) do(port uint16, id, rawURL string) {
	vm, e := New(h.script)
	if e != nil {
		h.send(map[string]any{
			`code`:  http.StatusOK,
			`id`:    id,
			`error`: e.Error(),
		})
		return
	}

	u, e := utils.ParseRequestURI(rawURL)
	if e != nil {
		h.send(map[string]any{
			`code`:  http.StatusOK,
			`id`:    id,
			`error`: e.Error(),
		})
		return
	}

	ctx, cancel := context.WithTimeout(h.ctx, time.Second*30)
	defer cancel()
	duration, e := vm.TestAtPort(ctx, rawURL, u, port, h.getURL)
	if e != nil {
		h.send(map[string]any{
			`code`:  http.StatusOK,
			`id`:    id,
			`error`: e.Error(),
		})
		return
	}
	h.send(map[string]any{
		`code`:     http.StatusOK,
		`id`:       id,
		`duration`: (int64)(duration / time.Millisecond),
	})
}
func (h *Helper) send(val any) {
	select {
	case <-h.ctx.Done():
	case h.message <- val:
	}
}
func (h *Helper) Message() <-chan any {
	return h.message
}
