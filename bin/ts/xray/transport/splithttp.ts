import { Stream } from "./stream";

/**
 * {@link https://xtls.github.io/config/transports/splithttp.html}
 */
export interface SplithttpSettings {
    /**
     * 上行模式
     * @default "auto"
     */
    mode?: string

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

    /**
     * 上傳分塊大小 默認爲 1mb，如果要使用 cdn 請確定不要超過 cdn 的 body 上限(通常就是 1mb)
     * @default 1024*1024
     */
    maxUploadSize?: number
    /**
     * 上傳最大併發數
     * @default 10
     */
    maxConcurrentUploads?: number

    extra?: any
}

/**
 * 完全有 http post/get 傳輸數據，可以利用 cdn 的 h3 來提速
 */
export interface SplithttpStream extends Stream {
    network: 'xhttp'
    xhttpSettings?: SplithttpSettings
}