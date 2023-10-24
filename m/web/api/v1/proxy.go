package v1

import (
	"net/http"
	"net/url"

	"github.com/gin-gonic/gin"
	"github.com/zuiwuchang/xray_webui/configure"
	"github.com/zuiwuchang/xray_webui/js"
	"github.com/zuiwuchang/xray_webui/m/web"
)

type Proxy struct {
	web.Helper
}

func (h Proxy) Register(router *gin.RouterGroup) {
	r := router.Group(`proxy`)
	r.POST(`preview`, h.Preview)
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
	u, e := url.ParseRequestURI(o.URL)
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
	s, e := vm.Preview(u, o.Strategy)
	if e != nil {
		c.String(http.StatusInternalServerError, e.Error())
		return
	}
	c.String(http.StatusOK, s)
}
