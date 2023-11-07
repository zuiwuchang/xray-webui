# xray-webui

xray-webui 是 xray 的一個跨平臺(桌面系統) webui，爲 linux windows mac 提供了一致的使用體驗。

xray-webui 支持了 es6 [腳本](#腳本)，你可以通過修改腳本來支持最新的 xray 特性。或者將底層對 xray 的調用替換成爲任何其它的類似軟體。


# 腳本

xray-webui 默認加載一個 js(js/main.js) 腳本，腳本必須導出一個 `export function create(): Provider` 函數

Provider 會橋接網頁 ui 以及對底層 xray 的調用，main.d.ts 中有詳細的定義，此外 ts 檔案夾下存放了一個官方維護的腳本，你可以參數它按需編寫自己的腳本

```
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
    serve(cnf: string, opts: ConfigureOptions<Userdata>): ServeResult
}
```

* **destroy** 每次響應用戶 ui 請求時，都會調用腳本的 create 函數創建 Provider 實例，並在 實例不需要時調用 destroy(如果存在) 釋放資源
* **metadata** 返回了一個元信息，網頁 ui 會依據它爲各種協議生成輸入 ui，同時系統也會依據它的定義來解析與生成代理節點的訂閱信息
* **configure** 這個函數應該爲 xray 生成設定檔案的內容，以供後續使用它來啓動 xray
* **serve** 這個函數應該返回啓動 xray 的命令，cnf 是存儲了 configure 生成內容的檔案路徑

一些系統支持設置透明代理(目前官方只維護了 linux 腳本)，你可以修改下述三個函數來自定義如何啓動與關閉你所在平臺的透明代理

* **firewall** 它返回的內容會被顯示到網頁 `/settings/firewall` 頁面。用於顯示當前網頁設定(linux 目前只是打印了 iptables-save 設定)
* **turnOn** 它在用戶點擊網頁上的**啓用透明代理**等按鈕時被調用。(linux 目前是調用了 iptable 設置代理規則)
* **turnOff** 它在用戶點擊網頁上的**關閉透明代理**等按鈕時被調用。(linux 目前是調用了 iptable 設置刪除了 turnOn 時設置的規則)

