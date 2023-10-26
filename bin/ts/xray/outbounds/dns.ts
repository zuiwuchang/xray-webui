import { Outbound } from "./outbound";
/**
 * {@link https://xtls.github.io/config/outbounds/dns.html}
 */
export interface DNSSettings {
    /**
     * 修改 dns 流量傳輸層協議，如果不指定則安裝原本協議傳輸
     */
    network?: 'tcp' | 'udp'

    /**
     * dns 服務器地址，如果不指定則使用原本地址
     */
    address?: string
    /**
     * dns 服務器端口，如果不指定則使用原本端口
     */
    port?: number
    /**
     * 對於非 IP 查詢(A 和 AAAA 之外的查詢)如何處理
     * * 'drop' 丟棄
     * * 'skip' 不由內置 DNS 服務處理，將轉發給原本目標
     * 
     * @default 'drop'
     */
    nonIPQuery?: 'drop' | 'skip'
}
/**
 * DNS 用於攔截 dns 流量(UDP or TCP)
 * 
 * @remarks
 * 在處理 DNS 查詢時，此出站協定會將 IP 查詢（即 A 和 AAAA）轉送給內建的 DNS 伺服器。
 * 其它類型的查詢流量將會轉送至它們原本的目標位址。
 */
export interface DNS extends Outbound<DNSSettings> {
    protocol: 'dns'
}