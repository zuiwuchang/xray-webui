export interface General {
    // 測試速度請求的 url
    url: string
    // 啓動時自動運行 代理服務
    run: boolean
    // 因爲 Run 而自動啓動服務後 設置服務器規則
    firewall: boolean
    // 使用的策略，默認爲 1
    strategy: number
    // 自定義設定， jsonnet 字符串
    userdata: string
}