"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateDNS = void 0;
const rule_1 = require("./strategy/rule");
function generateDNS(opts, ips) {
    var _a;
    if (opts.environment.port) {
        return undefined;
    }
    const strategy = opts.strategy;
    // 靜態 dns
    const hosts = {};
    for (const values of strategy.host) {
        if (values.length > 1) {
            hosts[values[0]] = values.length == 2 ? values[1] : values.slice(1);
        }
    }
    if (ips) {
        hosts[opts.fileds.address] = ips.length == 1 ? ips[0] : ips;
    }
    const servers = [];
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
        case 3: // 代理公有 ip
            proxy = new rule_1.Rule().pushDomain(strategy.proxyDomain);
            direct = new rule_1.Rule().pushDomain(strategy.directDomain);
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
                .pushDomain(strategy.proxyDomain);
            direct = new rule_1.Rule()
                .pushDomain([
                'geosite:cn',
            ])
                .pushDomain(strategy.directDomain);
            break;
    }
    const routing = (_a = opts.userdata) === null || _a === void 0 ? void 0 : _a.routing;
    if (routing) {
        proxy.pushDomain(routing.proxyDomain);
        proxy.pushIP(routing.proxyIP);
        direct.pushDomain(routing.directDomain);
        direct.pushIP(routing.directIP);
    }
    if (usual) { // 優先直接連接
        // 解析 西朝 域名
        if (direct.isValid()) {
            servers.push(...[
                {
                    address: '119.29.29.29',
                    port: 53,
                    domains: direct.domain,
                },
                {
                    address: '223.5.5.5',
                    port: 53,
                    domains: direct.domain,
                },
            ]);
        }
        // 解析 非西朝 域名
        if (proxy.isValid()) {
            servers.push(...[
                {
                    address: '8.8.8.8',
                    port: 53,
                    domains: proxy.domain,
                },
                {
                    address: '1.1.1.1',
                    port: 53,
                    domains: proxy.domain,
                },
            ]);
        }
        // 未匹配的 使用西朝 dns
        servers.push(...[
            '119.29.29.29',
            '223.5.5.5',
            'localhost',
        ]);
    }
    else {
        // 解析 非西朝 域名
        if (proxy.isValid()) {
            servers.push(...[
                {
                    address: '8.8.8.8',
                    port: 53,
                    domains: proxy.domain,
                },
                {
                    address: '1.1.1.1',
                    port: 53,
                    domains: proxy.domain,
                },
            ]);
        }
        // 解析 西朝 域名
        if (direct.isValid()) {
            servers.push(...[
                {
                    address: '119.29.29.29',
                    port: 53,
                    domains: direct.domain,
                },
                {
                    address: '223.5.5.5',
                    port: 53,
                    domains: direct.domain,
                },
            ]);
        }
        // 未匹配的 使用非西朝 dns
        servers.push(...[
            '8.8.8.8',
            '1.1.1.1',
            'https+local://doh.dns.sb/dns-query'
        ]);
    }
    return {
        hosts: hosts,
        servers: servers,
    };
}
exports.generateDNS = generateDNS;
