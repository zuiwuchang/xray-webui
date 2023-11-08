package manipulator

import (
	"encoding/json"
	"fmt"
	"log/slog"
	"os"
	"time"

	"github.com/zuiwuchang/xray_webui/db/data"
	"github.com/zuiwuchang/xray_webui/log"
	bolt "go.etcd.io/bbolt"
)

type _Root struct {
	General   *data.General    `json:"general"`
	Last      *data.Last       `json:"last"`
	Strategys []*data.Strategy `json:"strategys"`
}

func Export(dbpath, filename string) error {
	db, e := bolt.Open(dbpath, 0600, &bolt.Options{
		Timeout: time.Second * 5,
	})
	if e != nil {
		return e
	}
	defer db.Close()
	return db.View(func(tx *bolt.Tx) (e error) {
		var root _Root
		f, e := os.Create(filename)
		if e != nil {
			return
		}
		defer f.Close()
		bucket := tx.Bucket([]byte(data.SettingsBucket))
		if bucket == nil {
			e = fmt.Errorf("bucket not exist : %s", data.SettingsBucket)
			return
		}
		val := bucket.Get([]byte(data.SettingsGeneral))
		if val != nil {
			var tmp data.General
			e = tmp.Decode(val)
			if e != nil {
				return
			}
			root.General = &tmp
		}
		val = bucket.Get([]byte(data.SettingsLast))
		if val != nil {
			var tmp data.Last
			e = tmp.Decode(val)
			if e != nil {
				return
			}
			root.Last = &tmp
		}

		bucket = tx.Bucket([]byte(data.StrategyBucket))
		if bucket == nil {
			e = fmt.Errorf("bucket not exist : %s", data.StrategyBucket)
			return
		}
		e = bucket.ForEach(func(k, v []byte) error {
			var node data.Strategy
			e := node.Decode(v)
			if e == nil {
				root.Strategys = append(root.Strategys, &node)
			} else {
				slog.Warn(`Decode Strategy error`,
					log.Error, e,
				)
			}
			return nil
		})

		enc := json.NewEncoder(f)
		enc.SetIndent(``, `	`)
		e = enc.Encode(&root)
		return
	})

}

func Import(dbpath, filename string) (e error) {

	return
}
