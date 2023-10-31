package v1

import (
	"net/http"
	"net/url"
	"strings"

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
