package v1

import (
	"log/slog"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/zuiwuchang/xray_webui/configure"
	"github.com/zuiwuchang/xray_webui/js"
	"github.com/zuiwuchang/xray_webui/log"
	"github.com/zuiwuchang/xray_webui/m/web"
	"github.com/zuiwuchang/xray_webui/utils"
)

type Firewall struct {
	web.Helper
}

func (h Firewall) Register(router *gin.RouterGroup) {
	r := router.Group(`firewall`)
	r.GET(``, h.get)
	r.HEAD(``, h.get)

	r.POST(`on`, h.on)
	r.POST(`off`, h.off)
}
func (h Firewall) get(c *gin.Context) {
	vm, e := js.New(configure.Default().System.Script)
	if e != nil {
		slog.Warn("firewall get error",
			log.Error, e,
		)
		c.String(http.StatusInternalServerError, e.Error())
		return
	}
	result, e := vm.Firewall()
	if e != nil {
		slog.Warn("firewall get error",
			log.Error, e,
		)
		c.String(http.StatusInternalServerError, e.Error())
		return
	}
	c.JSON(http.StatusOK, map[string]any{
		`result`: result,
	})
}
func (h Firewall) on(c *gin.Context) {
	var o struct {
		URL string `json:"url"`
	}
	e := h.Bind(c, &o)
	if e != nil {
		c.String(http.StatusBadRequest, e.Error())
		return
	}
	u, e := utils.ParseRequestURI(o.URL)
	if e != nil {
		c.String(http.StatusBadRequest, e.Error())
		return
	}

	vm, e := js.New(configure.Default().System.Script)
	if e != nil {
		slog.Warn("firewall on error",
			log.Error, e,
		)
		c.String(http.StatusInternalServerError, e.Error())
		return
	}
	e = vm.TurnOn(o.URL, u)
	if e != nil {
		c.String(http.StatusInternalServerError, e.Error())
	}
}
func (h Firewall) off(c *gin.Context) {
	var o struct {
		URL string `json:"url"`
	}
	e := h.Bind(c, &o)
	if e != nil {
		c.String(http.StatusBadRequest, e.Error())
		return
	}
	u, e := utils.ParseRequestURI(o.URL)
	if e != nil {
		c.String(http.StatusBadRequest, e.Error())
		return
	}

	vm, e := js.New(configure.Default().System.Script)
	if e != nil {
		slog.Warn("firewall on error",
			log.Error, e,
		)
		c.String(http.StatusInternalServerError, e.Error())
		return
	}
	e = vm.TurnOff(o.URL, u)
	if e != nil {
		c.String(http.StatusInternalServerError, e.Error())
	}
}
