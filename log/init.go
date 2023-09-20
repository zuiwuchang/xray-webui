package log

import (
	"io"
	"log/slog"
	"os"
	"path/filepath"
	"strings"

	"gopkg.in/natefinch/lumberjack.v2"
)

func Init(basePath string, conf *Options) {
	var w io.Writer
	if conf.Filename == `` {
		filename := conf.Filename
		if filepath.IsAbs(filename) {
			filename = filepath.Clean(filename)
		} else {
			filename = filepath.Join(basePath, filename)
		}
		w = io.MultiWriter(os.Stdout,
			&lumberjack.Logger{
				Filename:   filename,
				MaxSize:    conf.MaxSize,
				MaxAge:     conf.MaxDays,
				MaxBackups: conf.MaxBackups,
				Compress:   conf.Compress,
			},
		)
	} else {
		w = os.Stdout
	}
	var (
		level slog.Leveler
		s     = strings.ToLower(strings.TrimSpace(conf.Level))
	)
	switch s {
	case `debug`:
		level = slog.LevelDebug
	case `info`:
		level = slog.LevelInfo
	case `warn`:
		level = slog.LevelWarn
	case `error`:
		level = slog.LevelError
	default:
		slog.Warn(`unknow level, use defualt info`,
			Value, s,
		)
		level = slog.LevelInfo
	}
	slog.SetDefault(slog.New(slog.NewJSONHandler(w, &slog.HandlerOptions{
		AddSource: conf.Source,
		Level:     level,
	})))
}
