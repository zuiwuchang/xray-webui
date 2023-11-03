import { ConfigureOptions } from "xray/webui"

/**
 * {@link https://xtls.github.io/config/log.html}
 */
export interface Log {
    /**
     * 訪問日誌存儲檔案路徑，如果爲空白字符串或 undefined 時日誌輸出到 stdout
     * 
     * 特殊字符串 'none' 表示關閉訪問日誌
     */
    access?: string | 'none'
    /**
     * 錯誤日誌存儲檔案路徑，如果爲空白字符串或 undefined 時日誌輸出到 stdout
     * 
     * 特殊字符串 'none' 表示關閉錯誤日誌
     */
    error?: string | 'none'

    /**
     * * 'debug' 調試程序時用到的輸出信息
     * * 'info' 運行時的狀態信息
     * * 'warning' 默認的設定，發生了一些不影響正常運作的問題時輸出的訊息，但有可能影響使用者的體驗
     * * 'error' 遇到了無法正常運作的問題，需要立即解決
     * * 'none' 不記錄任何內容
     */
    loglevel?: 'debug' | 'info' | 'warning' | 'error' | 'none'

    /**
     * 如果爲 true 啓用 dns 查詢日誌
     */
    dnsLog?: boolean
}

export function generateLog(opts: ConfigureOptions<any>): Log | undefined {
    if (opts.environment.port) {
        return undefined
    }
    return {
        loglevel: 'warning',
    }
}