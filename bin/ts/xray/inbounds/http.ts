import { Inbound } from "./inbound";
/**
 * {@link https://xtls.github.io/config/inbounds/http.html}
 */
export interface HttpSettings {
    /**
     * 連接空閒秒數，當一個連接在 timeout 範圍內沒有任何流量就會被斷開
     * @default 300
     */
    timeout?: number
    /**
     * 一個用戶數組，用於爲 http 代理鑑權，如果爲空則不需要鑑權
     */
    accounts?: Array<Account>
    /**
     * 當為 true 時，會轉送所有 HTTP 請求，而非只是代理請求
     */
    allowTransparent?: boolean
    /**
     * 用戶等級，用於本地優先級策略
     * @default 0
     */
    userLevel?: number
}
export interface Account {
    /**
     * 用戶名
     */
    user: string
    /**
     * 密碼
     */
    pass: string
}
/**
 * 標準的 http 代理
 * 
 * @remarks
 * 不要在服務器上配置 http 入棧這只會讓你在朝鮮被暴露，它應該作爲客戶端入棧供本地或局域網程序連接代理，
 * 通常 http 代理沒有 socks5 代理高效且不支持代理解析域名以及 udp 請求，一般請直接使用 socks5 代理。
 * 但是如果你要爲新的 pixel 手機連接 google 此時手機上沒有科學上網工具，你可以使用 pc 建立一個 http 代理，
 * 然後在 pixel 的網路連接設置中設置使用這個 http 代理來解決手機先有雞還是蛋的問題
 */
export interface Http extends Inbound<HttpSettings> {
    protocol: 'http'
}
