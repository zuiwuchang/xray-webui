package register

import (
	"log/slog"
	"os"

	"github.com/zuiwuchang/xray_webui/log"
	m_firewall "github.com/zuiwuchang/xray_webui/m/server/firewall"
	m_strategy "github.com/zuiwuchang/xray_webui/m/server/strategy"
	m_system "github.com/zuiwuchang/xray_webui/m/server/system"

	"github.com/grpc-ecosystem/grpc-gateway/v2/runtime"
	"google.golang.org/grpc"
)

func GRPC(srv *grpc.Server, gateway *runtime.ServeMux, cc *grpc.ClientConn) {
	ms := []Module{
		m_system.Module(0),
		m_firewall.Module(0),
		m_strategy.Module(0),
	}
	for _, m := range ms {
		m.RegisterGRPC(srv)
		e := m.RegisterGateway(gateway, cc)
		if e != nil {
			slog.Error(`register grpc`,
				log.Error, e,
			)
			os.Exit(1)
		}
	}
}

type Module interface {
	RegisterGRPC(srv *grpc.Server)
	RegisterGateway(gateway *runtime.ServeMux, cc *grpc.ClientConn) error
}
