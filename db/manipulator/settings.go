package manipulator

import (
	"fmt"

	"github.com/zuiwuchang/xray_webui/db/data"
	bolt "go.etcd.io/bbolt"
)

type Settings struct {
}

// 初始化 bucket
func (m Settings) Init(tx *bolt.Tx, version int) (e error) {
	bucket, e := tx.CreateBucketIfNotExists([]byte(data.SettingsBucket))
	if e != nil {
		return
	}

	key := []byte(data.SettingsGeneral)
	val := bucket.Get(key)
	if val == nil {
		var tmp data.General
		tmp.ResetDefault()
		val, e = tmp.Encoder()
		if e != nil {
			return
		}
		e = bucket.Put(key, val)
		if e != nil {
			return
		}
	}
	return
}

// 升級 bucket
func (m Settings) Upgrade(tx *bolt.Tx, oldVersion, newVersion int) (e error) {
	e = m.Init(tx, newVersion)
	return
}

// 返回 常規 設定
func (m Settings) GetGeneral() (result *data.General, e error) {
	e = _db.View(func(t *bolt.Tx) (e error) {
		bucket := t.Bucket([]byte(data.SettingsBucket))
		if bucket == nil {
			e = fmt.Errorf("bucket not exist : %s", data.SettingsBucket)
			return
		}
		val := bucket.Get([]byte(data.SettingsGeneral))
		var tmp data.General
		if val == nil {
			tmp.ResetDefault()
			result = &tmp
		} else {
			e = tmp.Decode(val)
			if e != nil {
				return
			}
			result = &tmp
		}
		return
	})
	return
}

// 保存 常規設定
func (m Settings) PutGeneral(val *data.General) (e error) {
	b, e := val.Encoder()
	if e != nil {
		return
	}
	e = _db.Update(func(t *bolt.Tx) (e error) {
		bucket := t.Bucket([]byte(data.SettingsBucket))
		if bucket == nil {
			e = fmt.Errorf("bucket not exist : %s", data.SettingsBucket)
			return
		}
		e = bucket.Put([]byte(data.SettingsGeneral), b)
		return
	})
	return
}
func (m Settings) PutLast(val *data.Last) (e error) {
	b, e := val.Encoder()
	if e != nil {
		return
	}
	e = _db.Update(func(t *bolt.Tx) (e error) {
		bucket := t.Bucket([]byte(data.SettingsBucket))
		if bucket == nil {
			e = fmt.Errorf("bucket not exist : %s", data.SettingsBucket)
			return
		}
		e = bucket.Put([]byte(data.SettingsLast), b)
		return
	})
	return
}
func (m Settings) RemoveLast() (e error) {
	e = _db.Update(func(t *bolt.Tx) (e error) {
		bucket := t.Bucket([]byte(data.SettingsBucket))
		if bucket == nil {
			e = fmt.Errorf("bucket not exist : %s", data.SettingsBucket)
			return
		}
		e = bucket.Delete([]byte(data.SettingsLast))
		return
	})
	return
}
func (m Settings) GetLast() (result *data.Last, e error) {
	e = _db.View(func(t *bolt.Tx) (e error) {
		bucket := t.Bucket([]byte(data.SettingsBucket))
		if bucket == nil {
			e = fmt.Errorf("bucket not exist : %s", data.SettingsBucket)
			return
		}
		val := bucket.Get([]byte(data.SettingsLast))
		var tmp data.Last
		if val != nil {
			e = tmp.Decode(val)
			if e != nil {
				return
			}
			result = &tmp
		}
		return
	})
	return
}
