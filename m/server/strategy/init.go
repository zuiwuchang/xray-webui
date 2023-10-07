package strategy

import (
	"context"
	"sync/atomic"
	"time"

	grpc_strategy "github.com/zuiwuchang/xray_webui/protocol/strategy"

	"github.com/grpc-ecosystem/grpc-gateway/v2/runtime"
	"google.golang.org/grpc"
)

type Module int

var _modtime atomic.Value

func (Module) RegisterGRPC(srv *grpc.Server) {
	grpc_strategy.RegisterStrategyServer(srv, server{})
	_modtime.Store(time.Now())
}
func (Module) RegisterGateway(gateway *runtime.ServeMux, cc *grpc.ClientConn) error {
	return grpc_strategy.RegisterStrategyHandler(context.Background(), gateway, cc)
}
