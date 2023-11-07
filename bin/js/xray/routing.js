"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateRouting = void 0;
const utils_1 = require("./utils");
const rule_1 = require("./strategy/rule");
function generateRouting(opts) {
    var _a, _b, _c, _d, _e;
    if ((0, utils_1.isPort)((_a = opts.environment.port) !== null && _a !== void 0 ? _a : 0)) {
        return;
    }
    const strategy = opts.strategy;
    let usual = false;
    // 代理訪問
    let proxy;
    // 直接連接
    let direct;
    switch (strategy.value) {
        case 6: // 直接連接
            usual = true;
        case 1:
        case 2: // 全部代理
            proxy = new rule_1.Rule().pushDomain(strategy.proxyDomain)
                .pushIP(strategy.proxyIP);
            direct = new rule_1.Rule().pushDomain(strategy.directDomain)
                .pushIP(strategy.directIP);
            break;
        case 3: // 代理公有 ip
            proxy = new rule_1.Rule().pushDomain(strategy.proxyDomain)
                .pushIP(strategy.proxyIP);
            direct = new rule_1.Rule()
                .pushIP([
                'geoip:private',
            ]).pushDomain(strategy.directDomain)
                .pushIP(strategy.directIP);
            break;
        case 5: // 直連優先
            usual = true;
        case 4: // 代理優先
            // 添加默認 代理
            proxy = new rule_1.Rule()
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
                .pushIP(strategy.proxyIP);
            direct = new rule_1.Rule()
                .pushDomain([
                'geosite:cn',
            ])
                .pushIP([
                'geoip:cn',
                'geoip:private',
            ])
                .pushDomain(strategy.directDomain)
                .pushIP(strategy.directIP);
            break;
    }
    const rules = [
        // 攔截域名解析
        ((_c = (_b = opts.userdata) === null || _b === void 0 ? void 0 : _b.proxy) === null || _c === void 0 ? void 0 : _c.tproxy) ? {
            type: 'field',
            inboundTag: ['in-proxy'],
            port: 53,
            outboundTag: 'out-dns'
        } : {
            type: 'field',
            inboundTag: ['in-proxy'],
            outboundTag: 'out-proxy'
        },
        {
            type: 'field',
            ip: ['8.8.8.8', '1.1.1.1'],
            outboundTag: 'out-proxy'
        },
    ];
    // 阻止訪問
    const block = new rule_1.Rule().pushDomain(strategy.blockDomain).pushIP(strategy.blockIP);
    const routing = (_d = opts.userdata) === null || _d === void 0 ? void 0 : _d.routing;
    if (routing) {
        const bittorrent = (_e = routing.bittorrent) !== null && _e !== void 0 ? _e : '';
        if (bittorrent != '') {
            rules.push({
                type: 'field',
                protocol: ['bittorrent'],
                outboundTag: bittorrent,
            });
        }
        proxy.pushDomain(routing.proxyDomain);
        proxy.pushIP(routing.proxyIP);
        direct.pushDomain(routing.directDomain);
        direct.pushIP(routing.directIP);
        block.pushDomain(routing.blockDomain);
        block.pushIP(routing.blockIP);
    }
    const sort = usual ? [block, direct, proxy] : [block, proxy, direct];
    for (const o of sort) {
        const tag = o == block ? 'out-blackhole' : (o == direct ? 'out-freedom' : 'out-proxy');
        if (o.domain.length != 0) {
            rules.push({
                type: 'field',
                domain: o.domain,
                outboundTag: tag,
            });
        }
        if (o.ip.length != 0) {
            rules.push({
                type: 'field',
                ip: direct.ip,
                outboundTag: tag,
            });
        }
    }
    return {
        domainStrategy: 'IPIfNonMatch',
        rules: rules,
    };
}
exports.generateRouting = generateRouting;
