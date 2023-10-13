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
     * 網頁上顯示的文本，會依據 i18n 查詢需要顯示的內容例如 
     * * label['zh-Hant'] 用於顯示正體中文
     * * label['zh-Hans'] 用於顯示簡體中文
     * * label['en-US'] 用於顯示英文
     * * label['default'] 用戶顯示沒有匹配的語言文本
     */
    export type Text = Record<string, string>

    export interface From {
        /**
         * 數據來源自 url 中哪個部分
         */
        from: 'username' | 'path' | 'fragment' | 'query'
        /**
         * 當來自 'query' 時指定 query 的 鍵值
         */
        key?: string
        /**
         * 這部分要要如何加解碼
         */
        enc?: 'base64' | 'raw-base64' | 'url64' | 'raw-url64' | 'escape'
    }
    export interface Filed {
        /**
         * 存儲的鍵名稱，應該保證同一代理的多個 key 唯一
         */
        key: string
        /**
         * 顯示在頁面上的屬性標題
         */
        label: Text
        /**
         * 可選的佔位符說明
         */
        placeholder?: Text

        /**
         * 可選的建議值列表
         */
        value?: Array<string>

        /**
         * 網頁上供用戶輸入的 ui 模型
         * * 'text' 文本輸入框
         * * 'number' 數字輸入框，通常用來輸入端口號
         * * 'select' 選項列表
         * * 'select-editable' 選項列表，但也可以輸入文本
         */
        ui: 'text' | 'number' | 'select' | 'select-editable'
        /**
         * 爲 ui 添加的 樣式表 通常是 PrimeFlex 的 col-?
         */
        class: string

        /**
         * 來源
         */
        from: From
    }
    export interface Metadata {
        /**
         * 網頁上顯示代理協議名稱
         */
        label: Text
        /**
         * * vmess
         * * vless
         * * trojan
         * * shadowsocks
         * * ...
         */
        protocol: string

        /**
         * 可供用戶設置的 代理屬性
         */
        fields: Array<Array<Filed>>
    }
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

        /**
         * 返回支持的節點元信息
         */
        metadata(): Array<Metadata>
    }
}