package data

import (
	"bytes"
	"encoding/gob"
	"strings"
)

func init() {
	gob.Register(Strategy{})
}

const StrategyBucket = "strategy"
const StrategyDefault = 1

// 代理策略
type Strategy struct {
	// 供腳本參考的 策略值 ，腳本應該依據此值生成 xray 的配置
	//
	// * 1 默認的代理規則
	// * 2 全域代理
	// * 3 略過區域網路的代理(僅對公網ip使用代理)
	// * 4 略過區域網路和西朝鮮的代理
	// * 5 直連優先 (僅對非西朝鮮公網使用代理)
	// * 6 直接連接
	ID uint32 `json:"value"`

	// 靜態 ip 列表
	// baidu.com 127.0.0.1
	// dns.google 8.8.8.8 8.8.4.4
	Host string `json:"host"`

	// 這些 ip 使用代理
	ProxyIP string `json:"proxyIP"`
	// 這些 域名 使用代理
	ProxyDomain string `json:"proxyDomain"`

	// 這些 ip 直連
	DirectIP string `json:"directIP"`
	// 這些 域名 直連
	DirectDomain string `json:"directDomain"`

	// 這些 ip 阻止訪問
	BlockIP string `json:"blockIP"`
	// 這些 域名 阻止訪問
	BlockDomain string `json:"blockDomain"`
}

func (s *Strategy) Decode(b []byte) (e error) {
	decoder := gob.NewDecoder(bytes.NewBuffer(b))
	e = decoder.Decode(s)
	return
}

func (s *Strategy) Encoder() (b []byte, e error) {
	var buffer bytes.Buffer
	encoder := gob.NewEncoder(&buffer)
	e = encoder.Encode(s)
	if e == nil {
		b = buffer.Bytes()
	}
	return
}
func (s *Strategy) ToValue() *StrategyValue {
	return &StrategyValue{
		ID:           s.ID,
		Host:         s.spliteHost(s.Host),
		ProxyIP:      s.splite(s.ProxyIP),
		ProxyDomain:  s.splite(s.ProxyDomain),
		DirectIP:     s.splite(s.DirectIP),
		DirectDomain: s.splite(s.DirectDomain),
		BlockIP:      s.splite(s.BlockIP),
		BlockDomain:  s.splite(s.BlockDomain),
	}
}
func (s *Strategy) splite(text string) (result []string) {
	strs := strings.Split(strings.TrimSpace(text), "\n")
	for _, str := range strs {
		str = strings.TrimSpace(str)
		if str == "" || strings.HasPrefix(str, "#") {
			continue
		}
		items := s.spliteLine(str)
		if len(items) != 0 {
			result = append(result, items...)
		}
	}
	return
}
func (s *Strategy) spliteLine(str string) (result []string) {
	var val string
	for str != "" {
		i := strings.IndexAny(str, " \t,;")
		if i < 0 {
			val = strings.TrimSpace(str)
			str = ``
		} else {
			val = strings.TrimSpace(str[:i])
			str = strings.TrimSpace(str[i+1:])
		}
		if val != `` {
			result = append(result, val)
		}
	}
	return
}
func (s *Strategy) spliteHost(text string) (result [][]string) {
	strs := strings.Split(strings.TrimSpace(text), "\n")
	for _, str := range strs {
		str = strings.TrimSpace(str)
		if str == "" || strings.HasPrefix(str, "#") {
			continue
		}
		items := s.spliteLine(str)
		if len(items) > 1 {
			result = append(result, items)
		}
	}
	return
}

// 代理策略
type StrategyValue struct {
	// 供腳本參考的 策略值 ，腳本應該依據此值生成 xray 的配置
	//
	// * 1 默認的代理規則
	// * 2 全域代理
	// * 3 略過區域網路的代理(僅對公網ip使用代理)
	// * 4 略過區域網路和西朝鮮的代理
	// * 5 直連優先 (僅對非西朝鮮公網使用代理)
	// * 6 直接連接
	ID uint32 `json:"value"`

	// 靜態 ip 列表
	// baidu.com 127.0.0.1
	// dns.google 8.8.8.8 8.8.4.4
	Host [][]string `json:"host"`

	// 這些 ip 使用代理
	ProxyIP []string `json:"proxyIP"`
	// 這些 域名 使用代理
	ProxyDomain []string `json:"proxyDomain"`

	// 這些 ip 直連
	DirectIP []string `json:"directIP"`
	// 這些 域名 直連
	DirectDomain []string `json:"directDomain"`

	// 這些 ip 阻止訪問
	BlockIP []string `json:"blockIP"`
	// 這些 域名 阻止訪問
	BlockDomain []string `json:"blockDomain"`
}
