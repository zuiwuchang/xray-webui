import { ConfigureOptions } from "xray/webui"
import { Userdata } from "./userdata"
import { isPort, isWindows } from "./utils"
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
    const userdata = opts?.userdata

    const rules: Array<Rule> = []
    if (isPort(userdata?.proxy?.port)) {
        const tproxy = userdata?.proxy?.tproxy ? true : false
        rules.push(!tproxy || isWindows() ? {
            type: 'field',
            inboundTag: ['in-proxy'],
            outboundTag: 'out-proxy',
        } : {
            type: 'field',
            inboundTag: ['in-proxy'],
            port: 53,
            outboundTag: 'out-dns',
        })
    }
    if (isPort(userdata?.dns?.port)) {
        rules.push({
            type: 'field',
            inboundTag: ['in-dns'],
            outboundTag: 'out-dns',
        })
    }
    // 攔截域名解析
    rules.push(
        {
            type: 'field',
            ip: [
                // google
                '8.8.8.8',
                // cloudflare
                '1.1.1.1',
            ],
            outboundTag: 'out-proxy',
        },
        {
            type: 'field',
            ip: [
                '119.29.29.29', // 騰訊
                '223.5.5.5', // 阿里
                '127.0.0.1', // 本機
                '::1', // ipv6 本機
            ],
            outboundTag: 'out-freedom',
        },
    )
    // 代理訪問
    let proxy = new StrategyRule().pushDomain(strategy.proxyDomain).pushIP(strategy.proxyIP)
    // 直接連接
    let direct = new StrategyRule().pushDomain(strategy.directDomain).pushIP(strategy.directIP)
    // 阻止訪問
    let block = new StrategyRule().pushDomain(strategy.blockDomain).pushIP(strategy.blockIP)
    const routing = opts.userdata?.routing
    if (routing) {
        block.pushDomain(routing.blockDomain!).pushIP(routing.blockIP!)
        switch (strategy.value) {
            case 5: // 直連優先
            case 6: // 直接連接
                direct.pushDomain(routing.directDomain!).pushIP(routing.directIP!)
                proxy.pushDomain(routing.proxyDomain!).pushIP(routing.proxyIP!)
                break
            default:
                proxy.pushDomain(routing.proxyDomain!).pushIP(routing.proxyIP!)
                direct.pushDomain(routing.directDomain!).pushIP(routing.directIP!)
                break
        }
    }
    pushRules(rules, 'out-proxy', proxy)
    pushRules(rules, 'out-freedom', direct)
    pushRules(rules, 'out-blackhole', block)
    // bt 下載
    if (routing) {
        const bittorrent = routing.bittorrent ?? ''
        if (bittorrent != '') {
            rules.push({
                type: 'field',
                protocol: ['bittorrent'],
                outboundTag: bittorrent,
            })
        }
    }
    switch (strategy.value) {
        case 5: // 直連優先
            pushStrategyRules(rules, proxy, direct, block,
                'out-freedom',
                [
                    'geosite:cn',
                ],
                [
                    'geoip:cn',
                    'geoip:private',
                ],
            )
            pushStrategyRules(rules, proxy, direct, block,
                'out-proxy',
                [
                    'geosite:apple',
                    'geosite:google',
                    'geosite:microsoft',
                    'geosite:facebook',
                    'geosite:twitter',
                    'geosite:telegram',
                    'geosite:geolocation-!cn',
                    'geosite:tld-!cn',
                ],
            )
            break
        case 6: // 直接連接
            break
        case 3: // 代理公有 ip
            pushStrategyRules(rules, proxy, direct, block,
                'out-freedom',
                undefined,
                [
                    'geoip:private',
                ],
            )
            break
        case 2: // 全部代理
            break
        case 1: // 默認策略
        case 4: // 代理優先
        default:
            pushStrategyRules(rules, proxy, direct, block,
                'out-freedom',
                undefined,
                [
                    'geoip:private',
                ],
            )
            pushStrategyRules(rules, proxy, direct, block,
                'out-proxy',
                [
                    'geosite:apple',
                    'geosite:google',
                    'geosite:microsoft',
                    'geosite:facebook',
                    'geosite:twitter',
                    'geosite:telegram',
                    'geosite:geolocation-!cn',
                    'geosite:tld-!cn',
                ],
            )
            pushStrategyRules(rules, proxy, direct, block,
                'out-freedom',
                [
                    'geosite:cn',
                ],
                [
                    'geoip:cn',
                ],
            )
            break
    }
    return {
        // domainStrategy: 'IPIfNonMatch',
        domainStrategy:'AsIs',
        rules: rules,
    }
}
function pushRules(rules: Array<Rule>, tag: string, rule: StrategyRule) {
    if (rule.isValid()) {
        if (rule.domain.length != 0) {
            rules.push({
                type: 'field',
                domain: rule.domain,
                outboundTag: tag,
            })
        }
        if (rule.ip.length != 0) {
            rules.push({
                type: 'field',
                ip: rule.ip,
                outboundTag: tag,
            })
        }
    }
}

function pushStrategyRules(rules: Array<Rule>, proxy: StrategyRule, direct: StrategyRule, block: StrategyRule,
    tag: string,
    domain?: Array<string>,
    ip?: Array<string>,
) {
    if (domain) {
        pushDomain(rules, proxy, direct, block, tag, domain)
    }
    if (ip) {
        pushIP(rules, proxy, direct, block, tag, ip)
    }
}
function pushDomain(rules: Array<Rule>,
    proxy: StrategyRule, direct: StrategyRule, block: StrategyRule,
    tag: string, targets: Array<string>) {
    const strs: Array<string> = []
    for (const s of targets) {
        if (proxy.hasDomain(s) ||
            direct.hasDomain(s) ||
            block.hasDomain(s)) {
            continue
        }
        strs.push(s)
    }
    if (strs.length > 0) {
        const rule = new StrategyRule().pushDomain(strs)
        if (rule.isValid()) {
            rules.push({
                type: 'field',
                domain: rule.domain,
                outboundTag: tag,
            })
        }
    }
}
function pushIP(rules: Array<Rule>,
    proxy: StrategyRule, direct: StrategyRule, block: StrategyRule,
    tag: string, targets: Array<string>) {
    const strs: Array<string> = []
    for (const s of targets) {
        if (proxy.hasIP(s) ||
            direct.hasIP(s) ||
            block.hasIP(s)) {
            continue
        }
        strs.push(s)
    }
    if (strs.length > 0) {
        const rule = new StrategyRule().pushIP(strs)
        if (rule.isValid()) {
            rules.push({
                type: 'field',
                ip: rule.ip,
                outboundTag: tag,
            })
        }
    }
}