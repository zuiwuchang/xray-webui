package settings

import (
	"context"
	"log/slog"
	"time"

	"github.com/google/go-jsonnet"
	"github.com/zuiwuchang/xray_webui/db/data"
	"github.com/zuiwuchang/xray_webui/db/manipulator"
	"github.com/zuiwuchang/xray_webui/log"
	"github.com/zuiwuchang/xray_webui/m/helper"
	grpc_settings "github.com/zuiwuchang/xray_webui/protocol/settings"
	"google.golang.org/grpc/codes"
)

type server struct {
	grpc_settings.UnimplementedSettingsServer
	helper.Helper
}

var emptyGeneral grpc_settings.General

func (s server) GetGeneral(ctx context.Context, req *grpc_settings.GetGeneralRequest) (resp *grpc_settings.General, e error) {
	s.SetHTTPCacheMaxAge(ctx, 0)
	modtime := _general.Load().(time.Time)
	e = s.ServeMessage(ctx,
		modtime,
		func(nobody bool) error {
			if nobody {
				resp = &emptyGeneral
			} else {
				var m manipulator.Settings
				data, e := m.GetGeneral()
				if e != nil {
					if e != nil {
						slog.Warn("settings get general",
							log.Error, e,
						)
					}
					return e
				} else {
					resp = &grpc_settings.General{
						Url:      data.URL,
						Run:      data.Run,
						Firewall: data.Firewall,
						Strategy: data.Strategy,
						Userdata: data.Userdata,
					}
				}
			}
			return nil
		},
	)
	return
}

var emptySetGeneralResponse grpc_settings.SetGeneralResponse

func (s server) SetGeneral(ctx context.Context, req *grpc_settings.General) (resp *grpc_settings.SetGeneralResponse, e error) {
	if req.Strategy < 1 || req.Strategy > 6 {
		e = s.Error(codes.InvalidArgument, `General.Strategy not support`)
		return
	}
	vm := jsonnet.MakeVM()
	_, e = vm.EvaluateAnonymousSnippet(`userdata.jsonnet`, req.Userdata)
	if e != nil {
		e = s.Error(codes.InvalidArgument, e.Error())
		return
	}

	var m manipulator.Settings
	e = m.PutGeneral(&data.General{
		URL:      req.Url,
		Run:      req.Run,
		Firewall: req.Firewall,
		Strategy: req.Strategy,
		Userdata: req.Userdata,
	})
	if e != nil {
		slog.Warn("settings set general",
			log.Error, e,
			`url`, req.Url,
			`run`, req.Run,
			`firewall`, req.Firewall,
			`strategy`, req.Strategy,
			`userdata`, req.Userdata,
		)
		return
	}
	slog.Info("settings set general",
		`url`, req.Url,
		`run`, req.Run,
		`firewall`, req.Firewall,
		`strategy`, req.Strategy,
		`userdata`, req.Userdata,
	)
	_general.Store(time.Now())
	resp = &emptySetGeneralResponse
	return
}
