package web

import (
	"context"

	"github.com/zuiwuchang/xray_webui/configure"
	"github.com/zuiwuchang/xray_webui/m/register"

	grpc_middleware "github.com/grpc-ecosystem/go-grpc-middleware"
	grpc_auth "github.com/grpc-ecosystem/go-grpc-middleware/auth"
	grpc_recovery "github.com/grpc-ecosystem/go-grpc-middleware/recovery"
	"github.com/grpc-ecosystem/grpc-gateway/v2/runtime"
	"google.golang.org/grpc"
)

func auth(ctx context.Context) (context.Context, error) {
	return ctx, nil
}
func newGRPC(cnf *configure.ServerOption, gateway *runtime.ServeMux, cc *grpc.ClientConn, debug bool) (srv *grpc.Server) {
	opts := []grpc.ServerOption{
		grpc.WriteBufferSize(cnf.WriteBufferSize),
		grpc.ReadBufferSize(cnf.ReadBufferSize),

		grpc.InitialWindowSize(cnf.InitialWindowSize),
		grpc.InitialConnWindowSize(cnf.InitialConnWindowSize),

		// grpc.MaxConcurrentStreams(cnf.MaxConcurrentStreams),
		// grpc.ConnectionTimeout(time.Second * 10),
		// grpc.KeepaliveParams(cnf.Keepalive),
	}
	if cnf.MaxRecvMsgSize > 0 {
		opts = append(opts, grpc.MaxRecvMsgSize(cnf.MaxRecvMsgSize))
	}
	if cnf.MaxSendMsgSize > 0 {
		opts = append(opts, grpc.MaxSendMsgSize(cnf.MaxSendMsgSize))
	}

	if debug {
		opts = append(opts,
			grpc.StreamInterceptor(grpc_middleware.ChainStreamServer(
				grpc_auth.StreamServerInterceptor(auth),
			)),
			grpc.UnaryInterceptor(grpc_middleware.ChainUnaryServer(
				grpc_auth.UnaryServerInterceptor(auth),
			)),
		)
	} else {
		opts = append(opts,
			grpc.StreamInterceptor(grpc_middleware.ChainStreamServer(
				grpc_recovery.StreamServerInterceptor(),
				grpc_auth.StreamServerInterceptor(auth),
			)),
			grpc.UnaryInterceptor(grpc_middleware.ChainUnaryServer(
				grpc_recovery.UnaryServerInterceptor(),
				grpc_auth.UnaryServerInterceptor(auth),
			)),
		)
	}

	srv = grpc.NewServer(opts...)
	register.GRPC(srv, gateway, cc)
	return
}
