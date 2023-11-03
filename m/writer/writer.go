package writer

import (
	"container/list"
	"context"
	"encoding/binary"
	"io"
	"os"
	"sync"
	"sync/atomic"
	"time"
)

var defaultWriter = _Writer{
	keys:   make(map[*Listener]bool),
	write:  make(chan []byte),
	add:    make(chan *Listener),
	delete: make(chan *Listener),
}

func Writer() io.Writer {
	if started == 0 && atomic.CompareAndSwapInt32(&started, 0, 1) {
		go defaultWriter.Serve()
	}
	return &defaultWriter
}

var started int32

func Listen(closed chan struct{}) (*Listener, error) {
	if started == 0 && atomic.CompareAndSwapInt32(&started, 0, 1) {
		go defaultWriter.Serve()
	}
	return defaultWriter.Listen(closed)
}

type _Writer struct {
	sync.Mutex

	keys   map[*Listener]bool
	write  chan []byte
	add    chan *Listener
	delete chan *Listener
}

func (w *_Writer) Listen(closed chan struct{}) (l *Listener, e error) {
	l = newListener(w.delete)
	select {
	case w.add <- l:
	case <-closed:
		e = context.Canceled
	}
	return
}
func (w *_Writer) Write(b []byte) (n int, e error) {
	n = len(b)
	if n == 0 {
		return
	}

	w.Lock()
	defer w.Unlock()

	dst := make([]byte, 16+n)
	copy(dst[16:], b)
	binary.LittleEndian.PutUint64(dst[8:], flag)
	w.write <- dst
	return
}
func (w *_Writer) Serve() {
	var (
		id    uint64 = 1
		cache        = list.New()
	)
	for {
		select {
		case b := <-w.write:
			if binary.LittleEndian.Uint64(b) == 0 {
				os.Stdout.Write(b[16:])
			}
			binary.LittleEndian.PutUint64(b, id)
			id++
			for l := range w.keys {
				l.Write(b)
			}
			cache.PushBack(b)
			if cache.Len() > 128 {
				cache.Remove(cache.Front())
			}
		case l := <-w.add:
			for ele := cache.Front(); ele != nil; ele = ele.Next() {
				if !l.Write(ele.Value.([]byte)) {
					return
				}
			}
			w.keys[l] = true
		case l := <-w.delete:
			delete(w.keys, l)
		}
	}
}

var flag = uint64(time.Now().Unix())
