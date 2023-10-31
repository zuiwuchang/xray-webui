import { Inbound } from "./inbound";
/**
 * {@link https://xtls.github.io/config/inbounds/socks.html}
 */
export interface SocksSettings {
    /**
     * socks 協議的認證方式
     * @default 'noauth'
     */
    auth: 'noauth' | 'password'
    /**
     * 當使用 'password' 進行認證時的用戶列表
     */
    accounts?: Array<Account>,
    /**
     * 是否支持 udp
     * @default false
     */
    udp?: boolean
    /**
     * 本機 ip 地址，當啓用 udp 時需要知道本機 ip 地址
     * @default '127.0.0.1'
     */
    ip?: string
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
 * 標準的 socks 代理，兼容 socks4 socks4a socks5
 * @remarks
 * socks 是標準的代理協議，但是不要在服務器上配置它這只會讓你在朝鮮被暴露，它應該作爲客戶端入棧供本地或局域網程序連接代理
 */
export interface Socks extends Inbound<SocksSettings> {
    protocol: 'socks'
}
