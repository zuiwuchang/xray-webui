import { ConfigureOptions } from "xray/webui"
import { Userdata } from "./userdata"
import { isPort } from "./utils"
import { Rule as StrategyRule } from "./strategy/rule";

/**
 * {@link https://xtls.github.io/config/routing.html}
 */
export interface Routing {
    /**
     * 域名解析策略
     * * 'AsIs' 值使用域名進行路由選擇
     * * 'IPIfNonMatch' 當域名沒有匹配規則時，將域名解析到 IP，之後使用 IP 進行路由選擇
     * * 'IPOnDemand' 當配對時碰到任何基於 IP 的規則，將網域名稱立即解析為 IP 進行比對
     * @default 'AsIs'
     */
    domainStrategy?: 'AsIs' | 'IPIfNonMatch' | 'IPOnDemand'
    /**
     * 使用的匹配算法
     * @default 'hybrid'
     */
    domainMatcher?: 'hybrid' | 'linear'
    /**
     * 規則
     */
    rules?: Array<Rule>
    /**
     * 負載均衡
     */
    balancers?: Array<{ tag: string, selector: Array<string> }>
}
/**
 * {@link https://xtls.github.io/config/routing.html#ruleobject}
 */
export interface Rule {
    /**
     * 匹配算法
     */
    domainMatcher?: 'hybrid' | 'linear'
    /**
     * 目前固定爲 field
     */
    type: 'field'
    /**
     * 指定要匹配的域名
     */
    domain?: Array<string>
    /**
     * 指定要匹配的 ip
     */
    ip?: Array<string>
    /**
     * 要匹配的目標端口
     */
    port?: number | string
    /**
     * 要匹配的源端口
     */
    sourcePort?: number | string
    /**
     * 要匹配的 ip 協議
     */
    network?: 'tcp' | 'udp' | 'tcp,udp'
    /**
     * 要匹配的源 ip
     */
    source?: Array<string>
    /**
     * 要匹配的用戶
     */
    user?: Array<string>
    /**
     * 要匹配的入棧 tag
     */
    inboundTag?: Array<string>
    /**
     * 要匹配的協議
     */
    protocol?: Array<string>
    attrs?: Record<string, string>
    /**
     * 出棧路由
     */
    outboundTag?: string
    /**
     * 出棧均衡器
     */
    balancerTag?: string
}
export function generateRouting(opts: ConfigureOptions<Userdata>): Routing | undefined {
    if (isPort(opts.environment.port ?? 0)) {
        return
    }
    const strategy = opts.strategy
    let usual = false
    // 代理訪問
    let proxy: StrategyRule
    // 直接連接
    let direct: StrategyRule
    switch (strategy.value) {
        case 6: // 直接連接
            usual = true
        case 1:
        case 2: // 全部代理
            proxy = new StrategyRule().pushDomain(strategy.proxyDomain)
                .pushIP(strategy.proxyIP)
            direct = new StrategyRule().pushDomain(strategy.directDomain)
                .pushIP(strategy.directIP)
            break
        case 3: // 代理公有 ip
            proxy = new StrategyRule().pushDomain(strategy.proxyDomain)
                .pushIP(strategy.proxyIP)
            direct = new StrategyRule()
                .pushIP([
                    'geoip:private',
                ]).pushDomain(strategy.directDomain)
                .pushIP(strategy.directIP)
            break
        case 5: // 直連優先
            usual = true
        case 4: // 代理優先
            // 添加默認 代理
            proxy = new StrategyRule()
                .pushDomain([
                    'geosite:apple',
                    'geosite:google',
                    'geosite:microsoft',
                    'geosite:facebook',
                    'geosite:twitter',
                    'geosite:telegram',
                    'geosite:geolocation-!cn',
                    'tld-!cn',
                ])
                .pushDomain(strategy.proxyDomain)
                .pushIP(strategy.proxyIP)
            direct = new StrategyRule()
                .pushDomain([
                    'geosite:cn',
                ])
                .pushIP([
                    'geoip:cn',
                    'geoip:private',
                ])
                .pushDomain(strategy.directDomain)
                .pushIP(strategy.directIP)
            break
    }
    const rules: Array<Rule> = [
        // 攔截域名解析
        {
            type: 'field',
            inboundTag: ['in-proxy'],
            port: 53,
            outboundTag: 'out-dns'
        },
        {
            type: 'field',
            ip: ['8.8.8.8', '1.1.1.1'],
            outboundTag: 'out-proxy'
        },
    ]
    // 阻止訪問
    const block = new StrategyRule().pushDomain(strategy.blockDomain).pushIP(strategy.blockIP)
    const routing = opts.userdata?.routing
    if (routing) {
        const bittorrent = routing.bittorrent ?? ''
        if (bittorrent != '') {
            rules.push({
                type: 'field',
                protocol: ['bittorrent'],
                outboundTag: bittorrent,
            })
        }
        proxy.pushDomain(routing.proxyDomain!)
        proxy.pushIP(routing.proxyIP!)
        direct.pushDomain(routing.directDomain!)
        direct.pushIP(routing.directIP!)
        block.pushDomain(routing.blockDomain!)
        block.pushIP(routing.blockIP!)
    }
    const sort = usual ? [block, direct, proxy] : [block, proxy, direct]
    for (const o of sort) {
        const tag = o == block ? 'out-blackhole' : (o == direct ? 'out-freedom' : 'out-proxy')
        if (o.domain.length != 0) {
            rules.push({
                type: 'field',
                domain: o.domain,
                outboundTag: tag,
            })
        }
        if (o.ip.length != 0) {
            rules.push({
                type: 'field',
                ip: direct.ip,
                outboundTag: tag,
            })
        }
    }
    return {
        domainStrategy: 'IPIfNonMatch',
        rules: rules,
    }
} 