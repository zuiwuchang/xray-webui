import { Stream } from "./stream";

/**
 * {@link https://xtls.github.io/config/transports/websocket.html}
 */
export interface WS {
    /**
     * 僅用於 inbound，表示是否接收 PROXY protocol
     * @default false
     */
    acceptProxyProtocol?: boolean
    /**
     * websocket 請求路徑
     * @default '/'
     * 
     * @remarks
     * 如果設置 ?ed=number 的查詢參數，將會啓用 Early Data 以降低延遲，number 是首包長度闊值，
     * 如果首包長度超過此值則不會使用 Early Data。
     * Early Data 數據使用 Sec-WebSocket-Protocol 頭承載，如果遇到不兼容可以嘗試調低 ed 值
     */
    path?: string
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
 * 使用標準的 websocket 傳輸，它可以被 cdn 或 nginx 等正確處理，也可以被 VLESS fallbacks path  分流
 */
export interface WSStream extends Stream {
    network: 'ws'
    wsSettings?: WS
}