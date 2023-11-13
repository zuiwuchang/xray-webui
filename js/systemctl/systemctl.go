package systemctl

import (
	"errors"
	"sync"
	"time"
)

type Systemctl struct {
	keys map[string]*Service
	rw   sync.RWMutex
}

var defaultSystemctl = New()

func New() *Systemctl {
	return &Systemctl{
		keys: make(map[string]*Service),
	}
}

type InstallOptions struct {
	// 服務唯一名稱
	ID string
	// 要執行的進程
	Name string
	// 傳遞給進程的啓動參數
	Args []string
	// 啓動進程的工作路徑
	Dir string
	// 用於在進程重啓前等待的時間
	Interval time.Duration
	//  進程重啓策略
	Restart int
	// 安裝成功後要執行的操作
	Run int
	// 如果爲 true 則將進程 stdout/stderror 輸出到 os.Stdout 和網頁
	Log bool
}

func (i *InstallOptions) Equal(o *InstallOptions) bool {
	if i.Name != o.Name ||
		len(i.Args) != len(o.Args) ||
		i.Dir != o.Dir ||
		i.Restart != o.Restart ||
		i.Log != o.Log {
		return false
	}
	switch i.Restart {
	case RestartAlways, RestartFail:
		if i.Interval != o.Interval && (i.Interval > 0 || o.Interval > 0) {
			return false
		}
	}
	if i.Run != o.Run {
		return false
	}

	for index := 0; index < len(i.Args); index++ {
		if i.Args[index] != o.Args[index] {
			return false
		}
	}
	return true
}

func (s *Systemctl) Install(opts InstallOptions) (ok bool, e error) {
	if opts.ID == `` {
		e = errors.New(`service id invalid`)
		return
	} else if opts.Name == `` {
		e = errors.New(`service options.name invalid`)
		return
	} else if opts.Run < RunNone || opts.Run > RunStart {
		e = errors.New(`service options.run invalid`)
		return
	} else if opts.Restart < RestartNone || opts.Run > RestartAlways {
		e = errors.New(`service options.restart invalid`)
		return
	}

	s.rw.Lock()
	defer s.rw.Unlock()

	if found, exists := s.keys[opts.ID]; exists {
		if found.install.Equal(&opts) {
			switch opts.Run {
			case RunStart:
				_, e = found.Start()
			}
			return
		}
		found.Kill()
		delete(s.keys, opts.ID)
	}
	srv := newService(&opts)
	go srv.Serve()
	s.keys[opts.ID] = srv
	switch opts.Run {
	case RunStart:
		_, e = srv.Start()
	}
	ok = true
	return
}
func (s *Systemctl) Uninstall(id string) bool {
	if id == `` {
		return false
	}
	s.rw.Lock()
	defer s.rw.Unlock()
	if found, ok := s.keys[id]; ok {
		delete(s.keys, id)
		found.Kill()
		return true
	}
	return false
}
func (s *Systemctl) Start(id string) (bool, error) {
	if id == `` {
		return false, errors.New(`service not found:` + id)
	}
	s.rw.RLock()
	defer s.rw.RUnlock()
	if found, ok := s.keys[id]; ok {
		return found.Start()
	}
	return false, errors.New(`service not found:` + id)
}
func (s *Systemctl) Stop(id string) (bool, error) {
	if id == `` {
		return false, errors.New(`service not found:` + id)
	}
	s.rw.RLock()
	defer s.rw.RUnlock()
	if found, ok := s.keys[id]; ok {
		return found.Stop()
	}
	return false, errors.New(`service not found:` + id)
}
func (s *Systemctl) Status(id string) (*Status, error) {
	if id == `` {
		return nil, errors.New(`service not found:` + id)
	}
	s.rw.RLock()
	defer s.rw.RUnlock()
	if found, ok := s.keys[id]; ok {
		return found.Status()
	}
	return nil, nil
}
