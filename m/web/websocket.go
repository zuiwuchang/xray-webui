package web

import (
	"net/http"
	"sync"
	"sync/atomic"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/proto"
)

var DefaultUpgrader = websocket.Upgrader{
	ReadBufferSize:  1024 * 32,
	WriteBufferSize: 1024 * 32,
	// CheckOrigin: func(r *http.Request) bool {
	// 	// 允許跨域請求
	// 	return true
	// },
}

func (h Helper) CheckWebsocket(c *gin.Context) {
	if !c.IsWebsocket() {
		h.Error(c, status.Error(codes.InvalidArgument, `expect websocket`))
		c.Abort()
		return
	}
}
func (h Helper) Websocket(c *gin.Context, responseHeader http.Header) (conn *Websocket, e error) {
	if !c.IsWebsocket() {
		e = status.Error(codes.InvalidArgument, `expect websocket`)
		h.Error(c, e)
		return
	}
	ws, e := DefaultUpgrader.Upgrade(c.Writer, c.Request, responseHeader)
	if e != nil {
		e = status.Error(codes.Unknown, e.Error())
		h.Error(c, e)
		return
	}
	conn = &Websocket{ws: ws}
	return
}

type Websocket struct {
	ws     *websocket.Conn
	locker sync.Mutex
}

func (w *Websocket) WriteMessage(messageType int, data []byte) error {
	w.locker.Lock()
	e := w.ws.WriteMessage(messageType, data)
	w.locker.Unlock()
	return e
}
func (w *Websocket) WriteJSON(v interface{}) error {
	w.locker.Lock()
	e := w.ws.WriteJSON(v)
	w.locker.Unlock()
	return e
}
func (w *Websocket) ReadMessage() (messageType int, p []byte, err error) {
	return w.ws.ReadMessage()
}
func (w *Websocket) Close() error {
	return w.ws.Close()
}
func (w *Websocket) SendMessage(m proto.Message) error {
	b, e := Marshal(m)
	if e != nil {
		return e
	}
	return w.WriteMessage(websocket.TextMessage, b)
}
func (w *Websocket) SendBinary(b []byte) error {
	return w.WriteMessage(websocket.BinaryMessage, b)
}
func (w *Websocket) Send(v interface{}) error {
	return w.WriteJSON(v)
}
func (w *Websocket) Success() error {
	return w.Send(Error{
		Code:    codes.OK,
		Message: codes.OK.String(),
	})
}
func (w *Websocket) Error(e error) error {
	if e == nil {
		return w.Send(Error{
			Code:    codes.OK,
			Message: codes.OK.String(),
		})
	} else {
		return w.Send(Error{
			Code:    status.Code(e),
			Message: e.Error(),
		})
	}
}
func (w *Websocket) Forward(f Forward) {
	work := newWebsocketForward(w, f)
	work.Serve()
}

type websocketForward struct {
	w      *Websocket
	f      Forward
	closed int32
	cancel chan struct{}
}

func newWebsocketForward(w *Websocket, f Forward) *websocketForward {
	return &websocketForward{
		w:      w,
		f:      f,
		cancel: make(chan struct{}),
	}
}
func (wf *websocketForward) Serve() {
	go wf.request()
	go wf.response()
	<-wf.cancel
	wf.w.Close()
	wf.f.CloseSend()
}
func (wf *websocketForward) request() {
	var counted uint64
	for {
		t, p, e := wf.w.ReadMessage()
		if e != nil {
			break
		}
		if t == websocket.CloseMessage {
			break
		} else if t == websocket.PingMessage {
			continue
		} else if t == websocket.PongMessage {
			e = wf.w.WriteMessage(t, p)
			if e == nil {
				continue
			}
			break
		} else if t != websocket.TextMessage && t != websocket.BinaryMessage {
			wf.w.Error(status.Errorf(codes.InvalidArgument, "unknow websocket message type: %d", t))
			break
		}

		e = wf.f.Request(counted, t, p)
		if e != nil {
			wf.w.Error(e)
			break
		}
		counted++
	}

	if wf.closed == 0 &&
		atomic.SwapInt32(&wf.closed, 1) == 0 {
		close(wf.cancel)
	}
}
func (wf *websocketForward) response() {
	var counted uint64
	for {
		e := wf.f.Response(counted)
		if e != nil {
			wf.w.Error(e)
			break
		}
		counted++
	}
	if wf.closed == 0 &&
		atomic.SwapInt32(&wf.closed, 1) == 0 {
		close(wf.cancel)
	}
}
