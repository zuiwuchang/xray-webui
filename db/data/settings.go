package data

import (
	"bytes"
	"encoding/gob"
)

func init() {
	gob.Register(General{})
}

const SettingsBucket = "settings"

const SettingsGeneral = "general"

// 常規設定
type General struct {
	// 測試速度請求的 url
	URL string `json:"url"`
	// 啓動時自動運行 代理服務
	Run bool `json:"run"`
	// 因爲 Run 而自動啓動服務後 設置服務器規則
	Firewall bool `json:"firewall"`
	// 使用的策略，默認爲 1
	Strategy uint32 `json:"strategy"`
	// 自定義設定， jsonnet 字符串
	Userdata string `json:"userdata"`
}

func (g *General) Decode(b []byte) (e error) {
	decoder := gob.NewDecoder(bytes.NewBuffer(b))
	e = decoder.Decode(g)
	return
}

func (g *General) Encoder() (b []byte, e error) {
	var buffer bytes.Buffer
	encoder := gob.NewEncoder(&buffer)
	e = encoder.Encode(g)
	if e == nil {
		b = buffer.Bytes()
	}
	return
}

// ResetDefault 重新 置爲默認值
func (g *General) ResetDefault() {
	g.Strategy = 1
	g.Run = true
	g.Firewall = false
	g.URL = `https://www.youtube.com/`
	g.Userdata = `{
	// 如果爲 true，則在 linnux 下使用 tproxy 作爲全局代理，否則使用 redirect 作爲全局代理
	tproxy: true,
}`
}
