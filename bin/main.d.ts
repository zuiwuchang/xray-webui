/**
 * 提供了各種功能函數供 腳本調用
 */
declare module 'xray/core' {
    /**
     * 返回 GOOS
     */
    export const os: string
    /**
     * 返回 GOARCH
     */
    export const arch: string
    /**
     * 返回 xray-webui 版號
     */
    export const version: string

    /**
     * 程式根路徑
     */
    export const root: string

    /**
     * 輸出打印信息
     */
    export function println(...msg: Array<any>): void

    export interface ExecOption {
        /**
         * 要執行的進程
         */
        name: string
        /**
         * 傳遞給進程的啓動參數
         */
        args?: Array<any>
        /**
         * 啓動進程的工作路徑
         */
        dir?: string
    }
    /**
     * 調用一個系統進程等待進程結束並返回進程輸出到 stdout/stderror 的內容
     */
    export function exec(o: ExecOption): string
    export interface ExecSafeOption extends ExecOption {
        safe: true
    }
    /**
     * 
     * @param safe 爲 true 將返回進程返回的結束代碼
     */
    export function exec(o: ExecSafeOption): { output: string, error?: Error, code: number }
}
declare module 'xray/webui' {
    /**
     * 爲網頁 ui 提供了各種功能的具體實現
     */
    export interface Provider {
        /**
         * 返回防火牆設定
         */
        getFirewall(): string
        /**
         * 銷毀 Provider 和其綁定的資源
         */
        destroy?: () => void
    }
}