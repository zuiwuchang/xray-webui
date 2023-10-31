/**
 * {@link https://xtls.github.io/config/transport.html#sockoptobject}
 */
export interface Sockopt {
    /**
     * 當其值非零時，在 outbound 連線上以此數值標記 SO_MARK。
     * * 僅適用於 Linux 系統
     * * 需要 CAP_NET_ADMIN 權限
     * @default 0
     */
    mark?: number
    /**
     * tcp 數據包最大傳輸單元
     */
    tcpMaxSeg?: number,
    /**
     * 如果爲 true 或 > 0，則啓用 TCP Fast Open，否則不啓用
     */
    tcpFastOpen?: boolean | number
    /**
     * 是否啓用透明代理，需要 CAP_NET_ADMIN 權限
     * 
     * * 'redirect' 使用 redirect 模式，建議在老舊設備或 windows wsl 子系統等無法使用 'tproxy' 時使用
     * * 'tproxy' 使用 tproxy 模式
     * * 'off' 關閉透明代理
     * @default 'off'
     */
    tproxy?: 'redirect' | 'tproxy' | 'off'
    /**
     * 建立連接時如何解析域名
     * 
     * * 'AsIs' 提供系統 dns 服務器解析域名
     * * 'UseIP' 用內置 DNS 解析獲取 IP, 向此網域發出連線
     * * 'UseIPv4' 用內置 DNS 解析獲取 IP, 向此網域發出連線
     * * 'UseIPv6' 用內置 DNS 解析獲取 IP, 向此網域發出連線
     * @default 'AsIs'
     */
    domainStrategy?: 'AsIs' | 'UseIP' | 'UseIPv4' | 'UseIPv6'
    /**
     * 一個出站代理的識別。 當值不為空時，將使用指定的 outbound 發出連線。 此選項可用於支援底層傳輸方式的鍊式轉送。
     */
    dialerProxy?: string
    /**
     * 僅用於 inbound，指示是否接收 PROXY protocol
     */
    acceptProxyProtocol?: boolean
    /**
     * TCP 保持活躍的資料包發送間隔，單位為秒
     */
    tcpKeepAliveInterval?: number
    /**
     * TCP 空閒時間閾值，單位為秒。 當 TCP 連線空閒時間達到這個閾值時，將開始發送 Keep-Alive 探測包
     * 
     * * 0 使用 golang 默認設定
     * * -1 不使用 tcp 保活
     */
    tcpKeepAliveIdle?: number
    tcpUserTimeout?: number
    /**
     * tcp 擁塞算法，不設置則使用系統默認算法。僅在 linux 下有效
     * 
     */
    tcpcongestion?: 'bbr' | 'cubic' | 'reno'
    /**
     * 綁定網卡名稱。僅在 linux 下有效
     */
    interface?: string
}