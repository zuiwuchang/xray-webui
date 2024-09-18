package v1

import (
	"net/http"
	"strconv"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/zuiwuchang/xray_webui/configure"
	"github.com/zuiwuchang/xray_webui/js"
	"github.com/zuiwuchang/xray_webui/m/web"
	"github.com/zuiwuchang/xray_webui/utils"
	"github.com/zuiwuchang/xray_webui/version"
)

type System struct {
	web.Helper
	maxage  int
	startAt time.Time
	mutex   sync.RWMutex
	core    string
}

func (h *System) Register(router *gin.RouterGroup) {
	h.maxage = 60
	h.startAt = time.Now()

	r := router.Group(`system`)

	r.GET(`title`, h.Title)
	r.HEAD(`title`, h.Title)
	r.GET(`version`, h.Version)
	r.HEAD(`version`, h.Version)
	r.GET(`start_at`, h.StartAt)
	r.HEAD(`start_at`, h.StartAt)
	r.GET(`metadata`, h.Metadata)
	r.HEAD(`metadata`, h.Metadata)
}
func (h *System) Title(c *gin.Context) {
	h.SetHTTPCacheMaxAge(c, h.maxage)
	h.ServeLazyJSON(c, ``, h.startAt, func() (any, error) {
		return map[string]any{
			`result`: configure.Default().System.Title,
		}, nil
	})
}
func (h *System) getCore() (s string) {
	h.mutex.Lock()
	defer h.mutex.Unlock()

	runtime, e := js.New(configure.Default().System.Script)
	if e != nil {
		s = h.core
		return
	}
	s, _ = runtime.Version()
	if s != `` {
		h.core = s
	}
	return
}

func (h *System) Version(c *gin.Context) {
	h.SetHTTPCacheMaxAge(c, h.maxage)
	h.ServeLazyJSON(c, ``, h.startAt, func() (any, error) {
		return map[string]any{
			`platform`: version.Platform,
			`version`:  version.Version,
			`core`:     h.getCore(),
			`commit`:   version.Commit,
			`date`:     version.Date,
			`db`:       version.DB,
		}, nil
	})
}
func (h *System) StartAt(c *gin.Context) {
	h.SetHTTPCacheMaxAge(c, h.maxage)
	h.ServeLazyJSON(c, ``, h.startAt, func() (any, error) {
		return map[string]any{
			`result`: strconv.FormatInt(h.startAt.Unix(), 10),
		}, nil
	})
}
func (h *System) Metadata(c *gin.Context) {
	c.Writer.Header().Set(`Content-Type`, `application/json; charset=utf-8`)
	if gin.Mode() == gin.DebugMode {
		b, e := metadata()
		if e == nil {
			c.String(http.StatusOK, utils.BytesToString(b))
		} else {
			c.String(http.StatusInternalServerError, e.Error())
		}
	} else {
		h.SetHTTPCacheMaxAge(c, h.maxage)
		h.ServeLazy(c, ``, h.startAt, metadata)
	}
}
func metadata() ([]byte, error) {
	runtime, e := js.New(configure.Default().System.Script)
	if e != nil {
		return nil, e
	}
	s, e := runtime.Metadata()
	if e != nil {
		return nil, e
	}
	return utils.StringToBytes(s), nil
}
