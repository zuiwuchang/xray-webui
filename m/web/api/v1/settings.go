package v1

import (
	"log/slog"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"sync/atomic"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/go-jsonnet"
	"github.com/zuiwuchang/xray_webui/db/data"
	"github.com/zuiwuchang/xray_webui/db/manipulator"
	"github.com/zuiwuchang/xray_webui/log"
	"github.com/zuiwuchang/xray_webui/m/web"
	"google.golang.org/grpc"
)

type Settings struct {
	web.Helper
	maxage       int
	general      atomic.Value
	subscription atomic.Value
	element      atomic.Value
}

func (h *Settings) Register(cc *grpc.ClientConn, router *gin.RouterGroup) {
	h.maxage = 0
	now := time.Now()
	h.general.Store(now)
	h.subscription.Store(now)
	h.element.Store(now)

	r := router.Group(`settings`)

	r.GET(`general`, h.GetGeneral)
	r.HEAD(`general`, h.GetGeneral)
	r.POST(`general`, h.SetGeneral)

	r.GET(`subscription`, h.ListSubscription)
	r.HEAD(`subscription`, h.ListSubscription)
	r.POST(`subscription`, h.AddSubscription)
	r.PUT(`subscription/:id`, h.PutSubscription)
	r.DELETE(`subscription/:id`, h.RemoveSubscription)

	r.GET(`element`, h.ListElement)
	r.HEAD(`element`, h.ListElement)
}
func (h *Settings) GetGeneral(c *gin.Context) {
	h.SetHTTPCacheMaxAge(c, 0)
	h.ServeLazyJSON(c, ``, h.general.Load().(time.Time), func() (resp any, e error) {
		var m manipulator.Settings
		resp, e = m.GetGeneral()
		if e != nil {
			slog.Warn("settings get general",
				log.Error, e,
			)
			return
		}
		return
	})
}
func (h *Settings) SetGeneral(c *gin.Context) {
	var req data.General
	e := h.Bind(c, &req)
	if e != nil {
		return
	}
	if req.Strategy < 1 || req.Strategy > 6 {
		c.String(http.StatusBadRequest, `strategy not support`)
		return
	}
	vm := jsonnet.MakeVM()
	_, e = vm.EvaluateAnonymousSnippet(`userdata.jsonnet`, req.Userdata)
	if e != nil {
		c.String(http.StatusBadRequest, e.Error())
		return
	}
	var m manipulator.Settings
	e = m.PutGeneral(&req)
	if e != nil {
		slog.Warn("settings set general",
			log.Error, e,
			`url`, req.URL,
			`run`, req.Run,
			`firewall`, req.Firewall,
			`strategy`, req.Strategy,
			`userdata`, req.Userdata,
		)
		c.String(http.StatusBadRequest, e.Error())
		return
	}
	h.general.Store(time.Now())
	slog.Info("settings set general",
		`url`, req.URL,
		`run`, req.Run,
		`firewall`, req.Firewall,
		`strategy`, req.Strategy,
		`userdata`, req.Userdata,
	)
}
func (h *Settings) ListSubscription(c *gin.Context) {
	h.SetHTTPCacheMaxAge(c, h.maxage)
	h.ServeLazyJSON(c, ``, h.subscription.Load().(time.Time), func() (resp any, e error) {
		var m manipulator.Subscription
		resp, e = m.List()
		if e != nil {
			slog.Warn("settings list subscription",
				log.Error, e,
			)
		}
		return
	})
}
func (h *Settings) AddSubscription(c *gin.Context) {
	var req struct {
		// 給人類看的名稱
		Name string `json:"name"`
		// 訂閱地址
		URL string `json:"url"`
	}
	e := h.Bind(c, &req)
	if e != nil {
		return
	}
	req.Name = strings.TrimSpace(req.Name)
	if req.Name == `` {
		c.String(http.StatusBadRequest, `name invalid`)
		return
	}
	req.URL = strings.TrimSpace(req.URL)
	if req.URL == `` {
		c.String(http.StatusBadRequest, `url invalid`)
		return
	}
	_, e = url.ParseRequestURI(req.URL)
	if e != nil {
		c.String(http.StatusBadRequest, e.Error())
		return
	}

	var m manipulator.Subscription
	var node = data.Subscription{
		Name: req.Name,
		URL:  req.URL,
	}
	e = m.Add(&node)
	if e != nil {
		slog.Warn("settings add subscription",
			log.Error, e,
			`id`, node.ID,
			`name`, req.Name,
			`url`, req.URL,
		)
		c.String(http.StatusInternalServerError, e.Error())
		return
	}
	slog.Info("settings add subscription",
		`id`, node.ID,
		`name`, req.Name,
		`url`, req.URL,
	)
	h.subscription.Store(time.Now())
	c.JSON(http.StatusOK, map[string]any{
		`id`: strconv.FormatUint(node.ID, 10),
	})
}
func (h *Settings) PutSubscription(c *gin.Context) {
	var id struct {
		ID uint64 `uri:"id"`
	}
	e := h.BindURI(c, &id)
	if e != nil {
		return
	} else if id.ID == 0 {
		c.String(http.StatusBadRequest, `id invalid`)
		return
	}
	var req struct {
		// 給人類看的名稱
		Name string `json:"name"`
		// 訂閱地址
		URL string `json:"url"`
	}
	e = h.Bind(c, &req)
	if e != nil {
		return
	}
	req.Name = strings.TrimSpace(req.Name)
	if req.Name == `` {
		c.String(http.StatusBadRequest, `name invalid`)
		return
	}
	req.URL = strings.TrimSpace(req.URL)
	if req.URL == `` {
		c.String(http.StatusBadRequest, `url invalid`)
		return
	}
	_, e = url.ParseRequestURI(req.URL)
	if e != nil {
		c.String(http.StatusBadRequest, e.Error())
		return
	}

	var m manipulator.Subscription
	var node = data.Subscription{
		ID:   id.ID,
		Name: req.Name,
		URL:  req.URL,
	}
	e = m.Put(&node)
	if e != nil {
		slog.Warn("settings put subscription",
			log.Error, e,
			`id`, node.ID,
			`name`, req.Name,
			`url`, req.URL,
		)
		c.String(http.StatusInternalServerError, e.Error())
		return
	}
	slog.Info("settings put subscription",
		`id`, node.ID,
		`name`, req.Name,
		`url`, req.URL,
	)
	h.subscription.Store(time.Now())
}
func (h *Settings) RemoveSubscription(c *gin.Context) {
	var id struct {
		ID uint64 `uri:"id"`
	}
	e := h.BindURI(c, &id)
	if e != nil {
		return
	} else if id.ID == 0 {
		c.String(http.StatusBadRequest, `id invalid`)
		return
	}
	var m manipulator.Subscription
	e = m.Remove(id.ID)
	if e != nil {
		slog.Warn("settings remove subscription",
			log.Error, e,
		)
		c.String(http.StatusInternalServerError, e.Error())
		return
	}
	slog.Info("settings remove subscription",
		`id`, id.ID,
	)
	h.subscription.Store(time.Now())
}
func (h *Settings) ListElement(c *gin.Context) {
	h.SetHTTPCacheMaxAge(c, 0)
	modtime := h.subscription.Load().(time.Time)
	modtime0 := h.element.Load().(time.Time)
	if modtime.Before(modtime0) {
		modtime = modtime0
	}
	h.ServeLazyJSON(c, ``, modtime, func() (resp any, e error) {
		var mSubscription manipulator.Subscription
		type Group struct {
			// 所屬訂閱組
			ID uint64 `json:"id"`
			// 訂閱名稱
			Name string `json:"name"`
			// 訂閱地址
			URL  string          `json:"url"`
			Data []*data.Element `json:"data"`
		}

		subscriptions, e := mSubscription.List()
		if e != nil {
			slog.Warn("settings list element",
				log.Error, e,
			)
			return
		}

		var mElement manipulator.Element
		result := make([]Group, 1, 1+len(subscriptions))
		items, e := mElement.List(0)
		if e != nil {
			slog.Warn("settings list element",
				log.Error, e,
			)
			return
		}
		result[0] = Group{
			ID:   0,
			Name: `manual`,
			URL:  ``,
			Data: items,
		}

		for _, subscription := range subscriptions {
			e = c.Request.Context().Err()
			if e != nil {
				return
			}
			items, e = mElement.List(subscription.ID)
			if e != nil {
				slog.Warn("settings list element",
					log.Error, e,
				)
				return
			}
			result = append(result, Group{
				ID:   subscription.ID,
				Name: subscription.Name,
				URL:  subscription.URL,
				Data: items,
			})
		}
		resp = result
		return
	})
}
