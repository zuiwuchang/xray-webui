import { Inbound } from "./inbound";
export type Method = '2022-blake3-aes-128-gcm' | '2022-blake3-aes-256-gcm' | '2022-blake3-chacha20-poly1305' |
    'aes-256-gcm' | 'aes-128-gcm' |
    'chacha20-poly1305' | 'chacha20-ietf-poly1305' |
    'xchacha20-poly1305' | 'xchacha20-ietf-poly1305' |
    'none' | 'plain'
/**
 * {@link https://xtls.github.io/config/inbounds/shadowsocks.html}
 */
export interface ShadowsocksSettings {
    /**
     * 鑑權的密碼
     */
    password?: string
    /**
     * 使用的加密算法
     * @remarks
     * 
     * * 推薦的加密方式 '2022-blake3-aes-128-gcm', '2022-blake3-aes-256-gcm', '2022-blake3-chacha20-poly1305'
     * * 'aes-256-gcm', 'aes-128-gcm'
     * * 'chacha20-poly1305' 别名 'chacha20-ietf-poly1305'
     * * 'xchacha20-poly1305' 别名 'xchacha20-ietf-poly1305'
     * * 'none', 'plain'
     */
    method?: Method
    /**
     * 用戶等級，用於本地優先級策略
     * @default 0
     */
    level?: number
    /**
     * 用戶郵箱，用於區分不同用戶的流量(日誌 統計)
     */
    email?: string
    /**
     * 可接受的網路協議
     * @default 'tcp'
     */
    network: 'tcp' | 'udp' | 'tcp,udp'
    /**
     * 當有多個用戶時爲多用戶配置用戶信息
     */
    clients?: Array<Client>
}
export interface Client {
    /**
     * 鑑權的密碼
     */
    password: string
    /**
     * 使用的加密算法
     * @remarks
     * 
     * * 推薦的加密方式 '2022-blake3-aes-128-gcm', '2022-blake3-aes-256-gcm', '2022-blake3-chacha20-poly1305'
     * * 'aes-256-gcm', 'aes-128-gcm'
     * * 'chacha20-poly1305' 别名 'chacha20-ietf-poly1305'
     * * 'xchacha20-poly1305' 别名 'xchacha20-ietf-poly1305'
     * * 'none', 'plain'
     */
    method: Method
    /**
     * 用戶等級，用於本地優先級策略
     * @default 0
     */
    level?: number
    /**
     * 用戶郵箱，用於區分不同用戶的流量(日誌 統計)
     */
    email?: string
}
/**
 * shadowsocks 協議反抗西朝鮮的開端
 */
export interface Shadowsocks extends Inbound<ShadowsocksSettings> {
    protocol: 'shadowsocks'
}
