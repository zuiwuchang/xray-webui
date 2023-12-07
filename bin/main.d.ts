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
     * 例如你可以在 serve 調用中存儲下服務器的 ip 地址，然後在 turnOn 調用將服務器 ip 設置到直連白名單中
     */
    export const sessionStorage: Storage

    /**
     * 讓腳本暫停一段時間後再繼續運行
     * @param ms 要暫停的毫秒數
     */
    export function sleep(ms: number): void

    export interface NetInterface {
        name: string
        addrs: Array<string>
    }
    /**
     * 返回網卡信息
     */
    export function interfaces(): Array<NetInterface>

    /**
     * 創建一個文本檔案並寫入指定內容
     */
    export function writeTextFile(filepath: string, text: string): void
}
/**
 * 服務進程管理，目前主要用於啓動 tun2socks 進程 
 */
declare module 'xray/systemctl' {
    export enum Run {
        /**
         * 不執行任何額外工作，只是進行註冊
         */
        none = 1,
        /**
         * 註冊成功後立刻運行服務
         */
        start = 2,
    }
    export enum Restart {
        /**
         * 不執行重啓
         */
        none = 1,
        /**
         * 進程錯誤時重啓
         */
        fail = 2,
        /**
         * 始終執行重啓
         */
        always = 3,
    }
    export interface InstallOptions {
        /**
         * 服務唯一名稱
         */
        id: string
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

        /**
         * 一個毫秒數，用於在進程重啓前等待的時間
         * @default 0
         */
        interval?: number
        /**
         * 進程重啓策略
         * @default Restart.none
         */
        restart?: Restart
        /**
         * 安裝成功後要執行的操作
         * @default Run.none
         */
        run?: Run
        /**
         * 如果爲 true 則將進程 stdout/stderror 輸出到 os.Stdout 和網頁
         */
        log?: boolean
    }
    /**
     * 以指定信息安裝一個服務，如果服務存在則替換掉舊服務。
     * @returns 返回是否有新的服務被安裝/替換
     */
    function install(opts: InstallOptions): boolean
    /**
     * 卸載一個服務
     * @returns 返回是否有存在的服務被卸載
     */
    function uninstall(id: string): boolean
    /**
     * 如果服務沒有運行則運行它
     * @returns 返回是否有新進程被開啓(如果進程已經運行則不會運行新進程)
     */
    function start(id: string): boolean
    /**
     * 關閉正在運行的服務
     * @returns 返回是否有進程被開啓(如果進程不是運行狀態則執行關閉操作)
     */
    function stop(id: string): boolean

    export interface Status {
        /**
         * 服務安裝信息
         */
        install: InstallOptions
        /**
         * 當前進程 pid 如果爲 uninstall 表示沒有進程運行
         */
        pid?: number
        /**
         * 服務進程的退出碼，如果爲 undefined 則表示從未退出過
         */
        code?: number
        /**
         * 服務進程已經啓動了多少次
         */
        count: number
    }
    /**
     * 如果服務存在，則返回它的狀態
     */
    function status(id: string): Status | undefined
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
    /**
     * 只有在 key 的的值與 value 相同時別名才生效
     */
    export interface Alias {
        key: string
        value: string
        /**
         * form 別名
         */
        from: From
    }
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
         * 來源別名
         */
        alias?: Array<Alias>
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
        args?: Array<any>
    }
    export interface TurnOptions<T> {
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
    export interface Default {
        /**
         * 測試請求的網址
         */
        url: string
        /**
         * 是否自動啓動 xray
         */
        run: boolean
        /**
         * 是否自動啓動透明代理
         */
        firewall: boolean
        /**
         * 策略
         * 
         * 1 默認的代理規則
         * 2 全域代理
         * 3 略過區域網路的代理(僅對公網ip使用代理)
         * 4 代理優先(略過區域網路和西朝鮮的代理)
         * 5 直連優先 (僅對非西朝鮮公網使用代理)
         * 6 直接連接
         */
        strategy: 1 | 2 | 3 | 4 | 5 | 6
        /**
         * 用戶設定
         */
        userdata: string
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
         * 返回底層 xray 版本
         */
        version(): string

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
        serve(cnf: string, opts: ConfigureOptions<Userdata>): ServeResult

        /**
         * 返回默認設定
         */
        getDefault?: () => Default
    }
}