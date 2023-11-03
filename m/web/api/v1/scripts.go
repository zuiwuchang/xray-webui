package v1

import (
	"context"
	"log/slog"

	"github.com/gin-gonic/gin"
	"github.com/zuiwuchang/xray_webui/log"
	"github.com/zuiwuchang/xray_webui/m/web"
	"github.com/zuiwuchang/xray_webui/m/writer"
)

type Scripts struct {
	web.Helper
}

func (h Scripts) Register(router *gin.RouterGroup) {
	r := router.Group(`scripts`)
	r.GET(`listen`, h.CheckWebsocket, h.Listen)
}

func (h Scripts) Listen(c *gin.Context) {
	ws, e := h.Websocket(c, nil)
	if e != nil {
		return
	}
	defer ws.Close()
	closed := make(chan struct{})
	go func() {
		for {
			_, _, e := ws.ReadMessage()
			if e != nil {
				slog.Warn(`script listener recv fail`, log.Error, e)
				break
			}
		}
		close(closed)
	}()

	l, e := writer.Listen(closed)
	if e != nil {
		if e != context.Canceled {
			slog.Warn(`script listen fail`, log.Error, e)
		}
		return
	}
	defer l.Close()

	ch := l.Chan()
	for {
		select {
		case msg := <-ch:
			e = ws.WriteMessage(msg.Type, msg.Data)
			if e != nil {
				slog.Warn(`script listener send fail`, log.Error, e)
				return
			}
		case <-closed:
			return
		}
	}
}
