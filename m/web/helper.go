package web

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"strconv"
	"time"

	"github.com/zuiwuchang/xray_webui/m/web/contrib/compression"

	"github.com/gin-gonic/gin"
	"github.com/gin-gonic/gin/binding"
)

var _compression = compression.Compression(
	compression.BrDefaultCompression,
	compression.GzDefaultCompression,
)

type Helper int

func (h Helper) Response(c *gin.Context, code int, data interface{}) {
	c.JSON(code, data)
}

func (h Helper) BindURI(c *gin.Context, obj interface{}) (e error) {
	e = c.ShouldBindUri(obj)
	if e != nil {
		c.String(http.StatusBadRequest, e.Error())
		return
	}
	return
}
func (h Helper) Bind(c *gin.Context, obj interface{}) error {
	b := binding.Default(c.Request.Method, c.ContentType())
	return h.BindWith(c, obj, b)
}
func (h Helper) BindWith(c *gin.Context, obj interface{}, b binding.Binding) (e error) {
	e = c.ShouldBindWith(obj, b)
	if e != nil {
		c.String(http.StatusBadRequest, e.Error())
		return
	}
	return
}
func (h Helper) BindQuery(c *gin.Context, obj interface{}) error {
	return h.BindWith(c, obj, binding.Query)
}
func (h Helper) Compression() gin.HandlerFunc {
	return _compression
}
func (h Helper) SetHTTPCacheMaxAge(c *gin.Context, maxAge int) {
	c.Writer.Header().Set(`Cache-Control`, `max-age=`+strconv.Itoa(maxAge))
}
func (h Helper) ServeJSON(c *gin.Context, name string, modtime time.Time, o any) {
	h.ServeLazyJSON(c, name, modtime, func() (any, error) {
		return o, nil
	})
}
func (h Helper) ServeLazyJSON(c *gin.Context, name string, modtime time.Time, f func() (resp any, e error)) {
	c.Writer.Header().Set(`Content-Type`, `application/json; charset=utf-8`)
	http.ServeContent(c.Writer, c.Request, name, modtime, &lazyJSON{f: f})
}

type lazyJSON struct {
	f       func() (any, error)
	content io.ReadSeeker
}

func (l *lazyJSON) Read(p []byte) (int, error) {
	if l.content == nil {
		e := l.init()
		if e != nil {
			return 0, e
		}
	}
	return l.content.Read(p)
}
func (l *lazyJSON) Seek(offset int64, whence int) (int64, error) {
	if l.content == nil {
		e := l.init()
		if e != nil {
			return 0, e
		}
	}
	return l.content.Seek(offset, whence)
}
func (l *lazyJSON) init() error {
	o, e := l.f()
	if e != nil {
		return e
	}
	b, e := json.Marshal(o)
	if e != nil {
		return e
	}
	l.content = bytes.NewReader(b)
	return nil
}
