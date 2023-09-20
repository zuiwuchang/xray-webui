package cmd

import (
	"fmt"
	"os"
	"path/filepath"

	"log/slog"

	"github.com/zuiwuchang/xray_webui/cmd/internal/web"
	"github.com/zuiwuchang/xray_webui/configure"
	"github.com/zuiwuchang/xray_webui/log"
	"github.com/zuiwuchang/xray_webui/utils"

	"github.com/spf13/cobra"
)

func init() {
	var (
		filename    string
		debug, test bool
		basePath    = utils.BasePath()

		addr string
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
			if addr != `` {
				cnf.HTTP.Addr = addr
			}
			if test {
				fmt.Println(cnf)
				return
			}
			// 初始化日誌
			log.Init(basePath, &cnf.Logger)

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
