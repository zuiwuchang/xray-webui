package js

type Metadata struct {
	// 代理協議
	// * vmess
	// * vless
	// * trojan
	// * shadowsocks
	// * ...
	Protocol string `json:"protocol"`

	Fields []Filed `json:"fields"`
}
type Filed struct {
	// 存儲的鍵名稱，應該保證同一代理的多個 key 唯一
	Key string `json:"key"`
	// 來源自 url 中哪個部分
	From From `json:"from"`
	// 服務器忽略解析這個 filed
	OnlyUI bool `json:"onlyUI"`
}
type From struct {
	// 來源自 url 中哪個部分
	// 'username' | 'host' | 'port' | 'path' | 'fragment' | 'query' | 'json'
	From string `json:"from"`
	// 當來自 'query' 時指定 query 的 鍵值，或者來自 'json' 時指定 json key
	Key string `json:"key"`
	// 這部分如何編碼
	// 'base64' | 'escape' | ''
	Enc string `json:"enc"`
}
