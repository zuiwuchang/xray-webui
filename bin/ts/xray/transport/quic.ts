import { Stream } from "./stream";

/**
 * {@link https://xtls.github.io/config/transports/quic.html}
 */
export interface Quic {
    /**
     * 如何加密傳輸數據
     * @default 'none'
     */
    security?: 'none' | 'aes-128-gcm' | 'chacha20-poly1305'
    /**
     * 加密使用的密鑰，可以是任意字符串
     */
    key?: string
    /**
     * 如何混系數據包
     * @default { type: 'none' }
     */
    header?: Header
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
 * quic 是 google 研發的 udp 傳輸協議目前處於實驗階段，日後可能會發生變化
 * 
 * @remarks
 * quic 強制要求使用 tls，如果沒有配置 tls 則 xray 會自行簽發一個 tls 證書用於通信
 */
export interface QuicStream extends Stream {
    network: 'quic'
    quicSettings?: Quic
}