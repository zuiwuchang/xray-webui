package data

import (
	"bytes"
	"encoding/gob"
)

const ElementBucket = "element"

func init() {
	gob.Register(Element{})
}

// 代理節點
type Element struct {
	// 唯一識別碼
	ID uint64 `json:"id"`

	// 節點信息
	URL string `json:"url"`
}

func (element *Element) Decode(b []byte) (e error) {
	decoder := gob.NewDecoder(bytes.NewBuffer(b))
	e = decoder.Decode(element)
	return
}

func (element *Element) Encoder() (b []byte, e error) {
	var buffer bytes.Buffer
	encoder := gob.NewEncoder(&buffer)
	e = encoder.Encode(element)
	if e == nil {
		b = buffer.Bytes()
	}
	return
}
