package v1

import (
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/zuiwuchang/xray_webui/configure"
	"github.com/zuiwuchang/xray_webui/db/manipulator"
	"github.com/zuiwuchang/xray_webui/js"
	"github.com/zuiwuchang/xray_webui/m/web"
)

type Proxy struct {
	web.Helper
}

func (h Proxy) Register(router *gin.RouterGroup) {
	r := router.Group(`proxy`)
	r.POST(`preview`, h.Preview)
	r.POST(`test_once`, h.TestOnce)
	r.GET(`test`, h.CheckWebsocket, h.Test)
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
	_, e = url.ParseRequestURI(general.URL)
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

	rawURL := o.URL
	fragment := ``
	found := strings.LastIndex(rawURL, `#`)
	if found > 0 {
		fragment = url.QueryEscape(rawURL[found+1:])
		rawURL = rawURL[:found]
	}

	u, e := url.ParseRequestURI(rawURL)
	if e != nil {
		c.String(http.StatusInternalServerError, e.Error())
		return
	}
	u.Fragment = fragment

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
	duration, e := vm.Test(ctx, u, general.URL)
	if e != nil {
		c.String(http.StatusInternalServerError, e.Error())
		return
	}
	c.JSON(http.StatusOK, map[string]any{
		`result`: (int64)(duration / time.Millisecond),
	})
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
	rawURL := o.URL
	fragment := ``
	found := strings.LastIndex(rawURL, `#`)
	if found > 0 {
		fragment = url.QueryEscape(rawURL[found+1:])
		rawURL = rawURL[:found]
	}

	u, e := url.ParseRequestURI(rawURL)
	if e != nil {
		c.String(http.StatusInternalServerError, e.Error())
		return
	}
	u.Fragment = fragment
	if o.Strategy < 1 || o.Strategy > 6 {
		c.String(http.StatusBadRequest, `strategy not support`)
		return
	}

	vm, e := js.New(configure.Default().System.Script)
	if e != nil {
		c.String(http.StatusInternalServerError, e.Error())
		return
	}
	s, _, e := vm.Preview(u, o.Strategy, &js.Environment{})
	if e != nil {
		c.String(http.StatusInternalServerError, e.Error())
		return
	}
	c.String(http.StatusOK, s)
}
