import { Inbound } from "./inbound";
/**
 * {@link https://xtls.github.io/config/inbounds/dokodemo.html}
 */
export interface DokodemoDoorSettings {
    /**
     * 轉發的目標地址，當 followRedirect 爲 true 時可以爲 undefined
     */
    address?: string
    /**
     * 轉發的目標端口
     */
    port?: number
    /**
     * 可以接受的網路協議
     * @default 'tcp'
     */
    network?: 'tcp' | 'udp' | 'tcp,udp'
    /**
     * 連接空閒秒數，當一個連接在 timeout 範圍內沒有任何流量就會被斷開
     * @default 300
     */
    timeout?: number
    /**
     * 當爲 true 時會自動識別出由 iptables 轉發而來的數據並轉發到相應的目標地址
     */
    followRedirect: boolean
    /**
     * 用戶等級，用於本地優先級策略
     * @default 0
     */
    userLevel?: number
}
/**
 * Dokodemo door 可以監聽一個本地端口並將數據轉發到服務器上，從而達到端口映射的效果，但它在朝鮮更實際的用法是作爲透明代理的入口
 */
export interface DokodemoDoor extends Inbound<DokodemoDoorSettings> {
    protocol: 'dokodemo-door'
}
