package web

import (
	"context"
	"log/slog"
	"math"
	"net"
	"net/http"
	"os"

	"github.com/zuiwuchang/xray_webui/configure"
	"github.com/zuiwuchang/xray_webui/log"
	"github.com/zuiwuchang/xray_webui/m/register"

	"github.com/gin-gonic/gin"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

type Server struct {
	pipe  *PipeListener
	gpipe *grpc.Server

	l net.Listener

	mux *gin.Engine
}

func newServer(l net.Listener, swagger, debug bool, cnf *configure.ServerOption) (s *Server) {
	pipe := ListenPipe()
	clientConn, e := grpc.Dial(`pipe`,
		grpc.WithTransportCredentials(
			insecure.NewCredentials(),
		),
		grpc.WithContextDialer(func(c context.Context, s string) (net.Conn, error) {
			return pipe.DialContext(c, `pipe`, s)
		}),
	)
	if e != nil {
		slog.Error(`pipe`,
			log.Error, e,
		)
		os.Exit(1)
	}

	gateway := newGateway()
	mux := gin.Default()
	mux.RedirectTrailingSlash = false
	register.HTTP(clientConn, mux, gateway, swagger)

	if cnf.MaxConcurrentStreams < 1 {
		cnf.MaxConcurrentStreams = math.MaxUint32
	}
	s = &Server{
		pipe:  pipe,
		gpipe: newGRPC(cnf, gateway, clientConn, debug),
		l:     l,
		mux:   mux,
	}
	return
}

func (s *Server) Serve() (e error) {
	go s.gpipe.Serve(s.pipe)

	e = http.Serve(s.l, s.mux)
	return
}
func (s *Server) ServeTLS(certFile, keyFile string) (e error) {
	go s.gpipe.Serve(s.pipe)

	e = http.ServeTLS(s.l, s.mux, certFile, keyFile)
	return
}
