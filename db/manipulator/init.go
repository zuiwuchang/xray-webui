package manipulator

import (
	"log/slog"
	"os"
	"path/filepath"
	"time"

	"github.com/zuiwuchang/xray_webui/log"
	bolt "go.etcd.io/bbolt"
)

var _db *bolt.DB

func Init(path string) (e error) {
	os.MkdirAll(filepath.Dir(path), 0775)
	db, e := bolt.Open(path, 0600, &bolt.Options{
		Timeout: time.Second * 5,
	})
	if e != nil {
		return
	}
	e = db.Update(func(tx *bolt.Tx) (e error) {
		var oldVersion int
		oldVersion, e = updateVersion(tx)
		if e != nil {
			slog.Error(`database is not compatible`,
				log.Error, e,
			)
			os.Exit(1)
			return
		}
		if oldVersion < 0 {
			oldVersion = 0
		}
		buckets := []manipulator{
			Strategy{},
			Settings{},
		}
		if oldVersion == 0 {
			for i := 0; i < len(buckets); i++ {
				e = buckets[i].Init(tx, Version)
				if e != nil {
					return
				}
			}
		} else if oldVersion < Version {
			for i := 0; i < len(buckets); i++ {
				e = buckets[i].Upgrade(tx, oldVersion, Version)
				if e != nil {
					return
				}
			}
		}
		return
	})
	_db = db
	return
}
func DB() *bolt.DB {
	return _db
}
