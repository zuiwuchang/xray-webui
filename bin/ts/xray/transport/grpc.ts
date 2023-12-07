import { Stream } from "./stream";

/**
 * {@link https://xtls.github.io/config/transports/grpc.html}
 */
export interface GRPC {
    /**
     * 指定一個服務名稱，只需在出棧中配置
     */
    serviceName?: string
    /**
     * 不穩定的測試屬性
     */
    multiMode?: boolean
    /**
     * 設定 gRPC 的用戶代理，可能能防止某些 CDN 阻止 gRPC 流量
     */
    user_agent?: string
    /**
     * 多少秒內沒有數據，進行健康檢測，最小值是 10秒。默認不執行檢測。
     * 
    * 只需在出棧中設定
     */
    idle_timeout?: number
    /**
     * 健康檢測超時秒數
     * @default 20
     */
    health_check_timeout?: number
    /**
     * 是否允許在沒有代理連接時進行健康檢測
     * @default false
     */
    permit_without_stream?: boolean
    /**
     * 初始化 窗口大小
     */
    initial_windows_size?: number
}

/**
 * gRPC 是 google 研發的一個建立在 http2 協議之上的一個遠程調用框架
 */
export interface GRPCStream extends Stream {
    network: 'grpc'
    grpcSettings?: GRPC
}