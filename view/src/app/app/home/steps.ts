import { HttpClient } from "@angular/common/http";
import { firstValueFrom } from "rxjs";
import { Closed } from "src/internal/closed";
import { Step } from "src/internal/prepare";
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
export interface ListResponse {
    data: Array<ListGroup>
}
export class ListStep implements Step<ListResponse> {
    constructor(private readonly closed: Closed,
        private readonly httpClient: HttpClient,
    ) { }
    data?: ListResponse
    err?: any
    do(): Promise<ListResponse> {
        const data = this.data
        if (data) {
            return Promise.resolve(data)
        }
        return firstValueFrom(this.httpClient.get<ListResponse>('/api/v1/settings/element').pipe(
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