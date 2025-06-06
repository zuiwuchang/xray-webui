"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateDNS = void 0;
const rule_1 = require("./strategy/rule");
function generateDNS(opts, ips) {
    var _a, _b, _c;
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
    // 代理訪問
    let proxy = new rule_1.Rule().pushDomain(strategy.proxyDomain);
    // 直接連接
    let direct = new rule_1.Rule().pushDomain(strategy.directDomain);
    // 阻止訪問
    let block = new rule_1.Rule().pushDomain(strategy.blockDomain);
    const routing = (_a = opts.userdata) === null || _a === void 0 ? void 0 : _a.routing;
    const dns = (_c = (_b = opts === null || opts === void 0 ? void 0 : opts.userdata) === null || _b === void 0 ? void 0 : _b.strategy) === null || _c === void 0 ? void 0 : _c.dns;
    const network = dns === null || dns === void 0 ? void 0 : dns.network;
    if (routing) {
        block.pushDomain(routing.blockDomain);
        switch (strategy.value) {
            case 5: // 直連優先
            case 6: // 直接連接
                direct.pushDomain(routing.directDomain);
                proxy.pushDomain(routing.proxyDomain);
                break;
            default:
                proxy.pushDomain(routing.proxyDomain);
                direct.pushDomain(routing.directDomain);
                break;
        }
    }
    if (proxy.isValid()) {
        servers.push(...[
            {
                address: generateServer(network, '8.8.8.8'),
                port: 53,
                domains: proxy.domain,
            },
            {
                address: generateServer(network, '1.1.1.1'),
                port: 53,
                domains: proxy.domain,
            },
        ]);
    }
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
    if (block.isValid()) {
        servers.push(...[
            {
                address: 'localhost',
                port: 53,
                domains: block.domain,
                expectIPs: ['127.0.0.1'],
            },
        ]);
    }
    switch (strategy.value) {
        case 5: // 直連優先
            pushDirect(servers, proxy, direct, block);
            pushProxy(servers, proxy, direct, block, network);
        case 6: // 直接連接
            pushDirectDefault(servers);
            break;
        case 2: // 全部代理
            pushProxyDefult(servers, network);
            break;
        case 1: // 默認策略
        case 4: // 代理優先
            pushProxy(servers, proxy, direct, block, network);
            pushDirect(servers, proxy, direct, block);
        case 3: // 代理公有 ip
        default:
            pushProxyDefult(servers, network);
            break;
    }
    return {
        hosts: hosts,
        servers: servers,
        queryStrategy: queryStrategy(dns === null || dns === void 0 ? void 0 : dns.queryStrategy)
    };
}
exports.generateDNS = generateDNS;
function generateServer(network, address) {
    switch (network) {
        case 'tcp':
            return `tcp://${address}`;
        case 'https':
            return `https://${address}/dns-query`;
    }
    return address;
}
function queryStrategy(queryStrategy) {
    switch (queryStrategy) {
        // case 'ip':
        // case 'UseIP':
        // return 'UseIP'
        case 'v4':
        case 'UseIPv4':
            return 'UseIPv4';
        case 'v6':
        case 'UseIPv6':
            return 'UseIPv6';
    }
    return 'UseIP';
}
function pushProxy(servers, proxy, direct, block, network) {
    const rules = [];
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
            continue;
        }
        rules.push(s);
    }
    if (rules.length > 0) {
        const rule = new rule_1.Rule().pushDomain(rules);
        if (rule.isValid()) {
            servers.push(...[
                {
                    address: generateServer(network, '8.8.8.8'),
                    port: 53,
                    domains: rule.domain,
                },
                {
                    address: generateServer(network, '1.1.1.1'),
                    port: 53,
                    domains: rule.domain,
                },
            ]);
        }
    }
}
function pushDirect(servers, proxy, direct, block) {
    const rules = [];
    for (const s of [
        'geosite:cn',
    ]) {
        if (proxy.hasDomain(s) ||
            direct.hasDomain(s) ||
            block.hasDomain(s)) {
            continue;
        }
        rules.push(s);
    }
    if (rules.length > 0) {
        const rule = new rule_1.Rule().pushDomain(rules);
        if (rule.isValid()) {
            servers.push(...[
                {
                    address: '119.29.29.29',
                    port: 53,
                    domains: rule.domain,
                },
                {
                    address: '223.5.5.5',
                    port: 53,
                    domains: rule.domain,
                },
            ]);
        }
    }
}
function pushProxyDefult(servers, network) {
    // 未匹配域名 使用非西朝 dns
    servers.push(...[
        generateServer(network, '8.8.8.8'),
        generateServer(network, '1.1.1.1'), // cloudflare
    ]);
}
function pushDirectDefault(servers) {
    // 未匹配域名 使用西朝 dns
    servers.push(...[
        '119.29.29.29',
        '223.5.5.5',
        'localhost',
    ]);
}
