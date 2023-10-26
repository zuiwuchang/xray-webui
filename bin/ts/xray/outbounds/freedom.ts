import { Outbound } from "./outbound";

export interface FreedomSettings {
    /**
     * * 'AsIs' 透過操作系統 DNS 伺服器解析取得 IP, 向此網域發出連線
     * * 'UseIP' 用內置 DNS 解析獲取 IP, 向此網域發出連線。當 outbound.sendThrough 被設定時自動判斷使用 ip4 or ip6
     * * 'UseIPv4' 用內置 DNS 解析獲取 IP, 向此網域發出連線。並且使用 ip4 地址，如果和 outbound.sendThrough 設定不匹配會導致連接失敗
     * * 'UseIPv6' 用內置 DNS 解析獲取 IP, 向此網域發出連線。並且使用 ip6 地址，如果和 outbound.sendThrough 設定不匹配會導致連接失敗
     * 
     * @default AsIs
     */
    domainStrategy?: 'AsIs' | 'UseIP' | 'UseIPv4' | 'UseIPv6'
    /**
     * 強制將流量轉發到此地址 例如 '127.0.0.1:80' 
     * * ':80' 這種寫法不會修改目標地址只修改端口
     * * '127.0.0.1:0' 這種寫法不會修改端口只修改地址 
     */
    redirect?: string

    /**
     * 用戶等級，用於本地優先級策略
     * @default 0
     */
    userLevel?: number

    /**
     * 一些鍵值對配置項，用於控制發出的 TCP 分片，在某些情況下可以欺騙審查系統，例如繞過 SNI 黑名單
     * 
     * @example
     * ```
     * {
     *     packets: 'tlshello',
     *     length: '100-200',
     *     interval: '10-20', // ms
     * }
     * ```
     */
    fragment?: {
        packets: string
        length: number
        interval: string
    }
}
/**
 * Freedom 用於向任意網路發送正常的 TCP/UDP 流量(即不使用代理的流量)
 */
export interface Freedom extends Outbound<FreedomSettings> {
    protocol: 'freedom'
}