package register

import (
	"log/slog"
	"os"

	"github.com/zuiwuchang/xray_webui/log"
	m_settings "github.com/zuiwuchang/xray_webui/m/server/settings"

	"github.com/grpc-ecosystem/grpc-gateway/v2/runtime"
	"google.golang.org/grpc"
)

func GRPC(srv *grpc.Server, gateway *runtime.ServeMux, cc *grpc.ClientConn) {
	ms := []Module{
		m_settings.Module(0),
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
