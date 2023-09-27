package firewall

import (
	"context"

	grpc_firewall "github.com/zuiwuchang/xray_webui/protocol/firewall"

	"github.com/grpc-ecosystem/grpc-gateway/v2/runtime"
	"google.golang.org/grpc"
)

type Module int

func (Module) RegisterGRPC(srv *grpc.Server) {
	grpc_firewall.RegisterFirewallServer(srv, server{})

}
func (Module) RegisterGateway(gateway *runtime.ServeMux, cc *grpc.ClientConn) error {
	return grpc_firewall.RegisterFirewallHandler(context.Background(), gateway, cc)
}
