package v1

import (
	"context"
	"log/slog"
	"net"
	"net/http"
	"net/url"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/zuiwuchang/xray_webui/configure"
	"github.com/zuiwuchang/xray_webui/db/data"
	"github.com/zuiwuchang/xray_webui/db/manipulator"
	"github.com/zuiwuchang/xray_webui/js"
	"github.com/zuiwuchang/xray_webui/log"
	"github.com/zuiwuchang/xray_webui/m/single"
	"github.com/zuiwuchang/xray_webui/m/web"
	"github.com/zuiwuchang/xray_webui/utils"
)

type Proxy struct {
	web.Helper
}

func (h Proxy) Register(router *gin.RouterGroup) {
	r := router.Group(`proxy`)
	r.POST(`preview`, h.Preview)
	r.POST(`test_once`, h.TestOnce)
	r.GET(`test`, h.CheckWebsocket, h.Test)
	r.POST(`start/:subscription/:id`, h.Start)
	r.DELETE(``, h.Stop)
	r.GET(`listen`, h.CheckWebsocket, h.Listen)

	r.POST(`test_tcp_once`, h.TestTcpOnce)
	r.GET(`test_tcp`, h.CheckWebsocket, h.TestTcp)
}
func (h Proxy) Test(c *gin.Context) {
	ws, e := h.Websocket(c, nil)
	if e != nil {
		return
	}
	defer ws.Close()

	var m manipulator.Settings
	general, e := m.GetGeneral()
	if e != nil {
		ws.WriteJSON(map[string]any{
			`code`:  http.StatusInternalServerError,
			`error`: e.Error(),
		})
		return
	}
	_, e = utils.ParseRequestURI(general.URL)
	if e != nil {
		ws.WriteJSON(map[string]any{
			`code`:  http.StatusInternalServerError,
			`error`: e.Error(),
		})
		return
	}

	helper := js.NewHelper(configure.Default().System.Script, general.URL)
	go func() {
		var req struct {
			What int    `json:"what"`
			ID   string `json:"id"`
			URL  string `json:"url"`
		}
		var e error
		for {
			e = ws.ReadJSON(&req)
			if e != nil {
				break
			}
			if req.What == 1 {
				// 添加任務
				e = helper.Add(req.ID, req.URL)
				if e != nil {
					break
				}
			}
		}
		helper.Close()
	}()

	for {
		select {
		case <-helper.Done():
			return
		case resp := <-helper.Message():
			e = ws.WriteJSON(resp)
			if e != nil {
				return
			}
		}
	}
}

func (h Proxy) TestOnce(c *gin.Context) {
	var o struct {
		URL string `json:"url"`
	}
	e := h.Bind(c, &o)
	if e != nil {
		return
	}

	u, e := utils.ParseRequestURI(o.URL)
	if e != nil {
		c.String(http.StatusInternalServerError, e.Error())
		return
	}

	var m manipulator.Settings
	general, e := m.GetGeneral()
	if e != nil {
		c.String(http.StatusInternalServerError, e.Error())
		return
	}
	_, e = url.ParseRequestURI(general.URL)
	if e != nil {
		c.String(http.StatusInternalServerError, e.Error())
		return
	}

	ctx := c.Request.Context()
	e = ctx.Err()
	if e != nil {
		return
	}

	vm, e := js.New(configure.Default().System.Script)
	if e != nil {
		c.String(http.StatusInternalServerError, e.Error())
		return
	}
	duration, e := vm.Test(ctx, o.URL, u, general.URL)
	if e != nil {
		c.String(http.StatusInternalServerError, e.Error())
		return
	}
	c.JSON(http.StatusOK, map[string]any{
		`result`: (int64)(duration / time.Millisecond),
	})
}
func (h Proxy) TestTcpOnce(c *gin.Context) {
	var o struct {
		Remote string `json:"remote"`
	}
	e := h.Bind(c, &o)
	if e != nil {
		return
	}

	ctx := c.Request.Context()
	e = ctx.Err()
	if e != nil {
		return
	}

	var dialer net.Dialer
	at := time.Now()
	conn, e := dialer.DialContext(ctx, `tcp`, o.Remote)
	if e != nil {
		c.String(http.StatusInternalServerError, e.Error())
		return
	}
	conn.Close()
	duration := time.Since(at)
	c.JSON(http.StatusOK, map[string]any{
		`result`: (int64)(duration / time.Millisecond),
	})
}
func (h Proxy) TestTcp(c *gin.Context) {
	ws, e := h.Websocket(c, nil)
	if e != nil {
		return
	}
	defer ws.Close()
	helper := js.NewTcpHelper()
	go func() {
		var req struct {
			What   int    `json:"what"`
			ID     string `json:"id"`
			Remote string `json:"remote"`
		}
		var e error
		for {
			e = ws.ReadJSON(&req)
			if e != nil {
				break
			}
			if req.What == 1 {
				// 添加任務
				e = helper.Add(req.ID, req.Remote)
				if e != nil {
					break
				}
			}
		}
		helper.Close()
	}()

	for {
		select {
		case <-helper.Done():
			return
		case resp := <-helper.Message():
			e = ws.WriteJSON(resp)
			if e != nil {
				return
			}
		}
	}
}
func (h Proxy) Preview(c *gin.Context) {
	var o struct {
		URL      string `json:"url"`
		Strategy uint32 `json:"strategy"`
	}
	e := h.Bind(c, &o)
	if e != nil {
		return
	}
	u, e := utils.ParseRequestURI(o.URL)
	if e != nil {
		c.String(http.StatusInternalServerError, e.Error())
		return
	}
	if o.Strategy < 1 || o.Strategy > 6 {
		c.String(http.StatusBadRequest, `strategy not support`)
		return
	}

	vm, e := js.New(configure.Default().System.Script)
	if e != nil {
		c.String(http.StatusInternalServerError, e.Error())
		return
	}
	s, _, _, e := vm.Preview(o.URL, u, o.Strategy, &js.Environment{})
	if e != nil {
		c.String(http.StatusInternalServerError, e.Error())
		return
	}
	c.String(http.StatusOK, s)
}
func (h Proxy) Start(c *gin.Context) {
	var id struct {
		Subscription uint64 `uri:"subscription"`
		ID           uint64 `uri:"id"`
	}
	e := h.BindURI(c, &id)
	if e != nil {
		return
	} else if id.ID == 0 {
		c.String(http.StatusBadRequest, `id invalid`)
		return
	}
	var req struct {
		URL      string `json:"url"`
		Strategy uint32 `json:"strategy"`
		Name     string `json:"name"`
	}
	e = h.Bind(c, &req)
	if e != nil {
		return
	}
	e = single.Start(c.Request.Context(), &data.Last{
		URL:          req.URL,
		Strategy:     req.Strategy,
		Name:         req.Name,
		Subscription: id.Subscription,
		ID:           id.ID,
	})
	if e != nil {
		c.String(http.StatusBadRequest, e.Error())
	}
}
func (h Proxy) Stop(c *gin.Context) {
	e := single.Stop(c.Request.Context())
	if e != nil {
		c.String(http.StatusBadRequest, e.Error())
	}
}
func (h Proxy) Listen(c *gin.Context) {
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
				slog.Warn(`listener recv fail`, log.Error, e)
				break
			}
		}
		close(closed)
	}()

	l, e := single.Listen(closed)
	if e != nil {
		if e != context.Canceled {
			slog.Warn(`listen fail`, log.Error, e)
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
				slog.Warn(`listener send fail`, log.Error, e)
				return
			}
		case <-closed:
			return
		}
	}

}
