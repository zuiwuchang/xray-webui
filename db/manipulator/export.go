package manipulator

import (
	"encoding/binary"
	"encoding/json"
	"fmt"
	"log/slog"
	"os"
	"time"

	"github.com/zuiwuchang/xray_webui/db/data"
	"github.com/zuiwuchang/xray_webui/log"
	"github.com/zuiwuchang/xray_webui/version"
	bolt "go.etcd.io/bbolt"
)

type _Root struct {
	General       *data.General    `json:"general"`
	Last          *data.Last       `json:"last"`
	Strategys     []*data.Strategy `json:"strategys"`
	Manual        []*data.Element  `json:"manual"`
	Subscriptions []*_Subscription `json:"subscriptions"`
}

type _Subscription struct {
	data.Subscription
	Elements []*data.Element `json:"elements"`
}

func (root *_Root) Pull(db *bolt.DB) error {
	return db.View(func(tx *bolt.Tx) (e error) {
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
		if e != nil {
			return
		}

		bucket = tx.Bucket([]byte(data.SubscriptionBucket))
		if bucket == nil {
			e = fmt.Errorf("bucket not exist : %s", data.SubscriptionBucket)
			return
		}
		elementBucket := tx.Bucket([]byte(data.ElementBucket))
		if bucket == nil {
			return fmt.Errorf("bucket not exist : %s", data.ElementBucket)
		}
		root.Manual, e = listElement(elementBucket, 0)
		if e != nil {
			return
		}
		e = bucket.ForEach(func(k, v []byte) error {
			var node data.Subscription
			e := node.Decode(v)
			if e == nil {
				list := elementBucket.Bucket(k)
				if list == nil {
					return fmt.Errorf("bucket not exist : %v", binary.LittleEndian.Uint64(k))
				}
				items, e := listElement(elementBucket, node.ID)
				if e != nil {
					return e
				}
				root.Subscriptions = append(root.Subscriptions, &_Subscription{
					Subscription: node,
					Elements:     items,
				})
			} else {
				slog.Warn(`Decode Strategy error`,
					log.Error, e,
				)
			}
			return nil
		})
		return
	})

}
func (root *_Root) NewBucket(tx *bolt.Tx, name []byte) (bucket *bolt.Bucket, e error) {
	bucket = tx.Bucket(name)
	if bucket != nil {
		e = tx.DeleteBucket(name)
		if e != nil {
			bucket = nil
			return
		}
	}
	bucket, e = tx.CreateBucket(name)
	return
}
func (root *_Root) push(bucket *bolt.Bucket, sub uint64, items []*data.Element, last *data.Last, matched bool) (*data.Last, error) {
	var key [8]byte
	binary.LittleEndian.PutUint64(key[:], sub)
	bucket, e := bucket.CreateBucketIfNotExists(key[:])
	if e != nil {
		return last, e
	}
	for _, item := range items {
		id, e := bucket.NextSequence()
		if e != nil {
			return last, e
		}
		if last == nil && matched && item.ID == root.Last.ID {
			last = root.Last
			last.Subscription = sub
			last.ID = id
		}
		binary.LittleEndian.PutUint64(key[:], id)
		item.ID = id
		val, e := item.Encoder()
		if e != nil {
			return last, e
		}
		e = bucket.Put(key[:], val)
		if e != nil {
			return last, e
		}
	}
	return last, nil
}
func (root *_Root) Push(db *bolt.DB) error {
	return db.Update(func(tx *bolt.Tx) (e error) {
		bucketName := []byte(`__private_data`)
		bucket, e := root.NewBucket(tx, bucketName)
		if e != nil {
			return
		}
		b := make([]byte, 4)
		binary.LittleEndian.PutUint32(b, uint32(version.DB))
		e = bucket.Put([]byte(`version`), b)
		if e != nil {
			return
		}

		bucket, e = root.NewBucket(tx, []byte(data.SubscriptionBucket))
		if e != nil {
			return
		}
		elementBucket, e := root.NewBucket(tx, []byte(data.ElementBucket))
		if e != nil {
			return
		}

		last, e := root.push(elementBucket,
			0, root.Manual,
			nil, root.Last != nil && root.Last.Subscription == 0,
		)
		if e != nil {
			return
		}
		var (
			key8 [8]byte
			id8  uint64
		)
		for _, node := range root.Subscriptions {
			subscription, e := bucket.NextSequence()
			if e != nil {
				return e
			}
			id8 = node.ID
			node.ID = subscription
			val, e := node.Encoder()
			if e != nil {
				return e
			}
			binary.LittleEndian.PutUint64(key8[:], subscription)
			e = bucket.Put(key8[:], val)
			if e != nil {
				return e
			}
			last, e = root.push(elementBucket,
				node.ID, node.Elements,
				last, root.Last != nil && root.Last.Subscription == id8,
			)
			if e != nil {
				return e
			}
		}

		bucket, e = root.NewBucket(tx, []byte(data.StrategyBucket))
		if e != nil {
			return
		}
		keys := make(map[uint32]*data.Strategy)
		for _, strategy := range root.Strategys {
			if strategy.ID > 0 && strategy.ID < 7 {
				keys[strategy.ID] = strategy
			}
		}
		for id := uint32(1); id <= 6; id++ {
			if _, ok := keys[id]; !ok {
				keys[id] = &data.Strategy{
					ID: id,
				}
			}
		}
		var key [4]byte
		for _, strategy := range keys {
			b, e := strategy.Encoder()
			if e != nil {
				return e
			}
			binary.LittleEndian.PutUint32(key[:], strategy.ID)
			e = bucket.Put(key[:], b)
			if e != nil {
				return e
			}
		}

		bucket, e = root.NewBucket(tx, []byte(data.SettingsBucket))
		if e != nil {
			return
		}
		if last != nil {
			b, e = last.Encoder()
			if e != nil {
				return
			}
			e = bucket.Put([]byte(data.SettingsLast), b)
			if e != nil {
				return
			}
		}
		if root.General != nil {
			b, e = root.General.Encoder()
			if e != nil {
				return
			}
			e = bucket.Put([]byte(data.SettingsGeneral), b)
			if e != nil {
				return
			}
		}
		return
	})
}

func Export(dbpath, filename string) (e error) {
	db, e := bolt.Open(dbpath, 0600, &bolt.Options{
		Timeout: time.Second * 5,
	})
	if e != nil {
		return
	}
	defer db.Close()

	var root _Root
	e = root.Pull(db)
	if e != nil {
		return
	}

	f, e := os.Create(filename)
	if e != nil {
		return
	}
	defer f.Close()
	enc := json.NewEncoder(f)
	enc.SetIndent(``, `	`)
	e = enc.Encode(&root)
	return
}

func Import(dbpath, filename string) (e error) {
	f, e := os.Open(filename)
	if e != nil {
		return
	}
	defer f.Close()
	var root _Root
	dec := json.NewDecoder(f)
	e = dec.Decode(&root)
	if e != nil {
		return
	}

	db, e := bolt.Open(dbpath, 0600, &bolt.Options{
		Timeout: time.Second * 5,
	})
	if e != nil {
		return
	}
	defer db.Close()

	e = root.Push(db)
	return
}
