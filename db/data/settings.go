package data

import (
	"bytes"
	"encoding/gob"
)

func init() {
	gob.Register(General{})
}

const SettingsBucket = "settings"

const SettingsLast = "last"
const SettingsGeneral = "general"

// 最後啓動的代理
type Last struct {
	// 代理 URL
	URL string `json:"url"`
	// 代理名稱
	Name string `json:"name"`
	// 使用的策略
	Strategy uint32 `json:"strategy"`
	// 所屬訂閱 id
	Subscription uint64 `uri:"subscription"`
	// 節點 id
	ID uint64 `uri:"id"`
}

func (l *Last) Decode(b []byte) (e error) {
	decoder := gob.NewDecoder(bytes.NewBuffer(b))
	e = decoder.Decode(l)
	return
}

func (l *Last) Encoder() (b []byte, e error) {
	var buffer bytes.Buffer
	encoder := gob.NewEncoder(&buffer)
	e = encoder.Encode(l)
	if e == nil {
		b = buffer.Bytes()
	}
	return
}

// 常規設定
type General struct {
	// 測試速度請求的 url
	URL string `json:"url"`
	// 啓動時自動運行 代理服務
	Run bool `json:"run"`
	// 因爲 Run 而自動啓動服務後 設置服務器規則
	Firewall bool `json:"firewall"`
	// 使用的策略
	//
	//  * 1 默認的代理規則
	//  * 2 全域代理
	//  * 3 略過區域網路的代理(僅對公網ip使用代理)
	//  * 4 代理優先(略過區域網路和西朝鮮的代理)
	//  * 5 直連優先 (僅對非西朝鮮公網使用代理)
	//  * 6 直接連接
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
	g.Strategy = 5
	g.Run = true
	g.Firewall = false
	g.URL = `https://www.youtube.com/`
	g.Userdata = DefaultUserdata
}

const DefaultUserdata = `// 爲代理設置訪問用戶名密碼
local accounts = [
	{
		// 用戶名
		user: 'killer',
		// 密碼
		password: '19890604',
	},
];
{
	// socks 代理設定
	socks: {
		// 監聽地址，默認 '127.0.0.1'
		// bind: '0.0.0.0',
		// 監聽端口，如果 < 1 則不啓用 socks 代理
		port: 1080,
		// 如果爲 true 則允許代理 udp
		udp: true,
		// 用戶數組默認不需要認證
		// accounts: accounts,
	},
	// http 代理設定
	http: {
		// 監聽地址，默認 '127.0.0.1'
		// bind: '0.0.0.0',
		// 監聽端口，如果 < 1 則不啓用 http 代理
		// port: 8118,
		// 用戶數組默認不需要認證
		// accounts: accounts,
	},
	// 透明代理設定
	proxy: {
		// 監聽端口，如果 < 1 則不啓用 透明代理
		port: 12345,
		// 如果爲 true，則在 linnux 下使用 tproxy 作爲全局代理，否則使用 redirect 作爲全局代理
		tproxy: true,
		// tproxy mark
		mark: 2,
	},
	routing: {
		// 爲 bt 設置出棧 tag
		bittorrent: 'out-freedom', // 不使用代理
		// bittorrent: 'out-blackhole', // 阻止訪問
		// bittorrent: 'out-proxy', // 使用代理

		// 要代理訪問的 ip，忽略策略設定，這些 ip 將始終被代理訪問
		/**
		proxyIP: [
			// '8.8.8.8',
		],/**/
		// 要代理訪問的 域名，忽略策略設定，這些 域名 將始終被代理訪問
		/**
		proxyDomain: [
			'geosite:apple',
			'geosite:google',
			'geosite:microsoft',
			'geosite:facebook',
			'geosite:twitter',
			'geosite:telegram',
			'geosite:geolocation-!cn',
			'tld-!cn',
		],/**/

		// 要直接訪問的 ip，忽略策略設定，這些 ip 將始終被直接訪問
		/**
		directIP: [
			'geoip:private',
			'geoip:cn',
		],/**/
		// 要直接訪問的 域名，忽略策略設定，這些 域名 將始終被直接訪問
		/**
		directDomain: [
			'geosite:cn',
		],/**/

		// 要禁止訪問的 ip，忽略策略設定，這些 ip 將始終被禁止訪問
		/**
		blockIP: [
			// 'geoip:cn',
		],/**/
		// 要禁止訪問的 域名，忽略策略設定，這些 域名 將始終被禁止訪問
		/**/
		blockDomain: [
			'category-ads',
			// 'category-ads-all',
		],/**/
	}
}`
