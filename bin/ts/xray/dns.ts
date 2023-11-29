import { ConfigureOptions } from "xray/webui"
import { Rule } from "./strategy/rule"
import { Userdata } from "./userdata"

/**
 * {@link https://xtls.github.io/config/dns.html}
 */
export interface DNS {
    /**
     * 靜態 ip 列表，key 是域名， value 是域名映射到的 ip 地址
     */
    hosts?: Record<string, string | Array<string>>

    /**
     * 後端的 dns 服務器列表
     */
    servers?: Array<string | Server>

    /**
     * 用於 DNS 查詢時通知伺服器以指定 IP 位置。 不能是私有地址
     */
    clientIp?: string

    /**
     * * 'UseIPv4' 只查詢 A 記錄
     * * 'UseIPv6' 只查詢 AAAA 記錄
     * * 'UseIPv6' 只查詢 A 或 AAAA 記錄
     * @default 'UseIP'
     */
    queryStrategy?: 'UseIP' | 'UseIPv4' | 'UseIPv6'
    /**
     * 如果爲 true 則禁用緩存
     * @default false
     */
    disableCache?: boolean
    /**
     * 如果爲 true 則禁用 DNS 的 fallback 查詢
     * @default false
     */
    disableFallback?: boolean
    /**
     * 如果爲 true 當 DNS 伺服器的優先匹配網域名稱清單命中時，停用 fallback 查詢
     * @default false
     */
    disableFallbackIfMatch?: boolean
    /**
     * 由內建 DNS 發出的查詢流量，除 localhost、fakedns、TCPL、DOHL 和 DOQL 模式外，都可以用此識別碼在路由使用 inboundTag 進行匹配
     */
    tag?: string
}
/**
 * {@link https://xtls.github.io/config/dns.html#serverobject}
 */
export interface Server {
    /**
     * dns 訪問地址，當爲 'localhost' 值表示使用本機預設的 dns 服務
     */
    address: string
    /**
     * dns 服務器端口
     * @default 53
     */
    port?: number
    /**
     * 一組域名列表，匹配的域名將優先使用此服務器進行解析
     */
    domains?: Array<string>
    /**
     * 一個 IP 範圍列表，格式和 路由配置 中相同。
     * 當配置此項目時，Xray DNS 會對傳回的 IP 的進行校驗，只會傳回包含 expectIPs 清單中的位址。
     * 如果未配置此項，會原樣傳回 IP 位址
     */
    expectIPs?: Array<string>
    /**
     * 在進行 DNS fallback 查詢時將跳過此伺服器
     * @default false
     */
    skipFallback?: boolean
    /**
     * 用於 DNS 查詢時通知伺服器以指定 IP 位置。 不能是私有地址
     */
    clientIp?: string
}

export function generateDNS(opts: ConfigureOptions<Userdata>, ips?: Array<string>): DNS | undefined {
    if (opts.environment.port) {
        return undefined
    }
    const strategy = opts.strategy
    // 靜態 dns
    const hosts: Record<string, string | Array<string>> = {}
    for (const values of strategy.host) {
        if (values.length > 1) {
            hosts[values[0]] = values.length == 2 ? values[1] : values.slice(1)
        }
    }
    if (ips) {
        hosts[opts.fileds.address] = ips.length == 1 ? ips[0] : ips
    }
    const servers: Array<Server | string> = []
    // 代理訪問
    let proxy = new Rule().pushDomain(strategy.proxyDomain)
    // 直接連接
    let direct = new Rule().pushDomain(strategy.directDomain)
    // 阻止訪問
    let block = new Rule().pushDomain(strategy.blockDomain)
    const routing = opts.userdata?.routing

    if (routing) {
        proxy.pushDomain(routing.proxyDomain!)
        direct.pushDomain(routing.directDomain!)
        block.pushDomain(routing.blockDomain!)
    }
    if (proxy.isValid()) {
        servers.push(...[
            {
                address: '8.8.8.8', // google
                port: 53,
                domains: proxy.domain,
            },
            {
                address: '1.1.1.1', // cloudflare
                port: 53,
                domains: proxy.domain,
            },
        ])
    }
    if (direct.isValid()) {
        servers.push(...[
            {
                address: '119.29.29.29', // 騰訊
                port: 53,
                domains: direct.domain,
            },
            {
                address: '223.5.5.5', // 阿里
                port: 53,
                domains: direct.domain,
            },
        ])
    }
    if (block.isValid()) {
        servers.push(...[
            {
                address: 'localhost',
                port: 53,
                domains: block.domain,
                expectIPs: ['127.0.0.1'],
            },
        ])
    }
    switch (strategy.value) {
        case 5: // 直連優先
            pushDirect(servers, proxy, direct, block)
            pushProxy(servers, proxy, direct, block)
        case 6: // 直接連接
            pushDirectDefault(servers)
            break
        case 2: // 全部代理
            pushProxyDefult(servers)
            break
        case 1: // 默認策略
        case 4: // 代理優先
            pushProxy(servers, proxy, direct, block)
            pushDirect(servers, proxy, direct, block)
        case 3: // 代理公有 ip
        default:
            pushProxyDefult(servers)
            break
    }
    return {
        hosts: hosts,
        servers: servers,
    }
}
function pushProxy(servers: Array<string | Server>, proxy: Rule, direct: Rule, block: Rule) {
    const rules: Array<string> = []
    for (const s of [
        'geosite:apple',
        'geosite:google',
        'geosite:microsoft',
        'geosite:facebook',
        'geosite:twitter',
        'geosite:telegram',
        'geosite:geolocation-!cn',
        'geosite:tld-!cn',
    ]) {
        if (proxy.hasDomain(s) ||
            direct.hasDomain(s) ||
            block.hasDomain(s)) {
            continue
        }
        rules.push(s)
    }
    if (rules.length > 0) {
        const rule = new Rule().pushDomain(rules)
        if (rule.isValid()) {
            servers.push(...[
                {
                    address: '8.8.8.8', // google
                    port: 53,
                    domains: rule.domain,
                },
                {
                    address: '1.1.1.1', // cloudflare
                    port: 53,
                    domains: rule.domain,
                },
            ])
        }
    }
}
function pushDirect(servers: Array<string | Server>, proxy: Rule, direct: Rule, block: Rule) {
    const rules: Array<string> = []
    for (const s of [
        'geosite:cn',
    ]) {
        if (proxy.hasDomain(s) ||
            direct.hasDomain(s) ||
            block.hasDomain(s)) {
            continue
        }
        rules.push(s)
    }
    if (rules.length > 0) {
        const rule = new Rule().pushDomain(rules)
        if (rule.isValid()) {
            servers.push(...[
                {
                    address: '119.29.29.29', // 騰訊
                    port: 53,
                    domains: rule.domain,
                },
                {
                    address: '223.5.5.5', // 阿里
                    port: 53,
                    domains: rule.domain,
                },
            ])
        }
    }
}
function pushProxyDefult(servers: Array<string | Server>) {
    // 未匹配域名 使用非西朝 dns
    servers.push(...[
        '8.8.8.8', // google
        '1.1.1.1', // cloudflare
    ])
}
function pushDirectDefault(servers: Array<string | Server>) {
    // 未匹配域名 使用西朝 dns
    servers.push(...[
        '119.29.29.29', // 騰訊
        '223.5.5.5', // 阿里
        'localhost',
    ])
}