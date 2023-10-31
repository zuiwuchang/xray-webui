import { Fallback } from "./fallback";
import { Inbound } from "./inbound";
/**
 * {@link https://xtls.github.io/config/inbounds/trojan.html}
 */
export interface TrojanSettings {
    /**
     * 一組授權用戶信息
     */
    clients: Array<Client>
    /**
     * 一組回落
     */
    fallbacks?: Array<Fallback>
}
export interface Client {
    /**
     * 用戶密碼
     */
    password: string
    /**
     * 可選的郵箱地址用於標識用戶，多個用戶的 email 不能重複
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
 */
export interface Trojan extends Inbound<TrojanSettings> {
    protocol: 'trojan'
}
