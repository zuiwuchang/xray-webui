package main

import (
	"embed"
	"fmt"
	"net/url"
	"os"

	"github.com/zuiwuchang/xray_webui/cmd"
	"github.com/zuiwuchang/xray_webui/static"
)

//go:embed LICENSE
var license embed.FS

func main() {
	var u url.URL
	u.Scheme = `http`
	u.Host = `ko`
	u.User = url.UserPassword(`king`, `123`)
	fmt.Println(u.String())
	u.User = url.User(`king`)
	fmt.Println(u.String())

	static.LICENSE = license
	if e := cmd.Execute(); e != nil {
		os.Exit(1)
	}
}
