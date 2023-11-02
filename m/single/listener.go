package single

import (
	"sync/atomic"

	"github.com/gorilla/websocket"
)

type Message struct {
	Type int
	Data []byte
}
type Listener struct {
	done   chan struct{}
	ch     chan Message
	closed int32
	delete chan *Listener
}

func newListener(delete chan *Listener) *Listener {
	return &Listener{
		done:   make(chan struct{}),
		ch:     make(chan Message),
		delete: delete,
	}
}
func (l *Listener) Close() {
	if l.closed == 0 && atomic.CompareAndSwapInt32(&l.closed, 0, 1) {
		close(l.done)
		l.delete <- l
	}
}
func (l *Listener) Chan() <-chan Message {
	return l.ch
}
func (l *Listener) Write(b []byte) bool {
	select {
	case l.ch <- Message{
		Type: websocket.BinaryMessage,
		Data: b,
	}:
		return true
	case <-l.done:
		return false
	}
}
func (l *Listener) WriteText(b []byte) bool {
	select {
	case l.ch <- Message{
		Type: websocket.TextMessage,
		Data: b,
	}:
		return true
	case <-l.done:
		return false
	}
}
