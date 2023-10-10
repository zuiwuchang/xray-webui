package data

import (
	"bytes"
	"encoding/gob"
)

func init() {
	gob.Register(Subscription{})
}

const SubscriptionBucket = "subscription"

// 訂閱服務
type Subscription struct {
	// 唯一識別碼
	ID uint64 `json:"id"`
	// 給人類看的名稱
	Name string `json:"name"`
	// 訂閱地址
	URL string `json:"url"`
}

func (s *Subscription) Decode(b []byte) (e error) {
	decoder := gob.NewDecoder(bytes.NewBuffer(b))
	e = decoder.Decode(s)
	return
}

func (s *Subscription) Encoder() (b []byte, e error) {
	var buffer bytes.Buffer
	encoder := gob.NewEncoder(&buffer)
	e = encoder.Encode(s)
	if e == nil {
		b = buffer.Bytes()
	}
	return
}
