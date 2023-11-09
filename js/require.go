package js

import (
	"path/filepath"

	"github.com/zuiwuchang/xray_webui/js/console"
	"github.com/zuiwuchang/xray_webui/js/core"
	"github.com/zuiwuchang/xray_webui/js/require"
	"github.com/zuiwuchang/xray_webui/js/systemctl"
	"github.com/zuiwuchang/xray_webui/utils"
)

func Registry() *require.Registry {
	basePath := utils.BasePath()
	modules := []string{
		filepath.Join(basePath, `.node_modules`),
	}
	registry := require.NewRegistry(
		require.WithGlobalFolders(modules...),
	)
	registry.RegisterNativeModule(core.ModuleID, core.Require)
	registry.RegisterNativeModule(systemctl.ModuleID, systemctl.Require)
	registry.RegisterNativeModule(console.ModuleID, console.Require)

	return registry
}
