package manipulator

import (
	"encoding/binary"
	"fmt"
	"log/slog"

	"github.com/zuiwuchang/xray_webui/db/data"
	"github.com/zuiwuchang/xray_webui/log"
	bolt "go.etcd.io/bbolt"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

type Subscription struct {
}

// 初始化 bucket
func (m Subscription) Init(tx *bolt.Tx, version int) (e error) {
	_, e = tx.CreateBucketIfNotExists([]byte(data.SubscriptionBucket))
	if e != nil {
		return
	}
	return
}

// 升級 bucket
func (m Subscription) Upgrade(tx *bolt.Tx, oldVersion, newVersion int) (e error) {
	e = m.Init(tx, newVersion)
	return
}
func (m Subscription) list(t *bolt.Tx) (result []*data.Subscription, e error) {
	bucket := t.Bucket([]byte(data.SubscriptionBucket))
	if bucket == nil {
		e = fmt.Errorf("bucket not exist : %s", data.SubscriptionBucket)
		return
	}
	e = bucket.ForEach(func(k, v []byte) error {
		var node data.Subscription
		e := node.Decode(v)
		if e == nil {
			result = append(result, &node)
		} else {
			slog.Warn(`Decode Subscription error`,
				log.Error, e,
			)
		}
		return nil
	})
	return
}

// 返回 所有記錄
func (m Subscription) List() (result []*data.Subscription, e error) {
	e = _db.View(func(t *bolt.Tx) (e error) {
		result, e = m.list(t)
		return
	})
	return
}

// 設置記錄
func (m Subscription) Put(node *data.Subscription) (e error) {
	value, e := node.Encoder()
	if e != nil {
		return e
	}
	e = _db.Update(func(t *bolt.Tx) error {
		bucket := t.Bucket([]byte(data.SubscriptionBucket))
		if bucket == nil {
			return fmt.Errorf("bucket not exist : %s", data.SubscriptionBucket)

		}
		var key [8]byte
		binary.LittleEndian.PutUint64(key[:], node.ID)
		val := bucket.Get(key[:])
		if val == nil {
			return status.Errorf(codes.NotFound, "key not exist : %s.%v", data.SubscriptionBucket, node.ID)

		}
		return bucket.Put(key[:], value)
	})
	return
}

// 返回記錄
func (m Subscription) Get(id uint64) (result *data.Subscription, e error) {
	e = _db.View(func(t *bolt.Tx) (e error) {
		result, e = m.get(t, id)
		return
	})
	return
}
func (m Subscription) get(t *bolt.Tx, id uint64) (result *data.Subscription, e error) {
	bucket := t.Bucket([]byte(data.SubscriptionBucket))
	if bucket == nil {
		e = fmt.Errorf("bucket not exist : %s", data.SubscriptionBucket)
		return
	}
	var key [8]byte
	binary.LittleEndian.PutUint64(key[:], id)
	val := bucket.Get(key[:])
	if val == nil {
		e = status.Errorf(codes.NotFound, "key not exist : %s.%v", data.SubscriptionBucket, id)
		return
	}
	var node data.Subscription
	e = node.Decode(val)
	if e != nil {
		return
	}
	result = &node
	return
}

// 添加記錄
func (m Subscription) Add(node *data.Subscription) error {
	return _db.Update(func(t *bolt.Tx) error {
		bucket := t.Bucket([]byte(data.SubscriptionBucket))
		if bucket == nil {
			return fmt.Errorf("bucket not exist : %s", data.SubscriptionBucket)

		}
		id, e := bucket.NextSequence()
		if e != nil {
			return e
		}
		var key [8]byte
		binary.LittleEndian.PutUint64(key[:], id)
		node.ID = id
		val, e := node.Encoder()
		if e != nil {
			return e
		}
		e = bucket.Put(key[:], val)
		if e != nil {
			return e
		}

		// 創建 element
		bucket, e = t.CreateBucketIfNotExists([]byte(data.ElementBucket))
		if e != nil {
			return e
		}
		_, e = bucket.CreateBucketIfNotExists(key[:])
		return e
	})
}

// 刪除記錄
func (m Subscription) Remove(id uint64) error {
	return _db.Update(func(t *bolt.Tx) error {
		bucket := t.Bucket([]byte(data.SubscriptionBucket))
		if bucket == nil {
			return fmt.Errorf("bucket not exist : %s", data.SubscriptionBucket)
		}
		var key [8]byte
		binary.LittleEndian.PutUint64(key[:], id)
		e := bucket.Delete(key[:])
		if e != nil {
			return e
		}
		// 刪除 訂閱
		bucket = t.Bucket([]byte(data.ElementBucket))
		if bucket == nil {
			return nil
		}
		e = bucket.DeleteBucket(key[:])
		if e == bolt.ErrBucketNotFound {
			return nil
		}
		return e
	})
}
func (m Subscription) Import(vals []*data.Subscription) error {
	return _db.Update(func(tx *bolt.Tx) (e error) {
		bucketName := []byte(data.SubscriptionBucket)
		e = tx.DeleteBucket(bucketName)
		if e != bolt.ErrBucketExists {
			return
		}
		bucket, e := tx.CreateBucket(bucketName)
		if e != nil {
			return
		} else if len(vals) == 0 {
			return
		}

		bucketElement, e := tx.CreateBucketIfNotExists([]byte(data.ElementBucket))
		if e != nil {
			return
		}

		var (
			b   []byte
			key [8]byte
		)
		for _, val := range vals {
			b, e = val.Encoder()
			if e != nil {
				return
			}
			binary.LittleEndian.PutUint64(key[:], val.ID)
			e = bucket.Put(key[:], b)
			if e != nil {
				return
			}

			// 創建 element
			_, e = bucketElement.CreateBucketIfNotExists(key[:])
			if e != nil {
				return
			}
		}
		return
	})
}
