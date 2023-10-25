package v1

import (
	"context"
	"encoding/base64"
	"errors"
	"io"
	"log/slog"
	"net/http"
	"net/url"
	"strings"
	"sync/atomic"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/go-jsonnet"
	"github.com/zuiwuchang/xray_webui/db/data"
	"github.com/zuiwuchang/xray_webui/db/manipulator"
	"github.com/zuiwuchang/xray_webui/log"
	"github.com/zuiwuchang/xray_webui/m/web"
)

type Settings struct {
	web.Helper
	maxage       int
	general      atomic.Value
	subscription atomic.Value
	element      atomic.Value
}

func (h *Settings) Register(router *gin.RouterGroup) {
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
	r.POST(`element/:id`, h.UpdateElement)
	r.DELETE(`elements/:id`, h.ClearElement)
	r.DELETE(`element/:subscription/:id`, h.DeleteElement)
	r.POST(`element_add/:subscription`, h.AddElement)
	r.POST(`element_set/:subscription/:id`, h.SetElement)
	r.POST(`element_import/:subscription`, h.ImportElement)
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
		`id`: node.ID,
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
func (h *Settings) UpdateElement(c *gin.Context) {
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
	var mSubscription manipulator.Subscription
	subscription, e := mSubscription.Get(id.ID)
	if e != nil {
		c.String(http.StatusInternalServerError, e.Error())
		return
	} else if _, e = url.ParseRequestURI(subscription.URL); e != nil {
		c.String(http.StatusInternalServerError, e.Error())
		return
	}
	ctx := c.Request.Context()
	e = ctx.Err()
	if e != nil {
		c.String(http.StatusInternalServerError, e.Error())
		return
	}
	result, e := h.update(ctx, subscription.URL)
	if e != nil {
		c.String(http.StatusInternalServerError, e.Error())
		return
	}

	e = ctx.Err()
	if e != nil {
		c.String(http.StatusInternalServerError, e.Error())
		return
	}
	var mElement manipulator.Element
	items, e := mElement.Update(id.ID, result)
	if e != nil {
		c.String(http.StatusInternalServerError, e.Error())
		return
	}
	c.JSON(http.StatusOK, items)
	h.element.Store(time.Now())
}
func (h *Settings) update(ctx context.Context, url string) (result []string, e error) {
	req, e := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if e != nil {
		return
	}
	resp, e := http.DefaultClient.Do(req)
	if e != nil {
		return
	} else if resp.Body == nil {
		e = errors.New(`body nil`)
		return
	}
	defer resp.Body.Close()
	b, e := io.ReadAll(io.LimitReader(resp.Body, 1024*1024*10))
	if e != nil {
		return
	}
	enc := strings.TrimRight(strings.TrimSpace(string(b)), "=")

	b, e = base64.RawStdEncoding.DecodeString(enc)
	if e != nil {
		b0, e0 := base64.RawURLEncoding.DecodeString(enc)
		if e0 != nil {
			return
		}
		b = b0
	}
	strs := strings.Split(string(b), "\n")
	result = make([]string, 0, len(strs))
	for _, s := range strs {
		s = strings.TrimSpace(s)
		if s == `` {
			continue
		}
		result = append(result, s)
	}
	return
}
func (h *Settings) ClearElement(c *gin.Context) {
	var id struct {
		ID uint64 `uri:"id"`
	}
	e := h.BindURI(c, &id)
	if e != nil {
		return
	}
	var m manipulator.Element
	e = m.Clear(id.ID)
	if e != nil {
		c.String(http.StatusInternalServerError, e.Error())
		slog.Warn("settings clear element",
			log.Error, e,
			`id`, id.ID,
		)
		return
	}
	slog.Info("settings clear element",
		`id`, id.ID,
	)
	now := time.Now()
	h.subscription.Store(now)
	h.element.Store(now)
}
func (h *Settings) DeleteElement(c *gin.Context) {
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

	var m manipulator.Element
	e = m.Remove(id.Subscription, id.ID)
	if e != nil {
		c.String(http.StatusInternalServerError, e.Error())
		slog.Warn("settings delete element",
			log.Error, e,
			`subscription`, id.Subscription,
			`id`, id.ID,
		)
		return
	}
	slog.Info("settings delete element",
		`subscription`, id.Subscription,
		`id`, id.ID,
	)
	now := time.Now()
	h.subscription.Store(now)
	h.element.Store(now)
}
func (h *Settings) AddElement(c *gin.Context) {
	var id struct {
		Subscription uint64 `uri:"subscription"`
	}
	e := h.BindURI(c, &id)
	if e != nil {
		return
	}
	var req struct {
		URL string `json:"url"`
	}
	e = h.Bind(c, &req)
	if e != nil {
		return
	}

	var m manipulator.Element
	newid, e := m.Add(id.Subscription, req.URL)
	if e != nil {
		slog.Warn(`add element fail`,
			log.Error, e,
			`subscription`, id.Subscription,
			`url`, req.URL,
		)
		c.String(http.StatusInternalServerError, e.Error())
		return
	}
	slog.Info(`add element success`,
		`subscription`, id.Subscription,
		`id`, newid,
		`url`, req.URL,
	)
	c.JSON(http.StatusOK, map[string]any{
		`id`: newid,
	})
	now := time.Now()
	h.subscription.Store(now)
	h.element.Store(now)
}
func (h *Settings) SetElement(c *gin.Context) {
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
		URL string `json:"url"`
	}
	e = h.Bind(c, &req)
	if e != nil {
		return
	}

	var m manipulator.Element
	e = m.Set(id.Subscription, id.ID, req.URL)
	if e != nil {
		slog.Warn(`set element fail`,
			log.Error, e,
			`subscription`, id.Subscription,
			`id`, id.ID,
			`url`, req.URL,
		)
		c.String(http.StatusInternalServerError, e.Error())
		return
	}
	slog.Info(`set element success`,
		`subscription`, id.Subscription,
		`id`, id.ID,
		`url`, req.URL,
	)
	c.Status(http.StatusNoContent)

	now := time.Now()
	h.subscription.Store(now)
	h.element.Store(now)
}
func (h *Settings) ImportElement(c *gin.Context) {
	var id struct {
		Subscription uint64 `uri:"subscription"`
	}
	e := h.BindURI(c, &id)
	if e != nil {
		return
	}
	var req struct {
		URL []string `json:"urls"`
	}
	e = h.Bind(c, &req)
	if e != nil {
		return
	}

	var m manipulator.Element
	ids, e := m.Import(id.Subscription, req.URL)
	if e != nil {
		slog.Warn(`import element fail`,
			log.Error, e,
			`subscription`, id.Subscription,
			`urls`, req.URL,
		)
		c.String(http.StatusInternalServerError, e.Error())
		return
	}
	slog.Info(`import element success`,
		`subscription`, id.Subscription,
		`ids`, ids,
		`urls`, req.URL,
	)
	c.JSON(http.StatusOK, map[string]any{
		`ids`: ids,
	})

	now := time.Now()
	h.subscription.Store(now)
	h.element.Store(now)
}
