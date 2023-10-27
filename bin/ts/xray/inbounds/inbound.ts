import { Stream } from "../transport/stream"

/**
 * {@link https://xtls.github.io/config/inbound.html}
 */
export interface Inbound<T> {
    /**
     * 監聽地址
     * @default '0.0.0.0'
     */
    listen?: string
    /**
     * 監聽端口
     * * 'env:XXX' 從環境變量 XXX 中讀取端口，例如 'env:PORT'
     * * 'start-stop' 端口範圍,例如 '5-10' or '5,8,10-20'
     */
    port: number | string,
    /**
     * 協議名稱
     */
    protocol: 'dokodemo-door' | 'http' | 'shadowsocks' | 'socks' | 'trojan' | 'vless' | 'vmess'
    /**
     * 依據 protocol 的不同而不同
     */
    settings: T
    /**
     * 底層傳輸方式
     */
    streamSettings?: Stream
    /**
     * 一個自定義名稱，用於在其它設定中定位此連接，當不爲空白字符串時需要確保此值唯一
     */
    tag?: string
    /**
     * 流量嗅探
     */
    sniffing?: Sniffing
    /**
     * 當設置了多個端口時，端口如何分配
     */
    allocate?: Allocate
}
/**
 * {@link https://xtls.github.io/config/inbound.html#sniffingobject}
 */
export interface Sniffing {
    // "enabled": true,
    // "destOverride": ["http", "tls", "fakedns"],
    // "metadataOnly": false,
    // "domainsExcluded": [],
    // "routeOnly": false
}
/**
 * {@link https://xtls.github.io/config/inbound.html#allocateobject}
 */
export interface Allocate {
    /**
     * * 'always' 總是分配所有指定的端口
     * * 'random' 每間 refresh 分鐘，隨機選取 concurrency 個端口進行分配
     */
    strategy: 'always' | 'random'
    /**
     * 'random' 策略間隔分鐘，最小爲 2 建議使用 5
     */
    refresh?: number
    /**
     * 'random' 策略分配端口數量，最小爲 1 最大爲端口總數的 1/3 建議使用 3
     */
    concurrency?: number
}