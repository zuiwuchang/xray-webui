package system

import (
	"context"
	"strings"
	"time"

	"github.com/zuiwuchang/xray_webui/configure"
	grpc_system "github.com/zuiwuchang/xray_webui/protocol/system"

	"github.com/grpc-ecosystem/grpc-gateway/v2/runtime"
	"google.golang.org/grpc"
)

type Module int

func (Module) RegisterGRPC(srv *grpc.Server) {
	grpc_system.RegisterSystemServer(srv, server{})

	title := strings.TrimSpace(configure.Default().Title)
	if title != `` {
		titleResponse.Result = title
	}
}
func (Module) RegisterGateway(gateway *runtime.ServeMux, cc *grpc.ClientConn) error {
	startAtResponse.Result = time.Now().Unix()
	return grpc_system.RegisterSystemHandler(context.Background(), gateway, cc)
}
