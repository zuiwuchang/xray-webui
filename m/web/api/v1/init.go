package v1

import (
	"github.com/zuiwuchang/xray_webui/m/web"
	"google.golang.org/grpc"

	"github.com/gin-gonic/gin"
)

const BaseURL = `v1`

type Helper struct {
	web.Helper
}

func (h Helper) Register(cc *grpc.ClientConn, router *gin.RouterGroup) {
	r := router.Group(BaseURL)

	ms := []web.IHelper{
		&System{},
		Firewall{},
		&Strategy{},
		&Settings{},
	}
	for _, m := range ms {
		m.Register(cc, r)
	}
}
