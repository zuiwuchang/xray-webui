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
     * 只有在 linux 下使用 redirect 模式時有效，如果設置會攔截連接 53 端口的 udp/tcp 重定向到此值
     */
    dns?: string
}
export interface Userdata {
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