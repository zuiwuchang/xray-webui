import { Stream } from "./stream";

/**
 * {@link https://xtls.github.io/config/transports/httpupgrade.html}
 */
export interface Httpupgrade {
    /**
     * 僅用於 inbound，表示是否接收 PROXY protocol
     * @default false
     */
    acceptProxyProtocol?: boolean
    /**
     * http 請求路徑
     * @default '/'
     * 
     * @remarks
     * 如果設置 ?ed=number 的查詢參數，將會啓用 Early Data 以降低延遲，number 是首包長度闊值，
     * 如果首包長度超過此值則不會使用 Early Data。
     */
    path?: string
    /**
     * http 請求的 Host 名稱
     */
    host?: string
    /**
     * 發送的 http header
     * @example
     * ```
     * { "Host": "xray.com" }
     * ```
     */
    headers?: Record<string, string>
}

/**
 * 類似 websocket 但是在升級成功後不會走 websocket 協議，而是直接的tcp協議所以效率伯websocekt更高，它可以被 cdn 或 nginx 等正確處理
 */
export interface HttpupgradeStream extends Stream {
    network: 'httpupgrade'
    httpupgradeSettings?: Httpupgrade
}