package register

import (
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/grpc-ecosystem/grpc-gateway/v2/runtime"
	"github.com/zuiwuchang/xray_webui/m/web"
	"github.com/zuiwuchang/xray_webui/m/web/api"
	"github.com/zuiwuchang/xray_webui/static"
	"github.com/zuiwuchang/xray_webui/version"
	"google.golang.org/grpc"
)

const (
	cacheControl = `max-age=300`
)

func HTTP(cc *grpc.ClientConn, engine *gin.Engine, gateway *runtime.ServeMux, swagger bool) {
	var w web.Helper
	compression := w.Compression()
	engine.NoRoute(func(c *gin.Context) {
		c.Status(http.StatusOK)
		if !strings.HasPrefix(c.Request.URL.Path, `/api/`) {
			compression(c)
		}
	}, func(c *gin.Context) {
		p := c.Request.URL.Path
		if strings.HasPrefix(p, `/api/`) {
			gateway.ServeHTTP(c.Writer, c.Request)
		} else {
			readerFilesystem(c, static.View(), p, true)
		}
	})
	registerFilesystem(engine.Group(`static`).Use(compression), static.Static())

	if swagger {
		registerFilesystem(engine.Group(`document`).Use(compression), static.Document())
	}

	// LICENSE
	engine.GET(`LICENSE`, compression, readerLICENSE)
	engine.HEAD(`LICENSE`, compression, readerLICENSE)

	// other gin route
	var apis api.Helper
	apis.Register(cc, &engine.RouterGroup)
}
func registerFilesystem(routers gin.IRoutes, fs http.FileSystem) {
	f := func(c *gin.Context) {
		var obj struct {
			Path string `uri:"filepath" `
		}
		e := c.ShouldBindUri(&obj)
		if e != nil {
			return
		}
		readerFilesystem(c, fs, obj.Path, false)
	}
	routers.GET(`*filepath`, f)
	routers.HEAD(`*filepath`, f)
}

func readerLICENSE(c *gin.Context) {
	c.Header(`Content-Type`, `text/plain; charset=utf-8`)
	readerFilesystem(c, http.FS(static.LICENSE), `LICENSE`, false)
}

func readerFilesystem(c *gin.Context, fs http.FileSystem, path string, index bool) {
	if path == `/` || path == `` {
		path = `/index.html`
	}
	f, e := fs.Open(path)
	if e != nil {
		if index && path != `/index.html` && os.IsNotExist(e) {
			path = `/index.html`
			f, e = fs.Open(path)
			if e != nil {
				toHTTPError(c, path, e)
				return
			}
		} else {
			toHTTPError(c, path, e)
			return
		}
	}

	stat, e := f.Stat()
	if e != nil {
		f.Close()
		toHTTPError(c, path, e)
		return
	}
	if stat.IsDir() {
		f.Close()
		c.String(http.StatusForbidden, `is a dir: `+path)
		return
	}

	_, name := filepath.Split(path)
	modTime := stat.ModTime()
	if !modTime.IsZero() {
		c.Header(`Cache-Control`, cacheControl)
	} else if !version.ModTime.IsZero() {
		c.Header(`Cache-Control`, cacheControl)
		modTime = version.ModTime
	}
	http.ServeContent(c.Writer, c.Request, name, modTime, f)
	f.Close()
}
func toHTTPError(c *gin.Context, name string, e error) {
	if os.IsNotExist(e) {
		c.String(http.StatusNotFound, `not exists: `+name)
		return
	}
	if os.IsExist(e) {
		c.String(http.StatusForbidden, `already exists: `+name)
		return
	}
	if os.IsPermission(e) {
		c.String(http.StatusForbidden, `forbidden: `+name)
		return
	}
	c.String(http.StatusInternalServerError, e.Error())
}
