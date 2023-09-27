package firewall

import (
	"context"
	"log/slog"

	"github.com/zuiwuchang/xray_webui/configure"
	"github.com/zuiwuchang/xray_webui/js"
	"github.com/zuiwuchang/xray_webui/log"
	"github.com/zuiwuchang/xray_webui/m/helper"
	grpc_firewall "github.com/zuiwuchang/xray_webui/protocol/firewall"
)

type server struct {
	grpc_firewall.UnimplementedFirewallServer
	helper.Helper
}

func (s server) Get(ctx context.Context, req *grpc_firewall.GetRequest) (resp *grpc_firewall.GetResponse, e error) {
	vm, e := js.New(configure.Default().System.Script)
	if e != nil {
		slog.Warn("firewall get error",
			log.Error, e,
		)
		return
	}
	result, e := vm.GetFirewall()
	if e != nil {
		slog.Warn("firewall get error",
			log.Error, e,
		)
		return
	}
	resp = &grpc_firewall.GetResponse{
		Result: result,
	}
	return
}
