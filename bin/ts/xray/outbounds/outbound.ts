import { Sockopt } from "../transport/socketopt"
import { Stream } from "../transport/stream"

/**
 * {@link https://xtls.github.io/config/outbound.html#proxysettingsobject}
 */
export interface ProxySettings {
    /**
     * 指定另外一個 outbound 的 tag，以將此 outbound 的數據轉發到指定的 outbound
     */
    tag: string
}
/**
 * {@link https://xtls.github.io/config/outbound.html#muxobject}
 */
export interface Mux {
    /**
     * 如果爲 true 則啓用 tcp 復用
     */
    enabled?: boolean
    /**
     * 最大併發連接數，[1,1024] 
     * * == 0 則使用默認值 8
     * * < 0 不使用 Mux 承載 tcp 流量
     * @default 8
     */
    concurrency?: number
    /**
     * 使用新的 XUDP 聚合隧道(也就是另外一條 Mux 連接)代理 UDP 流量，此值填寫最大 UoT 併發數量， [1,1024]
     * * == 0 與 tcp 走同一隧道，也是傳統方式
     * * < 0 不使用 Mux 隧道傳輸 UDP 流量。另外協議原本的傳輸方式，例如 vless 會使用 UoT 而 Shadowsocks 會使用原生 UDP
     */
    xudpConcurrency?: number
    /**
     * Mux 對代理的 UDP/443(QUIC) 流量的處理方式
     * 
     * * 'reject' 拒绝流量（一般浏览器会自动回落到 TCP HTTP2）
     * * 'allow' 允許流量
     * * 'skip' 不使用 Mux 傳輸，但會使用協議原本的方式傳輸 UDP 流量
     */
    xudpProxyUDP443?: 'reject' | 'allow' | 'skip'
}
/**
 * {@link https://xtls.github.io/config/outbound.html#outboundobject}
 */
export interface Outbound<T> {
    /**
     * 用於發送數據的 ip，當主機有多個 ip 時此值有效
     * @default "0.0.0.0"
     */
    sendThrough?: string
    /**
     * 協議名稱
     */
    protocol: 'blackhole' | 'dns' | 'freedom' | 'http' | 'shadowsocks' | 'socks' | 'trojan' | 'vless' | 'vmess' | 'wireguard'
    /**
     * 依據 protocol 的不同而不同
     */
    settings?: T
    /**
     * 一個自定義名稱，用於在其它設定中定位此連接，當不爲空白字符串時需要確保此值唯一
     */
    tag: string
    /**
     * 傳輸層相關設定
     * {@link StreamSettings}
     */
    streamSettings?: Stream
    /**
     * 出棧代理，當此設置生效時 streamSettings 設定將被忽略
     * 
     * @remarks 這個設置和 SockOpt.dialerProxy  不兼容
     */
    proxySettings?: ProxySettings

    /**
     * tcp 復用
     * {@link Mux}
     */
    mux?: Mux
}