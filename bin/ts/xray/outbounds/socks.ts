import { Outbound } from "./outbound";
/**
 * {@link https://xtls.github.io/config/outbounds/socks.html}
 */
export interface SocksSettings {
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
     * 用戶數組
     */
    users?: Array<User>
}
export interface User {
    /**
     * 用戶名
     */
    user: string
    /**
     * 密碼
     */
    pass: string
    /**
     * 用戶等級，用於本地優先級策略
     * @default 0
     */
    level?: number
}
/**
 * socks5 代理
 * 
 */
export interface Socks extends Outbound<SocksSettings> {
    protocol: 'socks'
}