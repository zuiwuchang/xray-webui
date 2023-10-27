import { DNS } from "./dns"
import { Log } from "./log"
import { Outbounds } from "./outbounds/outbounds"

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
     * 入棧協議
     */
    inbounds: Array<Inbounds>
    /**
     * 出棧協議
     */
    outbounds?: Array<Outbounds>
}

