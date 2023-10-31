import { Fallback } from "./fallback";
import { Inbound } from "./inbound";
/**
 * {@link https://xtls.github.io/config/inbounds/vless.html}
 */
export interface VLessSettings {
    /**
     * 一組授權用戶信息
     */
    clients: Array<Client>
    /**
     * 目前必須固定填寫爲 none，用以提示用戶 vless 本身是沒有加密的，它應該配合 tls 使用
     */
    decryption: 'none'
    /**
     * 一組回落
     */
    fallbacks?: Array<Fallback>
}
export interface Client {
    /**
     * 用戶id 用於鑑權
     */
    id: string
    /**
     *用戶郵箱，用於區分不同用戶的流量(日誌 統計)
     */
    email: string
    /**
     * 用戶等級，用於本地優先級策略
     * @default 0
     */
    level?: number

    /**
     * 流控
     * * '' or 'none' or undefined 表示使用普通的 tls
     * * 'xtls-rprx-vision' 使用 xtls 模式，僅支持  TCP mKCP DomainSocket 三種傳輸方式
     */
    flow?: '' | 'none' | 'xtls-rprx-vision'
}
/**
 * vless 是 vmess 輕量化後重新設計的，它不依賴系統時間也沒有加密，依賴 tls 提供加密，同樣使用 uuid 進行認證
 */
export interface VLess extends Inbound<VLessSettings> {
    protocol: 'vless'
}
