import { DNS } from "./dns"
import { Inbounds } from "./inbounds/inbounds"
import { Log } from "./log"
import { Outbounds } from "./outbounds/outbounds"
import { Routing } from "./routing"

/**
 * xray json 設定格式
 */
export interface Xray {
    /**
     * 日誌設定
     */
    log?: Log
    /**
     * 內置的 dns 服務器
     */
    dns?: DNS
    /**
     * 路由規則
     */
    routing?: Routing
    /**
     * 入棧協議
     */
    inbounds?: Array<Inbounds>
    /**
     * 出棧協議
     */
    outbounds?: Array<Outbounds>
}

