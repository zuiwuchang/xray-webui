"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateRouting = void 0;
const utils_1 = require("./utils");
const rule_1 = require("./strategy/rule");
function generateRouting(opts) {
    var _a, _b, _c, _d, _e, _f;
    if ((0, utils_1.isPort)((_a = opts.environment.port) !== null && _a !== void 0 ? _a : 0)) {
        return;
    }
    const strategy = opts.strategy;
    const userdata = opts === null || opts === void 0 ? void 0 : opts.userdata;
    const rules = [];
    if ((0, utils_1.isPort)((_b = userdata === null || userdata === void 0 ? void 0 : userdata.proxy) === null || _b === void 0 ? void 0 : _b.port)) {
        const tproxy = ((_c = userdata === null || userdata === void 0 ? void 0 : userdata.proxy) === null || _c === void 0 ? void 0 : _c.tproxy) ? true : false;
        rules.push(!tproxy || (0, utils_1.isWindows)() ? {
            type: 'field',
            inboundTag: ['in-proxy'],
            outboundTag: 'out-proxy',
        } : {
            type: 'field',
            inboundTag: ['in-proxy'],
            port: 53,
            outboundTag: 'out-dns',
        });
    }
    if ((0, utils_1.isPort)((_d = userdata === null || userdata === void 0 ? void 0 : userdata.dns) === null || _d === void 0 ? void 0 : _d.port)) {
        rules.push({
            type: 'field',
            inboundTag: ['in-dns'],
            outboundTag: 'out-dns',
        });
    }
    // 攔截域名解析
    rules.push({
        type: 'field',
        ip: [
            // google
            '8.8.8.8',
            // cloudflare
            '1.1.1.1',
        ],
        outboundTag: 'out-proxy',
    }, {
        type: 'field',
        ip: [
            '119.29.29.29',
            '223.5.5.5',
            '127.0.0.1',
            '::1', // ipv6 本機
        ],
        outboundTag: 'out-freedom',
    });
    // 代理訪問
    let proxy = new rule_1.Rule().pushDomain(strategy.proxyDomain).pushIP(strategy.proxyIP);
    // 直接連接
    let direct = new rule_1.Rule().pushDomain(strategy.directDomain).pushIP(strategy.directIP);
    // 阻止訪問
    let block = new rule_1.Rule().pushDomain(strategy.blockDomain).pushIP(strategy.blockIP);
    const routing = (_e = opts.userdata) === null || _e === void 0 ? void 0 : _e.routing;
    if (routing) {
        block.pushDomain(routing.blockDomain).pushIP(routing.blockIP);
        switch (strategy.value) {
            case 5: // 直連優先
            case 6: // 直接連接
                direct.pushDomain(routing.directDomain).pushIP(routing.directIP);
                proxy.pushDomain(routing.proxyDomain).pushIP(routing.proxyIP);
                break;
            default:
                proxy.pushDomain(routing.proxyDomain).pushIP(routing.proxyIP);
                direct.pushDomain(routing.directDomain).pushIP(routing.directIP);
                break;
        }
    }
    pushRules(rules, 'out-proxy', proxy);
    pushRules(rules, 'out-freedom', direct);
    pushRules(rules, 'out-blackhole', block);
    // bt 下載
    if (routing) {
        const bittorrent = (_f = routing.bittorrent) !== null && _f !== void 0 ? _f : '';
        if (bittorrent != '') {
            rules.push({
                type: 'field',
                protocol: ['bittorrent'],
                outboundTag: bittorrent,
            });
        }
    }
    switch (strategy.value) {
        case 5: // 直連優先
            pushStrategyRules(rules, proxy, direct, block, 'out-freedom', [
                'geosite:cn',
            ], [
                'geoip:cn',
                'geoip:private',
            ]);
            pushStrategyRules(rules, proxy, direct, block, 'out-proxy', [
                'geosite:apple',
                'geosite:google',
                'geosite:microsoft',
                'geosite:facebook',
                'geosite:twitter',
                'geosite:telegram',
                'geosite:geolocation-!cn',
                'geosite:tld-!cn',
            ]);
            break;
        case 6: // 直接連接
            break;
        case 3: // 代理公有 ip
            pushStrategyRules(rules, proxy, direct, block, 'out-freedom', undefined, [
                'geoip:private',
            ]);
            break;
        case 2: // 全部代理
            break;
        case 1: // 默認策略
        case 4: // 代理優先
        default:
            pushStrategyRules(rules, proxy, direct, block, 'out-freedom', undefined, [
                'geoip:private',
            ]);
            pushStrategyRules(rules, proxy, direct, block, 'out-proxy', [
                'geosite:apple',
                'geosite:google',
                'geosite:microsoft',
                'geosite:facebook',
                'geosite:twitter',
                'geosite:telegram',
                'geosite:geolocation-!cn',
                'geosite:tld-!cn',
            ]);
            pushStrategyRules(rules, proxy, direct, block, 'out-freedom', [
                'geosite:cn',
            ], [
                'geoip:cn',
            ]);
            break;
    }
    return {
        domainStrategy: 'IPIfNonMatch',
        rules: rules,
    };
}
exports.generateRouting = generateRouting;
function pushRules(rules, tag, rule) {
    if (rule.isValid()) {
        if (rule.domain.length != 0) {
            rules.push({
                type: 'field',
                domain: rule.domain,
                outboundTag: tag,
            });
        }
        if (rule.ip.length != 0) {
            rules.push({
                type: 'field',
                ip: rule.ip,
                outboundTag: tag,
            });
        }
    }
}
function pushStrategyRules(rules, proxy, direct, block, tag, domain, ip) {
    if (domain) {
        pushDomain(rules, proxy, direct, block, tag, domain);
    }
    if (ip) {
        pushIP(rules, proxy, direct, block, tag, ip);
    }
}
function pushDomain(rules, proxy, direct, block, tag, targets) {
    const strs = [];
    for (const s of targets) {
        if (proxy.hasDomain(s) ||
            direct.hasDomain(s) ||
            block.hasDomain(s)) {
            continue;
        }
        strs.push(s);
    }
    if (strs.length > 0) {
        const rule = new rule_1.Rule().pushDomain(strs);
        if (rule.isValid()) {
            rules.push({
                type: 'field',
                domain: rule.domain,
                outboundTag: tag,
            });
        }
    }
}
function pushIP(rules, proxy, direct, block, tag, targets) {
    const strs = [];
    for (const s of targets) {
        if (proxy.hasIP(s) ||
            direct.hasIP(s) ||
            block.hasIP(s)) {
            continue;
        }
        strs.push(s);
    }
    if (strs.length > 0) {
        const rule = new rule_1.Rule().pushIP(strs);
        if (rule.isValid()) {
            rules.push({
                type: 'field',
                ip: rule.ip,
                outboundTag: tag,
            });
        }
    }
}
