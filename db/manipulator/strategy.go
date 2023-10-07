package manipulator

import (
	"encoding/binary"
	"fmt"
	"log/slog"

	"github.com/zuiwuchang/xray_webui/db/data"
	"github.com/zuiwuchang/xray_webui/log"
	bolt "go.etcd.io/bbolt"
)

type Strategy struct {
}

func (m Strategy) init(tx *bolt.Tx) (bucket *bolt.Bucket, e error) {
	bucket, e = tx.CreateBucketIfNotExists([]byte(data.StrategyBucket))
	if e != nil {
		return
	}
	var (
		key  [4]byte
		item data.Strategy
		err  error
	)
	for _, id := range []uint32{1, 2, 3, 4, 5, 6} {
		binary.LittleEndian.PutUint32(key[:], id)
		b := bucket.Get(key[:])
		err = item.Decode(b)
		if err == nil {
			continue
		}
		node := data.Strategy{ID: id}
		b, e = node.Encoder()
		if e != nil {
			return
		}
		e = bucket.Put(key[:], b)
		if e != nil {
			return
		}
	}
	return
}
func (m Strategy) Init(tx *bolt.Tx, version int) (e error) {
	_, e = m.init(tx)
	return
}
func (m Strategy) Upgrade(tx *bolt.Tx, oldVersion, newVersion int) (e error) {
	_, e = m.init(tx)
	return
}
func (m Strategy) List() (result []*data.Strategy, e error) {
	e = _db.View(func(t *bolt.Tx) (e error) {
		result, e = m.list(t)
		return
	})
	return
}
func (m Strategy) list(tx *bolt.Tx) (result []*data.Strategy, e error) {
	bucket := tx.Bucket([]byte(data.StrategyBucket))
	if bucket == nil {
		e = fmt.Errorf("bucket not exist : %s", data.StrategyBucket)
		return
	}
	e = bucket.ForEach(func(k, v []byte) error {
		var node data.Strategy
		e := node.Decode(v)
		if e == nil {
			result = append(result, &node)
		} else {
			slog.Warn(`Decode Strategy error`,
				log.Error, e,
			)
		}
		return nil
	})
	return
}

func (m Strategy) Value(id uint32) (result *data.StrategyValue, e error) {
	e = _db.View(func(tx *bolt.Tx) (e error) {
		result, e = m.value(tx, id)
		return
	})
	return
}
func (m Strategy) value(tx *bolt.Tx, id uint32) (result *data.StrategyValue, e error) {
	bucket := tx.Bucket([]byte(data.StrategyBucket))
	if bucket == nil {
		e = fmt.Errorf("bucket not exist : %s", data.StrategyBucket)
		return
	}
	def, e := m.getValue(bucket, data.StrategyDefault)
	if e != nil {
		return
	}
	if id == data.StrategyDefault {
		def.Host = m.copyHost(def.Host, nil)
		def.ProxyIP = m.copy(def.ProxyIP, nil)
		def.ProxyDomain = m.copy(def.ProxyDomain, nil)
		def.DirectIP = m.copy(def.DirectIP, nil)
		def.DirectDomain = m.copy(def.DirectDomain, nil)
		def.BlockIP = m.copy(def.BlockIP, nil)
		def.BlockDomain = m.copy(def.BlockDomain, nil)

		result = def
		return
	}
	val, e := m.getValue(bucket, id)
	if e != nil {
		return
	}
	val.Host = m.copyHost(val.Host, def.Host)
	val.ProxyIP = m.copy(val.ProxyIP, def.ProxyIP)
	val.ProxyDomain = m.copy(val.ProxyDomain, def.ProxyDomain)
	val.DirectIP = m.copy(val.DirectIP, def.DirectIP)
	val.DirectDomain = m.copy(val.DirectDomain, def.DirectDomain)
	val.BlockIP = m.copy(val.BlockIP, def.BlockIP)
	val.BlockDomain = m.copy(val.BlockDomain, def.BlockDomain)

	result = val
	return
}
func (m Strategy) copyHost(dst [][]string, src [][]string) [][]string {
	out := make([][]string, 0, len(dst)+len(src))
	keys := make(map[string]bool)
	for i := len(dst) - 1; i >= 0; i-- {
		h := dst[i]
		if len(h) < 2 || h[0] == `` || keys[h[0]] {
			continue
		}

		keys[h[0]] = true
		out = append(out, h)
	}

	for i := len(src) - 1; i >= 0; i-- {
		h := src[i]
		if len(h) < 2 || h[0] == `` || keys[h[0]] {
			continue
		}
		keys[h[0]] = true
		out = append(out, h)
	}
	return out
}
func (m Strategy) copy(dst []string, src []string) []string {
	out := make([]string, 0, len(dst)+len(src))
	keys := make(map[string]bool)
	for _, key := range src {
		if key == `` || keys[key] {
			continue
		}
		keys[key] = true
		out = append(out, key)
	}
	for _, key := range dst {
		if key == `` || keys[key] {
			continue
		}
		keys[key] = true
		out = append(out, key)
	}
	return out
}
func (m Strategy) get(bucket *bolt.Bucket, id uint32) (result *data.Strategy, e error) {
	var key [4]byte
	binary.LittleEndian.PutUint32(key[:], id)
	b := bucket.Get(key[:])
	if len(b) == 0 {
		e = fmt.Errorf("key not exist : %s.%v", data.StrategyBucket, key)
		return
	}
	var s data.Strategy
	e = s.Decode(b)
	if e != nil {
		return
	}
	result = &s
	return
}
func (m Strategy) getValue(bucket *bolt.Bucket, id uint32) (result *data.StrategyValue, e error) {
	v, e := m.get(bucket, id)
	if e != nil {
		return
	}
	result = v.ToValue()
	return
}
func (m Strategy) Put(d *data.Strategy) error {
	if d.ID < 1 || d.ID > 6 {
		return fmt.Errorf(`Strategy.ID not support`)
	}
	value, e := d.Encoder()
	if e != nil {
		return e
	}
	return _db.Update(func(tx *bolt.Tx) (e error) {
		bucket := tx.Bucket([]byte(data.StrategyBucket))
		if bucket == nil {
			e = fmt.Errorf("bucket not exist : %s", data.StrategyBucket)
			return
		}
		var key [4]byte
		binary.LittleEndian.PutUint32(key[:], d.ID)
		e = bucket.Put(key[:], value)
		return
	})
}
func (m Strategy) Import(vals []*data.Strategy) error {
	for _, val := range vals {
		if val.ID < 1 || val.ID > 6 {
			return fmt.Errorf(`Strategy.ID not support: %v`, val.ID)
		}
	}
	return _db.Update(func(tx *bolt.Tx) (e error) {
		bucket := tx.Bucket([]byte(data.StrategyBucket))
		if bucket == nil {
			e = fmt.Errorf("bucket not exist : %s", data.StrategyBucket)
			return
		}
		var b []byte
		var key [4]byte
		for _, val := range vals {
			b, e = val.Encoder()
			if e != nil {
				return
			}
			binary.LittleEndian.PutUint32(key[:], val.ID)
			e = bucket.Put(key[:], b)
			if e != nil {
				return
			}
		}
		return
	})
}
