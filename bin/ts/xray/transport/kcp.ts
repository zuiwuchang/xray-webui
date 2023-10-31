import { Stream } from "./stream";

/**
 * {@link https://xtls.github.io/config/transports/mkcp.html}
 */
export interface KCP {
    /**
     * 最大傳輸單元，有效值是 576 - 1460
     * @default 1350
     */
    mtu?: number
    /**
     * 傳輸時間間隔，單位 毫秒，有效值是 10 - 100 ，mKCP將以此頻率發送數據
     * @default 50
     */
    tti?: number
    /**
     * 上行鏈路容量，即主機發出資料所用的最大頻寬，單位 MB/s，注意是 Byte 而非 bit。 可以設定為 0，表示一個非常小的頻寬
     * @default 5
     */
    uplinkCapacity?: number
    /**
     * 下行鏈路容量，即主機接收資料所使用的最大頻寬，單位 MB/s，注意是 Byte 而非 bit。 可以設定為 0，表示一個非常小的頻寬。
     * @default 20
     */
    downlinkCapacity?: number
    /**
     * 是否啓用擁塞控制
     */
    congestion?: boolean
    /**
     * 單一連接的讀取緩衝區大小，單位是 MB
     * @default 2
     */
    readBufferSize?: number
    /**
     * 單一連接的寫入緩衝區大小，單位是 MB
     * @default 2
     */
    writeBufferSize?: number
    /**
     * 如何混系數據包
     * @default { type: 'none' }
     */
    header?: Header
    /**
     * 可選的混系密碼
     */
    seed?: string
}
export interface Header {
    /**
     * * 'none' 不進行混系
     * * 'srtp' 僞裝成 SRTP 數據包，會被視爲視頻通話數據(如 FaceTime)
     * * 'utp' 僞裝成 uTP 數據包，會被視爲 BT 下載數據
     * * 'wechat-video' 僞裝成微信視頻通話數據包
     * * 'dtls' 僞裝成 DTLS 1.2  數據包
     * * 'wireguard' 僞裝成 WireGuard 數據包
     * @default 'none'
     */
    type?: 'none' | 'srtp' | 'utp' | 'wechat-video' | 'dtls' | 'wireguard'
}
/**
 * mKCP 使用 UDP 來模擬 TCP 連線
 * 
 * @remarks
 * mKCP 犧牲頻寬來降低延遲。 傳輸同樣的內容，mKCP 一般比 TCP 消耗更多的流量。
 */
export interface KCPStream extends Stream {
    network: 'kcp'
    kcpSettings?: KCP
}