import { Outbound } from "./outbound";
/**
 * {@link https://xtls.github.io/config/outbounds/shadowsocks.html}
 */
export interface ShadowsocksSettings {
    /**
     * 服務器數組
     */
    servers: Array<Server>
}
export interface Server {
    /**
     * 可選的用戶標識
     */
    email?: string
    /**
     * 服務器地址
     */
    address: string
    /**
     * 服務器端口
     */
    port: number
    /**
     * 加密方式
     * 
     * @remarks
     * 
     * * 推薦的加密方式 '2022-blake3-aes-128-gcm', '2022-blake3-aes-256-gcm', '2022-blake3-chacha20-poly1305'
     * * 其它加密方式 'aes-256-gcm', 'aes-128-gcm', 'chacha20-poly1305 或称 chacha20-ietf-poly1305', 'xchacha20-poly1305 或称 xchacha20-ietf-poly1305', 'none', 'plain'
     * 
     */
    method: string
    /**
     * 密碼
     */
    password: string
    /**
     * 如果爲 true 啓用 udp over tcp
     */
    uot?: boolean
    /**
     * UDP over TCP 實現版本
     */
    UoTVersion: 1 | 2
    /**
     * 用戶等級，用於本地優先級策略
     * @default 0
     */
    level?: number
}
/**
 * shadowsocks 協議反抗西朝鮮的開端
 */
export interface Shadowsocks extends Outbound<ShadowsocksSettings> {
    protocol: 'shadowsocks'
}