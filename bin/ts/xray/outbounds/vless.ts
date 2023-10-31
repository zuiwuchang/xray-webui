import { Outbound } from "./outbound";
/**
 * {@link https://xtls.github.io/config/outbounds/vless.html}
 */
export interface VLessSettings {
    /**
     * 服務器數組
     */
    vnext: Array<Server>
}
export interface Server {
    /**
     * 服務器地址
     */
    address: string
    /**
     * 服務器端口
     */
    port: number
    /**
     * 用戶數組
     */
    users: Array<User>
}
export interface User {
    /**
     * 用戶 id
     */
    id: string
    /**
     * 目前必須固定填寫爲 none，用以提示用戶 vless 本身是沒有加密的，它應該配合 tls 使用
     */
    encryption: 'none'
    /**
     * 流控
     * * 'none' or '' 使用普通的 tls
     * * 'xtls-rprx-vision' 使用新 XTLS 模式 包含內層握手隨機填充 支援 uTLS 模擬客戶端指紋
     * * 'xtls-rprx-vision-udp443' 同 xtls-rprx-vision, 但是放行了目標為 443 埠的 UDP 流量
     * @default 'none'
     */
    flow?: '' | 'none' | 'xtls-rprx-vision' | 'xtls-rprx-vision-udp443'
    /**
     * 用戶等級，用於本地優先級策略
     * @default 0
     */
    level?: number
}
/**
 * vless 是 vmess 輕量化後重新設計的，它不依賴系統時間也沒有加密，依賴 tls 提供加密，同樣使用 uuid 進行認證
 * 
 */
export interface VLess extends Outbound<VLessSettings> {
    protocol: 'vless'
}