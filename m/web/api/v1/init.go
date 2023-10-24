package v1

import (
	"github.com/zuiwuchang/xray_webui/m/web"

	"github.com/gin-gonic/gin"
)

const BaseURL = `v1`

type Helper struct {
	web.Helper
}

func (h Helper) Register(router *gin.RouterGroup) {
	r := router.Group(BaseURL)

	ms := []web.IHelper{
		&System{},
		Firewall{},
		&Strategy{},
		&Settings{},
		Proxy{},
	}
	for _, m := range ms {
		m.Register(r)
	}
}
