package system

import (
	"context"
	"time"

	"github.com/zuiwuchang/xray_webui/m/helper"
	grpc_system "github.com/zuiwuchang/xray_webui/protocol/system"
	"github.com/zuiwuchang/xray_webui/version"
)

type server struct {
	grpc_system.UnimplementedSystemServer
	helper.Helper
}

var (
	emptyTitleResponse grpc_system.TitleResponse
	titleResponse      grpc_system.TitleResponse
)

func (s server) Title(ctx context.Context, req *grpc_system.TitleRequest) (resp *grpc_system.TitleResponse, e error) {
	s.SetHTTPCacheMaxAge(ctx, 60)
	e = s.ServeMessage(ctx,
		time.Unix(startAtResponse.Result, 0),
		func(nobody bool) error {
			if nobody {
				resp = &emptyTitleResponse
			} else {
				resp = &titleResponse
			}
			return nil
		},
	)
	return
}

var (
	emptyVersionResponse grpc_system.VersionResponse
	versionResponse      = grpc_system.VersionResponse{
		Platform: version.Platform,
		Version:  version.Version,
	}
)

func (s server) Version(ctx context.Context, req *grpc_system.VersionRequest) (resp *grpc_system.VersionResponse, e error) {
	s.SetHTTPCacheMaxAge(ctx, 60)
	e = s.ServeMessage(ctx,
		time.Unix(startAtResponse.Result, 0),
		func(nobody bool) error {
			if nobody {
				resp = &emptyVersionResponse
			} else {
				resp = &versionResponse
			}
			return nil
		},
	)
	return
}

var (
	emptyStartAtResponse grpc_system.StartAtResponse
	startAtResponse      grpc_system.StartAtResponse
)

func (s server) StartAt(ctx context.Context, req *grpc_system.StartAtRequest) (resp *grpc_system.StartAtResponse, e error) {
	s.SetHTTPCacheMaxAge(ctx, 60)
	e = s.ServeMessage(ctx,
		time.Unix(startAtResponse.Result, 0),
		func(nobody bool) error {
			if nobody {
				resp = &emptyStartAtResponse
			} else {
				resp = &startAtResponse
			}
			return nil
		},
	)
	return
}
