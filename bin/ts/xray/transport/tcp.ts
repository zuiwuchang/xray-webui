import { Stream } from "./stream";

/**
 * {@link https://xtls.github.io/config/transports/tcp.html}
 */
export interface TCP {
    /**
     * 僅用於 inbound，表示是否接收 PROXY protocol
     * @default false
     */
    acceptProxyProtocol?: boolean
    /**
     * 如何僞裝，僞裝無法被 nginx 等第三方程序分流，但是可以被 VLESS fallbacks path 分流
     */
    header?: NoneHeader | HttpHeader
}
export interface TCPStream extends Stream {
    network: 'tcp'
    tcpSettings?: TCP
}
export interface NoneHeader {
    type: 'none'
}
/**
 * 入棧和出棧的 HttpHeader 設定必須完全一致
 */
export interface HttpHeader {
    type: 'http'
    request: HTTPRequest
    response: HTTPResponse
}
/**
 * {@link https://xtls.github.io/config/transports/tcp.html#httpheaderobject}
 */
export interface HTTPRequest {
    /**
     * http 版本
     * @default '1.1'
     */
    version?: string
    /**
     * 請求方法名稱
     * @default 'GET'
     */
    method?: 'HEAD' | 'GET' | 'POST' | 'PUT' | 'DELETE'
    /**
     * 請求 path，當有多個值時每次隨機選取一個
     * @default ['/']
     */
    path?: Array<string>
    /**
     * 請求的 header，如果 value 是一個數組則每次隨機選取數組中的一個值作爲 value
     */
    headers?: Record<string, Array<string> | string>
}
/**
 * {@link https://xtls.github.io/config/transports/tcp.html#httpheaderobject}
 */
export interface HTTPResponse {
    /**
     * http 版本
     * @default '1.1'
     */
    version?: string
    /**
     * http 響應碼
     * @default 200
     */
    status?: number
    /**
     * http 響應內容
     * @default 'OK'
     */
    reason?: string
    /**
     * 響應 header，如果 value 是一個數組則每次隨機選取數組中的一個值作爲 value
     */
    headers?: Record<string, Array<string> | string>
}