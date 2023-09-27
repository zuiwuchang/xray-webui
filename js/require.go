package js

import (
	"path/filepath"
	"sync"

	"github.com/dop251/goja_nodejs/require"
	"github.com/zuiwuchang/xray_webui/utils"
)

var registry *require.Registry
var rw sync.RWMutex

func Registry() *require.Registry {
	rw.RLock()
	v := registry
	rw.RUnlock()
	if v != nil {
		return v
	}

	rw.Lock()
	defer rw.Unlock()
	v = registry
	if v != nil {
		return v
	}
	basePath := utils.BasePath()
	modules := []string{
		filepath.Join(basePath, `.node_modules`),
	}
	registry = require.NewRegistry(
		require.WithGlobalFolders(modules...),
	)
	registry.RegisterNativeModule(`xray/core`, RegisterCore)
	return registry
}
