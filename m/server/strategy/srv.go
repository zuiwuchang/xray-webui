package strategy

import (
	"context"
	"log/slog"
	"time"

	"github.com/zuiwuchang/xray_webui/db/data"
	"github.com/zuiwuchang/xray_webui/db/manipulator"
	"github.com/zuiwuchang/xray_webui/log"
	"github.com/zuiwuchang/xray_webui/m/helper"
	grpc_strategy "github.com/zuiwuchang/xray_webui/protocol/strategy"
	"google.golang.org/grpc/codes"
)

type server struct {
	grpc_strategy.UnimplementedStrategyServer
	helper.Helper
}

var emptyListResponse grpc_strategy.ListResponse

func (s server) List(ctx context.Context, req *grpc_strategy.ListRequest) (resp *grpc_strategy.ListResponse, e error) {
	s.SetHTTPCacheMaxAge(ctx, 0)
	modtime := _modtime.Load().(time.Time)
	e = s.ServeMessage(ctx,
		modtime,
		func(nobody bool) error {
			if nobody {
				resp = &emptyListResponse
			} else {
				var m manipulator.Strategy
				items, e := m.List()
				if e != nil {
					if e != nil {
						slog.Warn("strategy list",
							log.Error, e,
						)
					}
					return e
				} else if len(items) == 0 {
					resp = &emptyListResponse
				} else {
					resp = &grpc_strategy.ListResponse{
						Data: make([]*grpc_strategy.Data, len(items)),
					}
					for i, item := range items {
						resp.Data[i] = &grpc_strategy.Data{
							Id:           item.ID,
							Host:         item.Host,
							ProxyIP:      item.ProxyIP,
							ProxyDomain:  item.ProxyDomain,
							DirectIP:     item.DirectIP,
							DirectDomain: item.DirectDomain,
							BlockIP:      item.BlockIP,
							BlockDomain:  item.BlockDomain,
						}
					}
				}
			}
			return nil
		},
	)
	return
}

var emptySetResponse grpc_strategy.SetResponse

func (s server) Set(ctx context.Context, req *grpc_strategy.SetRequest) (resp *grpc_strategy.SetResponse, e error) {
	if req.Id < 1 || req.Id > 6 {
		e = s.Error(codes.InvalidArgument, `Strategy.ID not support`)
		return
	}
	var m manipulator.Strategy
	e = m.Put(&data.Strategy{
		ID:           req.Id,
		Host:         req.Host,
		ProxyIP:      req.ProxyIP,
		ProxyDomain:  req.ProxyDomain,
		DirectIP:     req.DirectIP,
		DirectDomain: req.DirectDomain,
		BlockIP:      req.BlockIP,
		BlockDomain:  req.BlockDomain,
	})
	if e != nil {
		slog.Warn("strategy set",
			log.Error, e,
			`id`, req.Id,
			`host`, req.Host,
			`proxyIP`, req.ProxyIP,
			`proxyDomain`, req.ProxyDomain,
			`directIP`, req.DirectIP,
			`directDomain`, req.DirectDomain,
			`blockIP`, req.BlockIP,
			`blockDomain`, req.BlockDomain,
		)
		return
	}
	slog.Info("strategy set",
		`id`, req.Id,
		`host`, req.Host,
		`proxyIP`, req.ProxyIP,
		`proxyDomain`, req.ProxyDomain,
		`directIP`, req.DirectIP,
		`directDomain`, req.DirectDomain,
		`blockIP`, req.BlockIP,
		`blockDomain`, req.BlockDomain,
	)
	_modtime.Store(time.Now())
	resp = &emptySetResponse
	return
}
