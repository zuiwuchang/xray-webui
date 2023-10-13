package manipulator

import (
	"encoding/binary"
	"fmt"
	"log/slog"

	"github.com/zuiwuchang/xray_webui/db/data"
	"github.com/zuiwuchang/xray_webui/log"
	bolt "go.etcd.io/bbolt"
)

// Element 代理節點
type Element struct {
}

// 初始化 bucket
func (m Element) Init(tx *bolt.Tx, version int) (e error) {
	bucket, e := tx.CreateBucketIfNotExists([]byte(data.ElementBucket))
	if e != nil {
		return
	}
	var key [8]byte
	binary.LittleEndian.PutUint64(key[:], 0)
	_, e = bucket.CreateBucketIfNotExists(key[:])
	return
}

// 升級 bucket
func (m Element) Upgrade(tx *bolt.Tx, oldVersion, newVersion int) (e error) {
	e = m.Init(tx, newVersion)
	return
}

// 返回訂閱下的所有節點
func (m Element) List(sub uint64) (items []*data.Element, e error) {
	e = _db.View(func(t *bolt.Tx) error {
		bucket := t.Bucket([]byte(data.ElementBucket))
		if bucket == nil {
			return fmt.Errorf("bucket not exist : %s", data.ElementBucket)
		}
		var key [8]byte
		binary.LittleEndian.PutUint64(key[:], sub)
		bucket = bucket.Bucket(key[:])
		if bucket == nil {
			return fmt.Errorf("bucket not exist : %v", sub)
		}
		e = bucket.ForEach(func(k, v []byte) error {
			var node data.Element
			e := node.Decode(v)
			if e == nil {
				items = append(items, &node)
			} else {
				slog.Warn(`Decode Element error`,
					log.Error, e,
				)
			}
			return nil
		})
		return nil
	})
	return
}
