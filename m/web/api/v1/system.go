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

var (
	startAt      = time.Now()
	systemMaxAge = 0
)

type System struct {
	web.Helper
}

func (h System) Register(cc *grpc.ClientConn, router *gin.RouterGroup) {
	r := router.Group(`system`)

	r.GET(`title`, h.title)
	r.HEAD(`title`, h.title)
	r.GET(`version`, h.version)
	r.HEAD(`version`, h.version)
	r.GET(`start_at`, h.startAt)
	r.HEAD(`start_at`, h.startAt)

}
func (h System) title(c *gin.Context) {
	h.SetHTTPCacheMaxAge(c, systemMaxAge)
	h.ServeLazyJSON(c, ``, startAt, func() (any, error) {
		return map[string]any{
			`result`: configure.Default().System.Title,
		}, nil
	})
}
func (h System) version(c *gin.Context) {
	h.SetHTTPCacheMaxAge(c, systemMaxAge)
	h.ServeLazyJSON(c, ``, startAt, func() (any, error) {
		return map[string]any{
			`platform`: version.Platform,
			`version`:  version.Version,
			`commit`:   version.Commit,
			`date`:     version.Date,
			`db`:       version.DB,
		}, nil
	})
}
func (h System) startAt(c *gin.Context) {
	h.SetHTTPCacheMaxAge(c, systemMaxAge)
	h.ServeLazyJSON(c, ``, startAt, func() (any, error) {
		return map[string]any{
			`result`: strconv.FormatInt(startAt.Unix(), 10),
		}, nil
	})
}
