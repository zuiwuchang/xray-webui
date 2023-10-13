package v1

import (
	"log/slog"
	"net/http"
	"sync/atomic"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/zuiwuchang/xray_webui/db/data"
	"github.com/zuiwuchang/xray_webui/db/manipulator"
	"github.com/zuiwuchang/xray_webui/log"
	"github.com/zuiwuchang/xray_webui/m/web"
)

type Strategy struct {
	web.Helper
	maxage  int
	modtime atomic.Value
}

func (h *Strategy) Register(router *gin.RouterGroup) {
	h.maxage = 0
	h.modtime.Store(time.Now())

	r := router.Group(`strategy`)

	r.GET(``, h.List)
	r.HEAD(``, h.List)

	r.POST(`:id`, h.Set)
}
func (h Strategy) List(c *gin.Context) {
	h.SetHTTPCacheMaxAge(c, h.maxage)
	h.ServeLazyJSON(c, ``, h.modtime.Load().(time.Time), func() (any, error) {
		var m manipulator.Strategy
		items, e := m.List()
		if e != nil {
			slog.Warn("strategy list",
				log.Error, e,
			)
			return nil, e
		}
		return items, nil
	})
}
func (h Strategy) Set(c *gin.Context) {
	var id struct {
		ID uint32 `uri:"id"`
	}
	e := h.BindURI(c, &id)
	if e != nil {
		return
	} else if id.ID < 1 || id.ID > 6 {
		c.String(http.StatusBadRequest, `id not support`)
		return
	}
	var req data.Strategy
	e = h.Bind(c, &req)
	if e != nil {
		return
	}
	req.ID = id.ID

	var m manipulator.Strategy
	e = m.Put(&data.Strategy{
		ID:           req.ID,
		Host:         req.Host,
		ProxyIP:      req.ProxyIP,
		ProxyDomain:  req.ProxyDomain,
		DirectIP:     req.DirectIP,
		DirectDomain: req.DirectDomain,
		BlockIP:      req.BlockIP,
		BlockDomain:  req.BlockDomain,
	})
	if e != nil {
		slog.Warn("strategy set",
			log.Error, e,
			`id`, req.ID,
			`host`, req.Host,
			`proxyIP`, req.ProxyIP,
			`proxyDomain`, req.ProxyDomain,
			`directIP`, req.DirectIP,
			`directDomain`, req.DirectDomain,
			`blockIP`, req.BlockIP,
			`blockDomain`, req.BlockDomain,
		)
		return
	}
	h.modtime.Store(time.Now())
	slog.Info("strategy set",
		`id`, req.ID,
		`host`, req.Host,
		`proxyIP`, req.ProxyIP,
		`proxyDomain`, req.ProxyDomain,
		`directIP`, req.DirectIP,
		`directDomain`, req.DirectDomain,
		`blockIP`, req.BlockIP,
		`blockDomain`, req.BlockDomain,
	)
}
