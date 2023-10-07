package js

import (
	"path/filepath"

	"github.com/dop251/goja_nodejs/require"
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
	registry.RegisterNativeModule(`xray/core`, RegisterCore)
	return registry
}
