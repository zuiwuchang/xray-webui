package main

import (
	"os"

	"github.com/zuiwuchang/xray_webui/cmd"
)

func main() {
	if e := cmd.Execute(); e != nil {
		os.Exit(1)
	}
}
