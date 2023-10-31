package js

type Environment struct {
	/**
	 * 出棧方案 url.Scheme
	 */
	Scheme string `json:"scheme,omitempty"`
	/**
	 * 如果設置了此值，應該使用此值作爲 socks5 的監聽端口，並且此 socks5 代理無需驗證
	 *
	 * @remarks
	 * 在測試代理速度時，服務器會查找一個空閒的 tcp 端口並傳入此處，後續會使用生成的配置啓動程序並且測試代理速度
	 *
	 * 因爲後續會用作速度測試，所以配置也應該策略設定所有請求都以代理訪問
	 */
	Port uint16 `json:"port,omitempty"`
}
