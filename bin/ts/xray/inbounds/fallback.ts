/**
 * {@link https://xtls.github.io/config/features/fallback.html#fallbackobject}
 */
export interface Fallback {
    /**
     * 嘗試匹配 TLS SNI(Server Name Indication)，空字符串表示任意
     * @default '''
     */
    name?: string
    /**
     * 嘗試匹配 TLS ALPN ，空字符串表示任意
     * @default '''
     */
    alpn?: string
    /**
     * 嘗試匹配首包 HTTP PATH，空字符串表示任意，非空則必須以 / 開頭，不支援 h2c
     * @default '''
     */
    path?: string
    /**
     * 回落流量去向，如果是字符串支持兩種格式
     * * 'addr:port' golang net.Dial 形式，如果添域名不會結果內置 dns 直接調用 net.Dial
     * * Unix domain socket 例如 '/dev/shm/domain.socket'
     */
    dest: number | string
    /**
     * 發送  PROXY protocol，專用於傳遞請求的真實來源 IP 和連接埠
     * * 0 表示不發送
     * @default 0
     */
    xver?: 0 | 1 | 2
}