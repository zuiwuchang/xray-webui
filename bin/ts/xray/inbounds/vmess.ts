import { Fallback } from "./fallback";
import { Inbound } from "./inbound";
/**
 * {@link https://xtls.github.io/config/inbounds/vmess.html}
 */
export interface VMessSettings {
    /**
     * 一組授權用戶信息
     */
    clients: Array<Client>
    /**
     * clients 的預設配置。 僅在配合detour時有效
     */
    default?: Default
    /**
     * 指示對應的出站協定使用另一個伺服器
     */
    detour?: Detour
}
export interface Default {
    /**
     * 用戶等級，用於本地優先級策略
     */
    level: number
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
}
/**
 * {@link https://xtls.github.io/config/inbounds/vmess.html#defaultobject}
 */
export interface Detour {
    /**
     * 一个 inbound 的tag, 指定的 inbound 的必须是使用 VMess 协议的 inbound
     */
    to: string
}
/**
 * v2ray 研發的加密傳輸協議
 */
export interface VMess extends Inbound<VMessSettings> {
    protocol: 'vmess'
}
