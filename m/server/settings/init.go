package settings

import (
	"context"
	"sync/atomic"
	"time"

	grpc_settings "github.com/zuiwuchang/xray_webui/protocol/settings"

	"github.com/grpc-ecosystem/grpc-gateway/v2/runtime"
	"google.golang.org/grpc"
)

type Module int

var _general atomic.Value
var _subscription atomic.Value
var _element atomic.Value

func (Module) RegisterGRPC(srv *grpc.Server) {
	grpc_settings.RegisterSettingsServer(srv, server{})

	now := time.Now()
	_general.Store(now)
	_subscription.Store(now)
	_element.Store(now)
}
func (Module) RegisterGateway(gateway *runtime.ServeMux, cc *grpc.ClientConn) error {
	return grpc_settings.RegisterSettingsHandler(context.Background(), gateway, cc)
}
