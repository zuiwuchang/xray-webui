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
     * 將參數輸出到服務器 os.Stdout 和網頁日誌
     */
    export function print(...args: Array<any>): void
    /**
     * 將參數輸出到服務器 os.Stdout 和網頁日誌，並在末尾自動輸出換行
     */
    export function println(...args: Array<any>): void

    export interface ExecOptions {
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
    export interface ExecLogOptions extends ExecOptions {
        log: true
    }
    /**
     * 調用一個系統進程等待進程結束，並返回進程輸出到 stdout/stderror 的內容
     */
    export function exec(o: ExecOptions): string
    /**
     * o.log 爲 true 將 stdout/stderror 輸出到服務器進程的 os.Stdout 以及網頁日誌
     */
    export function exec(o: ExecLogOptions): void

    export interface ExecSafeOptions extends ExecOptions {
        safe: true
    }
    /**
     * o.safe 爲 true 將返回進程返回的結束代碼，而不會拋出異常
     */
    export function exec(o: ExecSafeOptions): { output: string, error?: Error, code: number }
    export interface ExecLogSafeOptions extends ExecSafeOptions {
        log: true
    }
    /**
     * o.safe 爲 true 將返回進程返回的結束代碼，而不會拋出異常  
     * o.log 爲 true 將 stdout/stderror 輸出到服務器進程的 os.Stdout 以及網頁日誌
     */
    export function exec(o: ExecLogSafeOptions): { error?: Error, code: number }

    /**
     * 使用 local resolver 將域名解析到 ip
     */
    export function lookupHost(hostname: string): Array<string>
    /**
     * 每次都會創建新的 js 環境調用腳本函數，你可以使用 sessionStorage 在多次調用中共享數據。  
     * 例如你可以在 configure 調用中存儲下服務器的 ip 地址，然後在 turnOn 調用將服務器 ip 設置到直連白名單中
     */
    export const sessionStorage: Storage

}
declare module 'xray/webui' {
    /**
     * 網頁上顯示的文本，會依據 i18n 查詢需要顯示的內容例如 
     * * label['zh-Hant'] 用於顯示正體中文
     * * label['zh-Hans'] 用於顯示簡體中文
     * * label['en'] 用於顯示英文
     * * label['default'] 用戶顯示沒有匹配的語言文本
     */
    export type Text = Record<string, string>

    export interface From {
        /**
         * 數據來源自 url 中哪個部分
         */
        from: 'username' | 'password' | 'host' | 'port' | 'path' | 'fragment' | 'query' | 'json' | 'base64-username' | 'base64-password'
        /**
         * 當來自 'query' 時指定 query 的 鍵值，或者來自 'json' 時指定 json key
         */
        key?: string
        /**
         * 這部分要要如何加解碼
         */
        enc?: 'base64'
    }
    export interface Filed {
        /**
         * 存儲的鍵名稱，應該保證同一代理的多個 key 唯一
         */
        key?: string
        /**
         * 顯示在頁面上的屬性標題
         */
        label?: Text
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
         * * 'placeholder' 只是在網頁佈局上佔位
         * * 'text' 文本輸入框
         * * 'number' 數字輸入框，通常用來輸入端口號
         * * 'select' 選項列表
         * * 'select-editable' 選項列表，但也可以輸入文本
         */
        ui: 'placeholder' | 'text' | 'number' | 'select' | 'select-editable'
        /**
         * 爲 ui 添加的 樣式表 通常是 PrimeFlex 的 col-?
         */
        class?: string

        /**
         * 來源
         */
        from?: From

        /**
         * 如果爲 true 表示只在 ui 頁面中有效
         */
        onlyUI?: boolean
    }
    export interface Metadata {
        /**
         * 網頁上顯示代理協議名稱
         */
        label?: Text
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
        fields: Array<Filed>
    }
    export interface Strategy {
        /**
         * 供腳本參考的 策略值 ，腳本應該依據此值生成 xray 的配置
         * 
         * * 1 默認的代理規則
         * * 2 全域代理
         * * 3 略過區域網路的代理(僅對公網ip使用代理)
         * * 4 代理優先(略過區域網路和西朝鮮的代理)
         * * 5 直連優先 (僅對非西朝鮮公網使用代理)
         * * 6 直接連接
         */
        value: 1 | 2 | 3 | 4 | 5 | 6

        /**
         * 靜態 ip 列表
         * 
         * ```
         * baidu.com 127.0.0.1
         * dns.google 8.8.8.8 8.8.4.4
         * ```
         */
        host: Array<Array<string>>

        /**
         * 這些 ip 使用代理
         */
        proxyIP: Array<string>
        /**
         * 這些 域名 使用代理
         */
        proxyDomain: Array<string>

        /**
         * 這些 ip 直接連接
         */
        directIP: Array<string>
        /**
         * 這些 域名 直接連接
         */
        directDomain: Array<string>

        /**
         * 這些 ip 禁止訪問
         */
        blockIP: Array<string>
        /**
         * 這些 域名 禁止訪問
         */
        blockDomain: Array<string>
    }
    export interface Environment {
        /**
         * 出棧方案
         */
        scheme: 'vmess' | 'vless' | 'trojan' | 'socks' | 'ss'
        /**
         * 如果設置了此值，應該使用此值作爲 socks5 的監聽端口，並且此 socks5 代理無需驗證
         * 
         * @remarks
         * 在測試代理速度時，服務器會查找一個空閒的 tcp 端口並傳入此處，後續會使用生成的配置啓動程序並且測試代理速度
         * 
         * 因爲後續會用作速度測試，所以配置也應該策略設定所有請求都以代理訪問
         */
        port?: number
    }
    export interface ConfigureOptions<T> {
        /**
         * 設定環境
         */
        environment: Environment
        /**
         * 使用的策略
         */
        strategy: Strategy
        /**
         * 原始節點信息
         */
        url: string
        /**
         * 節點信息
         */
        fileds: Record<string/** Filed.key */, string>
        /**
         * 自定義設定
         */
        userdata?: T
    }
    export interface ConfigureResult {
        /**
         * 生成的設定內容
         */
        content: string
        /**
         * 設定檔應該使用的擴展名 例如 .json
         */
        extension: string
    }
    export interface ServeResult {
        /**
         * 啓動進程的工作路徑
         */
        dir?: string

        /**
        * 要執行的進程
        */
        name: string
        /**
         * 傳遞給進程的啓動參數
         */
        args?: Array<string>
    }
    export interface TurnOptions {
        /**
         * 原始節點信息
         */
        url: string
        /**
         * 節點信息
         */
        fileds: Record<string/** Filed.key */, string>
        /**
         * 自定義設定
         */
        userdata?: T
    }
    /**
     * 爲網頁 ui 提供了各種功能的具體實現
     */
    export interface Provider {
        /**
         * 銷毀 Provider 和其綁定的資源
         */
        destroy?: () => void

        /**
         * 返回透明代理設定
         */
        firewall(): string
        /**
         * 啓動透明代理
         */
        turnOn(opts: TurnOptions): void
        /**
         * 關閉透明代理
         */
        turnOff(opts: TurnOptions): void

        /**
         * 返回支持的節點元信息
         */
        metadata(): Array<Metadata>

        /**
         * 返回配置
         */
        configure(opts: ConfigureOptions): ConfigureResult

        /**
         * 返回啓動代理的命令
         * @param cnf 設定檔案路徑
         * @param opts 生成設定檔的原始參數
         */
        serve(cnf: string): ServeResult
    }
}