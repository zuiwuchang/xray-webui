import { HttpClient } from "@angular/common/http";
import { URL } from "@king011/easyts/lib/es6/net/url/url";
import { firstValueFrom } from "rxjs";
import { Closed } from "src/internal/closed";
import { Step } from "src/internal/prepare";
import { Base64 } from 'js-base64';
export interface ListElement {
    // 唯一識別碼
    id: string // uint64
    // 節點信息
    url: string
}
export interface ListGroup {
    // 所屬訂閱組
    id: string // uint64
    // 訂閱名稱
    name: string
    // 訂閱地址
    url: string
    // 代理節點
    data: Array<ListElement>
}

export class ListStep implements Step<Array<ListGroup>> {
    constructor(private readonly closed: Closed,
        private readonly httpClient: HttpClient,
    ) { }
    data?: Array<ListGroup>
    err?: any
    do(): Promise<Array<ListGroup>> {
        const data = this.data
        if (data) {
            return Promise.resolve(data)
        }
        return firstValueFrom(this.httpClient.get<Array<ListGroup>>('/api/v1/settings/element').pipe(
            this.closed.takeUntil()
        ))
    }
}

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
export class GeneralStep implements Step<General> {
    constructor(private readonly closed: Closed,
        private readonly httpClient: HttpClient,
    ) { }
    data?: General
    err?: any
    do(): Promise<General> {
        const data = this.data
        if (data) {
            return Promise.resolve(data)
        }
        return firstValueFrom(this.httpClient.get<General>('/api/v1/settings/general').pipe(
            this.closed.takeUntil()
        ))
    }
}
export interface Metadata { }
export class MetadataStep implements Step<Metadata> {
    constructor(private readonly closed: Closed,
        private readonly httpClient: HttpClient,
    ) { }
    data?: Metadata
    err?: any
    do(): Promise<Metadata> {
        const data = this.data
        if (data) {
            return Promise.resolve(data)
        }
        return firstValueFrom(this.httpClient.get<Metadata>('/api/v1/system/metadata').pipe(
            this.closed.takeUntil()
        ))
    }
}

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
    from: 'username' | 'host' | 'port' | 'path' | 'fragment' | 'query' | 'json'
    /**
     * 當來自 'query' 時指定 query 的 鍵值
     */
    key?: string
    /**
     * 這部分要要如何加解碼
     */
    enc?: 'base64' | 'escape'
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
    class?: string

    /**
     * 來源
     */
    from: From
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
    fields: Array<Array<Filed>>
}

export class MetadataProvider {
    private keys_: Map<string, Metadata>
    constructor(readonly metadata: Array<Metadata>) {
        const keys = new Map<string, Metadata>()
        for (const md of metadata) {
            let key = md.protocol ?? ''
            if (key == '') {
                console.warn(`metadata.protocol == ''`, md)
                continue
            }
            const old = keys.get(key)
            if (old) {
                console.warn(`metadata.protocol == '${key}' already exists.`, old, ' -> ', md)
            } else {
                keys.set(key, md)
            }
        }
        this.keys_ = keys
    }
    filed(md: Metadata, key: string): Filed | undefined {
        for (const fields of md.fields) {
            for (const field of fields) {
                if (field.key == key) {
                    return field
                }
            }
        }
        return undefined
    }
    get(url: URL, filed: Filed): string {
        const from = filed.from
        switch (from.from) {
            case 'host':
                return this.decode(from.enc, url.hostname())
            case 'port':
                return this.decode(from.enc, url.port() ?? '')
            case 'query':
                return this.decode(from.enc, url.query().get(from.key ?? ''))
            case 'fragment':
                return this.decode(from.enc, url.fragment)
            case 'json':
                const o: Record<string, string> = JSON.parse(this.decode('base64', url.host))
                return o[from.key!] ?? ''
        }
        return ''
    }

    decode(enc: 'base64' | 'escape' | undefined, s: string): string {
        switch (enc) {
            case 'escape':
                return decodeURIComponent(s)
            case 'base64':
                return Base64.decode(s)
        }
        return s
    }
    encode(enc: 'base64' | 'escape' | undefined, s: string): string {
        switch (enc) {
            case 'escape':
                return encodeURIComponent(s)
            case 'base64':
                return Base64.encode(s)
        }
        return s
    }
}