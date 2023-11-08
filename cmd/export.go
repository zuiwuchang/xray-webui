package cmd

import (
	"log"
	"path/filepath"

	"github.com/spf13/cobra"
	"github.com/zuiwuchang/xray_webui/db/manipulator"
	"github.com/zuiwuchang/xray_webui/utils"
)

func init() {
	var (
		filename string
		basePath = utils.BasePath()
		db       string
	)

	cmd := &cobra.Command{
		Use:   `export`,
		Short: `Export the settings in the database to a json file.`,
		Run: func(cmd *cobra.Command, args []string) {
			e := manipulator.Export(db, filename)
			if e != nil {
				log.Fatalln(e)
			}
		},
	}
	flags := cmd.Flags()
	flags.StringVarP(&filename, `json`,
		`j`,
		utils.Abs(basePath, `db.json`),
		`output json file path`,
	)
	flags.StringVarP(&db, `db`,
		`d`,
		utils.Abs(basePath, filepath.Join(`var`, `xray.db`)),
		`database path`,
	)
	rootCmd.AddCommand(cmd)
}
