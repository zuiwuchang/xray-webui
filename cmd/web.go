package cmd

import (
	"fmt"
	"os"
	"path/filepath"

	"log/slog"

	"github.com/zuiwuchang/xray_webui/cmd/internal/web"
	"github.com/zuiwuchang/xray_webui/configure"
	"github.com/zuiwuchang/xray_webui/js"
	"github.com/zuiwuchang/xray_webui/log"
	"github.com/zuiwuchang/xray_webui/utils"

	"github.com/spf13/cobra"
)

func init() {
	var (
		filename    string
		debug, test bool
		basePath    = utils.BasePath()

		addr              string
		certFile, keyFile string
		title, db, script string
	)

	cmd := &cobra.Command{
		Use:   `web`,
		Short: `Start XRay web control server.`,
		Run: func(cmd *cobra.Command, args []string) {
			// 加載設定
			cnf := configure.Default()
			e := cnf.Load(filename)
			if e != nil {
				slog.Error(`load conf fail`,
					log.Error, e,
				)
				os.Exit(1)
			}
			// 覆蓋設定
			if addr != `` {
				cnf.HTTP.Addr = addr
			}

			if certFile != `` {
				cnf.HTTP.CertFile = certFile
			}
			if keyFile != `` {
				cnf.HTTP.KeyFile = keyFile
			}

			if title != `` {
				cnf.System.Title = title
			}
			if db != `` {
				cnf.System.DB = db
			}
			if script != `` {
				cnf.System.Script = script
			}

			if test {
				fmt.Println(cnf)
				return
			}
			// 初始化日誌
			log.Init(basePath, &cnf.Logger)

			system := cnf.System
			system.Format(basePath)

			// 初始化數據庫

			// 初始化腳本
			runtime, e := js.New(system.Script)
			if e != nil {
				slog.Error(`init js fail`,
					log.Error, e,
				)
				os.Exit(1)
			}
			e = runtime.Check()
			if e != nil {
				slog.Error(`check js fail`,
					log.Error, e,
				)
				os.Exit(1)
			}

			// 運行服務
			web.Run(&cnf.HTTP, debug)
		},
	}
	flags := cmd.Flags()
	flags.StringVarP(&filename, `config`,
		`c`,
		utils.Abs(basePath, filepath.Join(`etc`, `xray_webui.jsonnet`)),
		`configure file`,
	)
	flags.StringVarP(&addr, `addr`,
		`a`,
		``,
		`listen address`,
	)
	flags.StringVar(&certFile, `tls-cert`,
		``,
		`tls certificate to use for serving https`,
	)
	flags.StringVar(&keyFile, `tls-key`,
		``,
		`tls key to use for serving https`,
	)
	flags.StringVar(&title, `title`,
		``,
		`web page display title`,
	)
	flags.StringVar(&db, `db`,
		``,
		`database path`,
	)
	flags.StringVar(&script, `script`,
		``,
		`js script path`,
	)
	flags.BoolVarP(&debug, `debug`,
		`d`,
		false,
		`run as debug`,
	)
	flags.BoolVarP(&test, `test`,
		`t`,
		false,
		`test configure`,
	)
	rootCmd.AddCommand(cmd)
}
