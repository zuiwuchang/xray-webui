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
	bolt "go.etcd.io/bbolt"
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

var emptyListSubscriptionResponse grpc_settings.ListSubscriptionResponse

func (s server) ListSubscription(ctx context.Context, req *grpc_settings.ListSubscriptionRequest) (resp *grpc_settings.ListSubscriptionResponse, e error) {
	s.SetHTTPCacheMaxAge(ctx, 0)
	modtime := _subscription.Load().(time.Time)
	e = s.ServeMessage(ctx,
		modtime,
		func(nobody bool) error {
			if nobody {
				resp = &emptyListSubscriptionResponse
			} else {
				var m manipulator.Subscription
				items, e := m.List()
				if e != nil {
					if e != nil {
						slog.Warn("settings list subscription",
							log.Error, e,
						)
					}
					return e
				} else if len(items) == 0 {
					resp = &emptyListSubscriptionResponse
				} else {
					resp = &grpc_settings.ListSubscriptionResponse{
						Data: make([]*grpc_settings.Subscription, len(items)),
					}
					for i, item := range items {
						resp.Data[i] = &grpc_settings.Subscription{
							Id:   item.ID,
							Name: item.Name,
							Url:  item.URL,
						}
					}
				}
			}
			return nil
		},
	)
	return
}

var emptySubscription grpc_settings.Subscription

func (s server) GetSubscription(ctx context.Context, req *grpc_settings.GetSubscriptionRequest) (resp *grpc_settings.Subscription, e error) {
	s.SetHTTPCacheMaxAge(ctx, 0)
	modtime := _subscription.Load().(time.Time)
	e = s.ServeMessage(ctx,
		modtime,
		func(nobody bool) error {
			if nobody {
				resp = &emptySubscription
			} else {
				var m manipulator.Subscription
				item, e := m.Get(req.Id)
				if e != nil {
					if e != nil {
						slog.Warn("settings get subscription",
							log.Error, e,
						)
					}
					return e
				} else {
					resp = &grpc_settings.Subscription{
						Id:   item.ID,
						Name: item.Name,
						Url:  item.URL,
					}
				}
			}
			return nil
		},
	)
	return
}

var emptyPutSubscriptionResponse grpc_settings.PutSubscriptionResponse

func (s server) PutSubscription(ctx context.Context, req *grpc_settings.Subscription) (resp *grpc_settings.PutSubscriptionResponse, e error) {
	var m manipulator.Subscription
	e = m.Put(&data.Subscription{
		ID:   req.Id,
		Name: req.Name,
		URL:  req.Url,
	})
	if e != nil {
		slog.Warn("settings set subscription",
			log.Error, e,
			`id`, req.Id,
			`name`, req.Name,
			`url`, req.Url,
		)
		return
	}
	slog.Info("settings set subscription",
		`id`, req.Id,
		`name`, req.Name,
		`url`, req.Url,
	)
	_subscription.Store(time.Now())
	resp = &emptyPutSubscriptionResponse
	return
}
func (s server) AddSubscription(ctx context.Context, req *grpc_settings.AddSubscriptionRequest) (resp *grpc_settings.AddSubscriptionResponse, e error) {
	var m manipulator.Subscription
	item := &data.Subscription{
		Name: req.Name,
		URL:  req.Url,
	}
	e = m.Add(item)
	if e != nil {
		slog.Warn("settings add subscription",
			log.Error, e,
			`id`, item.ID,
			`name`, req.Name,
			`url`, req.Url,
		)
		return
	}
	slog.Info("settings add subscription",
		`id`, item.ID,
		`name`, req.Name,
		`url`, req.Url,
	)
	_subscription.Store(time.Now())
	resp = &grpc_settings.AddSubscriptionResponse{
		Id: item.ID,
	}
	return
}

var emptyRemoveSubscriptionResponse grpc_settings.RemoveSubscriptionResponse

func (s server) RemoveSubscription(ctx context.Context, req *grpc_settings.RemoveSubscriptionRequest) (resp *grpc_settings.RemoveSubscriptionResponse, e error) {
	var m manipulator.Subscription
	e = m.Remove(req.Id)
	if e == nil {
		_subscription.Store(time.Now())
	} else if e == bolt.ErrBucketNotFound {
		_subscription.Store(time.Now())
		e = nil
	} else {
		return
	}
	resp = &emptyRemoveSubscriptionResponse
	return
}
