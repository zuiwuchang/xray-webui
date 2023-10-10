export interface ListResponse {
    data: Array<Subscription>
}
export interface Subscription {
    // 唯一識別碼
    id: string
    // 給人類看的名稱
    name: string
    // 訂閱地址
    url: string
}

export interface SubscriptionView {
    data: Subscription
    backup: Subscription
    view: boolean
    run?: boolean
    add?: boolean
}
export interface AddResponse {
    id: string
}
