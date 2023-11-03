package web

import (
	"log/slog"
	"net"
	"net/http"
	"os"
	"path/filepath"

	"github.com/zuiwuchang/xray_webui/configure"
	"github.com/zuiwuchang/xray_webui/log"
	"github.com/zuiwuchang/xray_webui/m/register"
	"github.com/zuiwuchang/xray_webui/m/single"
	"github.com/zuiwuchang/xray_webui/utils"

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
	// 註冊路由
	register.HTTP(mux)
	// 刪除 臨時配置檔案
	os.RemoveAll(filepath.Join(utils.BasePath(), `var`, `conf`))
	// 運行單件服務
	single.Run()
	// serve
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
