export const i18n = {
	/**
	* 主頁
	*/
	home: "H",
	/**
	* 訂閱
	*/
	subscription: "s",
	/**
	* 頁面未找到：
	*/
	notfound: "NF",
	/**
	* 源碼
	*/
	sourcecode: "SC",
	/**
	* 語言
	*/
	language: "L",
	/**
	* 主題
	*/
	theme: "T",
	/**
	* 關於
	*/
	about: "A",
	/**
	* 設定
	*/
	settings: "S",
	/**
	* 關於內容文本
	*/
	aboutText: "AT",
	/**
	* 關於內容文本1
	*/
	aboutText1: "AT1",
	menuSettings: {
		/**
		* 常規
		*/
		general: "_ms.g",
		/**
		* 策略
		*/
		strategy: "_ms.s",
		/**
		* 防火牆
		*/
		firewall: "_ms.f",
	},
	/**
	* 刷新
	*/
	refresh: "R",
	/**
	* 編輯
	*/
	edit: "E",
	/**
	* 域名
	*/
	domain: "D0",
	strategy: {
		/**
		* 默認策略
		*/
		default: "_s.d",
		/**
		* 全域代理
		*/
		global: "_s.g",
		/**
		* 公網代理
		*/
		public: "_s.p",
		/**
		* 代理優先
		*/
		proxy: "_s.P",
		/**
		* 直連優先
		*/
		korea: "_s.k",
		/**
		* 直接連接
		*/
		direct: "_s.D",
		/**
		* 設置靜態 IP，每行一個。格式爲 '域名 + 分隔符 + IP + 分隔符 + IP...'， 分隔符可以是 '\t,;' 中任意字符或空格，如果行以 # 開始則忽略此行內容。
		*/
		tableHost: "_s.th",
		/**
		* 這些 IP 和 域名 將使用代理訪問，多個值使用分隔符進行分隔，分隔符可以是 '
		* 	,;' 中任意字符或空格，如果行以 # 開始則忽略此行內容。
		*/
		tableProxy: "_s.tp",
		/**
		* 這些 IP 和 域名 將被直接訪問，多個值使用分隔符進行分隔，分隔符可以是 '
		* 	,;' 中任意字符或空格，如果行以 # 開始則忽略此行內容。
		*/
		tableDirect: "_s.td",
		/**
		* 這些 IP 和 域名 將被阻止訪問，多個值使用分隔符進行分隔，分隔符可以是 '
		* 	,;' 中任意字符或空格，如果行以 # 開始則忽略此行內容。
		*/
		tableBlock: "_s.tb",
		/**
		* 靜態 IP
		*/
		nameHost: "_s.nh",
		/**
		* 代理訪問
		*/
		nameProxy: "_s.np",
		/**
		* 直接訪問
		*/
		nameDirect: "_s.nd",
		/**
		* 阻止訪問
		*/
		nameBlock: "_s.nb",
	},
	button: {
		/**
		* 提交
		*/
		submit: "_b.s",
		/**
		* 關閉
		*/
		close: "_b.c",
	},
	action: {
		/**
		* 成功
		*/
		success: "_a.S",
		/**
		* 錯誤
		*/
		error: "_a.E",
		/**
		* 數據已更新
		*/
		updated: "_a.U",
	},
	general: {
		/**
		* 速度測試網址
		*/
		url: "_g.u",
		/**
		* 自動運行代理服務
		*/
		run: "_g.r",
		/**
		* 自動設置全局代理
		*/
		firewall: "_g.f",
		/**
		* 策略
		*/
		strategy: "_g.s",
		/**
		* 自定義設定
		*/
		custom: "_g.c",
	},
}