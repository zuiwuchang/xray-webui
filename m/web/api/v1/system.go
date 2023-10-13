package v1

import (
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/zuiwuchang/xray_webui/configure"
	"github.com/zuiwuchang/xray_webui/m/web"
	"github.com/zuiwuchang/xray_webui/version"
	"google.golang.org/grpc"
)

type System struct {
	web.Helper
	maxage  int
	startAt time.Time
}

func (h *System) Register(cc *grpc.ClientConn, router *gin.RouterGroup) {
	h.maxage = 60
	h.startAt = time.Now()

	r := router.Group(`system`)

	r.GET(`title`, h.Title)
	r.HEAD(`title`, h.Title)
	r.GET(`version`, h.Version)
	r.HEAD(`version`, h.Version)
	r.GET(`start_at`, h.StartAt)
	r.HEAD(`start_at`, h.StartAt)

}
func (h *System) Title(c *gin.Context) {
	h.SetHTTPCacheMaxAge(c, h.maxage)
	h.ServeLazyJSON(c, ``, h.startAt, func() (any, error) {
		return map[string]any{
			`result`: configure.Default().System.Title,
		}, nil
	})
}
func (h *System) Version(c *gin.Context) {
	h.SetHTTPCacheMaxAge(c, h.maxage)
	h.ServeLazyJSON(c, ``, h.startAt, func() (any, error) {
		return map[string]any{
			`platform`: version.Platform,
			`version`:  version.Version,
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
