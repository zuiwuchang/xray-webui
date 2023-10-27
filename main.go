package main

import (
	"embed"
	"os"

	"github.com/zuiwuchang/xray_webui/cmd"
	"github.com/zuiwuchang/xray_webui/static"
)

//go:embed LICENSE
var license embed.FS

func main() {
	static.LICENSE = license
	if e := cmd.Execute(); e != nil {
		os.Exit(1)
	}
}
