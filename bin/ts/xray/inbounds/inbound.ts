import { Streams } from "../transport/streams"

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
    settings?: T
    /**
     * 底層傳輸方式
     */
    streamSettings?: Streams
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
    /**
     * 是否開啓流量探測
     * 
     */
    enabled?: boolean,
    /**
     * 當流量為指定類型時，請按其中包含的目標位址重設目前連線的目標
     * @remarks
     * ['fakedns+others'] 相當於 ['http, 'tls', 'quic', 'fakedns'] 當 IP 位址處於 FakeIP 區間內但沒有命中網域記錄時會使用 http、tls 和 quic 進行比對。 此項僅在 metadataOnly 為 false 時有效
     */
    destOverride?: Array<'http' | 'tls' | 'quic' | 'fakedns' | 'fakedns+others'>,
    /**
     * 啟用時，將僅使用連接的元資料嗅探目標位址。 此時，除 fakedns 以外的 sniffer 將無法啟動（包括 fakedns+others）。
     * 
     * @remarks
     * 如果關閉僅使用元數據推斷目標位址，此時用戶端必須先傳送數據，代理伺服器才會實際建立連線。
     * 此行為與需要伺服器先發起第一個訊息的協定不相容，如 SMTP 協定。
     */
    metadataOnly?: false
    /**
     * 一個網域列表，如果流量探測結果在這個列表中時，將 不會 重置目標位址
     */
    domainsExcluded?: Array<string>
    /**
     * 將嗅探得到的網域名稱僅用於路由，代理目標位址仍為 IP
     * @default false
     */
    routeOnly?: boolean
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