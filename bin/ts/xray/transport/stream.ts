import { Sockopt } from "./socketopt"

/**
 * {@link https://xtls.github.io/config/transport.html#streamsettingsobject}
 */
export interface Stream {
    /**
     * 數據流使用的傳輸方式
     * @default 'tcp'
     */
    network?: 'tcp' | 'kcp' | 'ws' | 'http' | 'domainsocket' | 'quic' | 'grpc'
    /**
     * 傳輸層如何加密
     * * 'none' 不加密
     * * 'tls' 常規的 tls 加密
     * * 'reality' xray 修改後的 tls 解決了 tls 指紋被識別 tls in tls 被識別等問題
     * @default 'none'
     */
    security?: 'none' | 'tls' | 'reality' | 'xtls'
    /**
     * tls 設定，由 golang 提供
     */
    tlsSettings?: TLS
    xtlsSettings?: TLS
    /**
     * reality 設定，由 xray 研發用於提供比直接的 tls 更隱蔽的傳輸方式
     */
    realitySettings?: InboundReality | OutboundReality

    // "kcpSettings": {},
    // "wsSettings": {},
    // "httpSettings": {},
    // "quicSettings": {},
    // "dsSettings": {},
    // "grpcSettings": {},
    /**
     * 透明代理相關設定
     */
    sockopt?: Sockopt
}

/**
 * {@link https://xtls.github.io/config/transport.html#tlsobject}
 */
export interface TLS {
    /**
     * 指定服務端證書的域名
     */
    serverName?: string
    /**
     * 當爲它 true 時，服務端收到的 sni 與證書域名不匹配時拒絕 tlc 握手
     * @default false
     */
    rejectUnknownSni?: boolean
    /**
     * 當爲 true 時，客戶端不驗證服務端證書是否有效
     */
    allowInsecure?: boolean
    /**
     * 一個字符串數組指定了與 tls 服務端握手時的 ALPN 值
     * @default ['h2', 'http/1.1']
     */
    alpn?: Array<string>
    /**
     * tls 最小版本
     */
    minVersion?: string
    /**
     * tls 最大版本
     */
    maxVersion?: string
    /**
     * 加密套件名稱，多個值以英文字符 ':' 分隔
     */
    cipherSuites?: string
    /**
     * 證書數組
     */
    certificates?: Array<Certificate>
    /**
     * 是否禁用系統自帶的證書
     * @default false
     */
    disableSystemRoot?: boolean
    /**
     * 是否在 ClientHello 中添加 session_ticket 擴展，通常 golang 程序都沒有這個擴展故推薦設置 false
     * @default false
     */
    enableSessionResumption?: boolean
    /**
     * 如果設置則將通過 uTLS 庫模擬 TLS 指紋
     * 
     * * 'random' 在較新的瀏覽器中隨機選取一個
     * * 'randomized' 完成隨機生成一個相對獨一無二的指紋
     */
    fingerprint?: '' | 'chrome' | 'firefox' | 'safari' |
    'ios' | 'android' |
    'edge' | '360' | 'qq' |
    'random' | 'randomized' | string

    /**
     * 用於指定遠端伺服器的憑證鏈 SHA256 雜湊值，使用標準編碼格式。 只有當伺服器端憑證鏈雜湊值符合設定項目中之一時才能成功建立 TLS 連接
     */
    pinnedPeerCertificateChainSha256?: Array<string>
}
export interface Certificate {
    /**
     * OCSP 裝訂更新，與憑證熱重載的間隔秒數
     * @default 3600
     */
    ocspStapling?: number
    /**
     * 如果爲 true 則關閉證書熱更新與 ocspStapling 功能
     */
    oneTimeLoading?: boolean
    /**
     * 證書用途
     * * 'encipherment' 證書用於 TLS 認證和加密
     * * 'verify' 證書用於驗證遠端 TLS 的憑證。 當使用此項目時，目前憑證必須為 CA 憑證
     * * 'issue' 證書用於簽發其它證書。 當使用此項目時，目前憑證必須為 CA 憑證。
     * @default 'encipherment'
     */
    usage?: 'encipherment' | 'verify' | 'issue'
    /**
     * 證書存儲路徑
     */
    certificateFile?: string
    /**
     * 證書密鑰存儲路徑
     */
    keyFile?: string
    /**
     * 直接以字符串形式給出證書內容
     */
    certificate?: Array<string>
    /**
     * 直接以字符串形式給出證書密鑰
     */
    key?: Array<string>
}
/**
 * {@link https://xtls.github.io/config/transport.html#realityobject}
 */

export interface InboundReality {
    /**
     * 如果爲 true 則打印調試信息
     * @default false
     */
    show?: boolean
    /**
     * {@see https://xtls.github.io/config/features/fallback.html#fallbackobject}
     */
    dest: string
    /**
     * {@see https://xtls.github.io/config/features/fallback.html#fallbackobject}
     */
    xver?: number
    /**
     * 客戶端選用的 serverName 列表
     */
    serverNames: Array<string>
    /**
     * 執行 ./xray x25519  生成
     */
    privateKey: string
    /**
     * xray 最低版本 格式爲 'x.y.z'
     */
    minClientVer?: string
    /**
     * xray 最高版本 格式爲 'x.y.z'
     */
    maxClientVer?: string

    /**
     * 允許的最大時間差，單位 毫秒
     */
    maxTimeDiff?: number

    /**
     * 客戶端可用的 shortIds 列表，用於區分不同客戶端
     */
    shortIds: Array<string>
}
export interface OutboundReality {
    /**
     * 對應 InboundReality.serverNames 中的一個值
     */
    serverName: string
    /**
     * 指紋
     */
    fingerprint: string
    /**
     * 對應 InboundReality.shortID 中的一個值
     */
    shortID: string
    /**
     * 服務端私鑰對應的公鑰。 使用 ./xray x25519 -i "伺服器私鑰" 生成
     */
    publicKey: string
    /**
     * 爬蟲初始路徑與參數，建議每個客戶端不同
     */
    spiderX: string
}
// # Reality 推薦域名
// gateway.icloud.com
// itunes.apple.com
// download-installer.cdn.mozilla.net
// addons.mozilla.org
// www.microsoft.com
// www.lovelive-anime.jp

// # CDN
// Apple:
// swdist.apple.com
// swcdn.apple.com
// updates.cdn-apple.com
// mensura.cdn-apple.com
// osxapps.itunes.apple.com
// aod.itunes.apple.com

// Microsoft:
// cdn-dynmedia-1.microsoft.com
// update.microsoft
// software.download.prss.microsoft.com

// Amazon:
// s0.awsstatic.com
// d1.awsstatic.com
// images-na.ssl-images-amazon.com
// m.media-amazon.com
// player.live-video.net

// Google:
// dl.google.com
