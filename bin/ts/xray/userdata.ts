export interface Socks {
    /**
     * 監聽地址
     * @default '127.0.0.1'
     */
    bind?: string
    /**
     * 監聽端口，如果 < 1 則不啓用 socks 代理
     */
    port?: number

    /**
     * 是否允許代理 udp 
     * @default false
     */
    udp?: boolean
    /**
     * 如果是一個長度非0的數組則爲 socks5 啓用 'passsword' 默認的認證
     */
    accounts?: Array<Account>
}
export interface DNS {
    /**
     * 監聽地址
     * @default '0.0.0.0'
     */
    bind?: string
    /**
     * 監聽端口，如果 < 1 則不啓用 dns 服務
     */
    port?: number
}
export interface HTTP {
    /**
     * 監聽地址
     * @default '127.0.0.1'
     */
    bind?: string
    /**
     * 監聽端口，如果 < 1 則不啓用 http 代理
     */
    port?: number
    /**
     * 如果是一個長度非0的數組則啓用鑑權
     */
    accounts?: Array<Account>
}
export interface Account {
    /**
     * 用戶名
     */
    user?: string
    /**
     * 密碼
     */
    password?: string
}

export interface Proxy {
    /**
     * 監聽地址
     * @default '0.0.0.0'
     */
    bind?: string
    /**
     * 監聽端口，如果無效 則不啓用 透明代理
     */
    port?: number
    /**
     * 如果爲 true，則在 linnux 下使用 tproxy 作爲全局代理，否則使用 redirect 作爲全局代理
     * @remarks 
     * redirect 不支持 xray 路由也不支持 dns，如果 tproxy 可用則應該優先選擇 tproxy。
     * 我只是在 windows 的 wsl 子系統中(不支持 tproxy)爲 docker 設置 redirect 模式，並且 docker 可以使用 --dns 來指定另外一個 docker 作爲 dns 用於解決域名污染
     * 
     * 如你所見 redirect 也有解決 dns 污染的方法(例如我上面爲 docker 的設置)，但這些方法都不太通用難以爲各種環境進行自動化的適配，如果需要你可以自己修改腳本來支持特定的環境，
     * 但我建議優先選擇 tproxy。
     */
    tproxy?: boolean
    /**
     * tproxy mark
     * @default 99
     */
    mark?: number

    /**
     * 只有在 linux 下使用 redirect 模式設置 v4 透明代理時有效，如果設置會攔截連接 53 端口的 udp/tcp 重定向到此值
     */
    dns?: string
    /**
     * 只有在 linux 下使用 redirect 模式設置 v6 透明代理時有效，如果設置會攔截連接 53 端口的 udp/tcp 重定向到此值
     */
    dns6?: string
    /**
     * 目前在 windows 下使用 tun2socks 實現透明代理，這裏是需要提供的一些網卡相關設定
     */
    tun2socks?: {
        /**
         * socks5 代理地址 ip:port
         * 
         * @remarks
         * tun2socks 會使用 socks5 來轉發流量，如果不設置則使用 `127.0.0.1:${userdata.proxy.port}`
         * 
         * @example
         * 192.168.1.1:1080
         */
        socks5?: string
        /**
         * 系統默認上網網關 ip
         * 
         * @remarks
         * 啓動透明代理時會修改路由讓上網流量經過 tun2socks 的虛擬網卡轉發，但 windows 路由很混亂爲了保證
         * 虛擬網卡能正常獲取到流量需要刪除默認的路由網關。在關閉透明代理時需要恢復刪除的路由規則否則關閉透明代理後
         * 無法正常連接網路
         * 
         * @default '192.168.1.1'
         */
        gateway?: string
        /**
         * 虛擬網卡使用的 dns 服務器 ip 地址，不能帶端口 
         * @default 8.8.8.8
         */
        dns?: string

        /**
         * tun2socks 虛擬網卡 ip
         * @default 192.168.123.1
         */
        addr?: string
        /**
         * tun2socks 虛擬網卡 子網掩碼
         * @default 255.255.255.0
         */
        mask?: string
    }
}
export interface Userdata {
    /**
     * 一些全局的策略
     */
    strategy?: Strategy
    /**
     * xray 日誌設定
     */
    log?: Log
    /**
     * socks 代理設定
     */
    socks?: Socks
    /**
     * http 代理設定
     */
    http?: HTTP
    /**
     * 提供無污染的 dns 服務
     */
    dns?: DNS
    /**
     * 透明代理設定
     */
    proxy?: Proxy
    /**
     * 路由規則
     */
    routing?: Routing
}
export interface Routing {
    /**
     *  爲 bt 設置出棧 tag
     */
    bittorrent?: 'out-freedom' | 'out-blackhole' | 'out-proxy'

    /**
     * 這些 ip 使用代理
     */
    proxyIP?: Array<string>
    /**
     * 這些 域名 使用代理
     */
    proxyDomain?: Array<string>

    /**
     * 這些 ip 直接連接
     */
    directIP?: Array<string>
    /**
     * 這些 域名 直接連接
     */
    directDomain?: Array<string>

    /**
     * 這些 ip 禁止訪問
     */
    blockIP?: Array<string>
    /**
     * 這些 域名 禁止訪問
     */
    blockDomain?: Array<string>
}
export interface Log {
    /**
     * * 'debug' 調試程序時用到的輸出信息
     * * 'info' 運行時的狀態信息
     * * 'warning' 默認的設定，發生了一些不影響正常運作的問題時輸出的訊息，但有可能影響使用者的體驗
     * * 'error' 遇到了無法正常運作的問題，需要立即解決
     * * 'none' 不記錄任何內容
     */
    level?: 'debug' | 'info' | 'warning' | 'error' | 'none'

    /**
     * 如果爲 true 啓用 dns 查詢日誌
     */
    dns?: boolean
}
export interface Strategy {
    /**
     * 內置 dns 設置，這只會對需要代理 域名查詢 生效
     * {@link https://xtls.github.io/config/dns.html}
     */
    dns?: {
        /**
         * 使用什麼協議查詢 dns
         * 
         */
        network?: 'udp' | 'tcp' | 'https',
        /**
         * 要查詢的記錄類型
         */
        queryStrategy?: 'ip' | 'v4' | 'v6',
    },
    /**
     * 如何復用 tcp 連接，只有傳輸層爲 tcp ws httpupgrade 時才有效
     * {@link https://xtls.github.io/config/outbound.html#muxobject}
     */
    mux?: {
        enabled: true // 必須設置爲 true 才會啓用
        concurrency: number // 單個 tcp 最多復用次數，128爲最大值
        xudpConcurrency: number
        xudpProxyUDP443: string
    },
    /**
     * 如果爲 true 在進行 tls 握手時不會驗證證書有效性
     */
    allowInsecure?: boolean

    /**
     * 只對linux有效，指定要對 v4 v6 哪個ip協議啓用透明代理
     */
    proxy?: 'v4' | 'v6' | 'v4v6'

    /**
     * 定義了當域名存在多個 ip 時，如何選擇 ip 連接服務器
     */
    connectIP?: 'first' | 'v4' | 'v6' | 'v4random' | 'v6random' | 'random'
}
