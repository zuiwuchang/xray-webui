package web

import (
	"log/slog"
	"net"
	"net/http"
	"os"

	"github.com/zuiwuchang/xray_webui/configure"
	"github.com/zuiwuchang/xray_webui/log"
	"github.com/zuiwuchang/xray_webui/m/register"

	"github.com/gin-gonic/gin"
)

func Run(cnf *configure.HTTP, debug bool) {
	if debug {
		gin.SetMode(gin.DebugMode)
	} else {
		gin.SetMode(gin.ReleaseMode)
	}

	// listen
	l, e := net.Listen(`tcp`, cnf.Addr)
	if e != nil {
		slog.Error(`listen tcp fail`,
			log.Error, e,
		)
		os.Exit(1)
	}
	h2 := cnf.H2()
	slog.Info(`listen success`,
		`addr`, cnf.Addr,
		`h2`, h2,
	)
	mux := gin.Default()
	mux.RedirectTrailingSlash = false
	// basic auth
	var accounts map[string]string
	if len(cnf.Accounts) != 0 {
		accounts = make(map[string]string)
		for _, item := range cnf.Accounts {
			accounts[item.Name] = item.Password
		}
		mux.RouterGroup.Use(gin.BasicAuth(accounts))
	}
	// serve
	register.HTTP(mux)
	if h2 {
		http.ServeTLS(l, mux, cnf.CertFile, cnf.KeyFile)
	} else {
		http.Serve(l, mux)
	}
	if e != nil {
		slog.Error(`serve fail`,
			log.Error, e,
		)
		os.Exit(1)
	}
}
