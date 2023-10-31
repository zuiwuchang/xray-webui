import { Stream } from "./stream";

/**
 * {@link https://xtls.github.io/config/transports/h2.html}
 */
export interface Http {
    /**
     * 域名列表，客戶端會隨機選取一個與服務端通信，服務端會驗證域名是否在列表中
     */
    host?: Array<string>
    /**
     * http 請求路徑
     * @default '/'
     */
    path?: string
    /**
     * 當一段時間內沒有收到數據則執行健康檢測，只需要在出棧中配置。單位 秒
     * 
     * 默認不執行檢測
     */
    read_idle_timeout?: number
    /**
     * 健康檢測的超時秒數
     * @default 15
     */
    health_check_timeout?: number
    /**
     * http 請求方法，只需要在客戶端中配置
     * @default 'PUT'
     */
    method: 'HEAD' | 'GET' | 'POST' | 'PUT' | 'DELETE'

    /**
     * 發送的 http header
     */
    headers?: Record<string, Array<string>>
}

/**
 * 使用標準的 http2 傳輸，可以被 cdn 或 nginx 等正確處理
 * @remarks
 * 由於幾大互聯網龍頭的力推，h2 被廣泛而 h2c 受到抵制很多 cdn 或第三方程序不支持 h2c 
 */
export interface HttpStream extends Stream {
    network: 'http'
    httpSettings?: Http
}