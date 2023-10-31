import { Stream } from "./stream";

/**
 * {@link https://xtls.github.io/config/transports/domainsocket.html}
 */
export interface DomainSocket {
    /**
     * socket 路徑
     */
    path?: string
    /**
     * 是否是  abstract domain socket
     * @default false
     */
    abstract?: boolean
    /**
     * abstract domain socket  是否帶 padding
     * @default
     */
    padding?: boolean
}

/**
 * 利用 Unix domain socket  傳輸數據
 */
export interface DomainSocketStream extends Stream {
    network: 'domainsocket'
    dsSettings?: DomainSocket
}