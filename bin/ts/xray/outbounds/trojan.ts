import { Outbound } from "./outbound";
/**
 * {@link https://xtls.github.io/config/outbounds/trojan.html}
 */
export interface TrojanSettings {
    /**
     * 服務器數組
     */
    servers: Array<Server>
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
     * 用戶密碼
     */
    password: string
    /**
     * 可選的用戶標識
     */
    email?: string
    /**
     * 用戶等級，用於本地優先級策略
     * @default 0
     */
    level?: number
}
/**
 * trojan 被設計工作在正確配置的 tls 傳輸層
 * 
 */
export interface Trojan extends Outbound<TrojanSettings> {
    protocol: 'trojan'
}