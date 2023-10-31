import { Outbound } from "./outbound";
/**
 * {@link https://xtls.github.io/config/outbounds/vmess.html}
 */
export interface VMessSettings {
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
     * 加密方式，服務器將自動識別客戶端使用的加密方式
     * * 'aes-128-gcm' 推薦在 PC 上使用
     * * 'chacha20-poly1305' 推薦在手機上使用
     * * 'auto' 自動選擇（運行框架為 AMD64、ARM64 或 s390x 時為 'aes-128-gcm' 加密方式，其他情況則為 'chacha20-poly1305' 加密方式）
     * * 'none' 不加密
     * * 'zero' 不加密也不進行消息認證 (v1.4.0+)
     * 
     * @default 'auto'
     */
    security?: 'aes-128-gcm' | 'chacha20-poly1305' | 'auto' | 'none' | 'zero'
    /**
     * 用戶等級，用於本地優先級策略
     * @default 0
     */
    level?: number

    alterId?: number
}
/**
 * v2ray 研發的加密傳輸協議
 */
export interface VMess extends Outbound<VMessSettings> {
    protocol: 'vmess'
}