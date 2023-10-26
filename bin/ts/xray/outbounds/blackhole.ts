import { Outbound } from "./outbound";
/**
 * {@link https://xtls.github.io/config/outbounds/blackhole.html}
 */
export interface BlackholeSettings {
    response?: Response
}
/**
 * {@link https://xtls.github.io/config/outbounds/blackhole.html#responseobject}
 */
export interface Response {
    /**
     * * 'none' 關閉連接
     * * 'http' 響應一個 HTTP 403 數據包之後關閉連接
     * @default none
     */
    type: 'none' | 'http'
}
/**
 * Blackhole 是一個黑洞，用於阻止數據出棧。通常可以配合路由一起使用以達到屏蔽某些網站的能力
 */
export interface Blackhole extends Outbound<BlackholeSettings> {
    protocol: 'blackhole'
}