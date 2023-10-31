"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateOutbounds = void 0;
const utils_1 = require("./utils");
function generateOutbounds(opts) {
    var _a, _b, _c, _d, _e, _f;
    const isport = (0, utils_1.isPort)((_a = opts.environment.port) !== null && _a !== void 0 ? _a : 0);
    if (isport) {
        return [generateOutbound(opts)];
    }
    const outbound = generateOutbound(opts);
    const isTProxy = ((_c = (_b = opts.userdata) === null || _b === void 0 ? void 0 : _b.proxy) === null || _c === void 0 ? void 0 : _c.tproxy) && (0, utils_1.isLinux)();
    const sockopt = isTProxy ? {
        mark: (_f = (_e = (_d = opts.userdata) === null || _d === void 0 ? void 0 : _d.proxy) === null || _e === void 0 ? void 0 : _e.mark) !== null && _f !== void 0 ? _f : 99,
    } : undefined;
    const freedom = {
        tag: 'out-freedom',
        protocol: 'freedom',
        streamSettings: {
            sockopt: sockopt,
        },
    };
    const blackhole = {
        tag: 'out-blackhole',
        protocol: 'blackhole',
        settings: {},
    };
    const dns = {
        tag: 'out-dns',
        protocol: 'dns',
        settings: {
            address: '8.8.8.8',
            port: 53,
        },
        streamSettings: {
            sockopt: sockopt,
        },
    };
    return opts.strategy.value < 5 ? [outbound, freedom, blackhole, dns] : [freedom, outbound, blackhole, dns];
}
exports.generateOutbounds = generateOutbounds;
function generateOutbound(opts) {
    switch (opts.environment.scheme) {
        case 'vless':
            return generateVLess(opts);
        case 'vmess':
            return generateVMess(opts);
        case 'trojan':
            return generateTrojan(opts);
        case 'ss':
            return generateShadowsocks(opts);
        case 'socks':
            return generateSocks(opts);
        default:
            throw new Error(`unknow scheme: ${opts.environment.scheme}`);
    }
}
function generateSocks(opts) {
    var _a, _b;
    const fileds = opts.fileds;
    const username = (_a = fileds.username) !== null && _a !== void 0 ? _a : '';
    const password = (_b = fileds.password) !== null && _b !== void 0 ? _b : '';
    return {
        tag: 'out-proxy',
        protocol: 'socks',
        settings: {
            servers: [
                {
                    address: fileds.address,
                    port: (0, utils_1.getPort)(fileds.port),
                    users: username != '' || password != '' ? [
                        {
                            user: username,
                            pass: password,
                        }
                    ] : undefined,
                },
            ],
        },
        streamSettings: new OutboundStream(opts).generate(),
    };
}
function generateShadowsocks(opts) {
    const fileds = opts.fileds;
    return {
        tag: 'out-proxy',
        protocol: 'shadowsocks',
        settings: {
            servers: [
                {
                    address: fileds.address,
                    port: (0, utils_1.getPort)(fileds.port),
                    method: fileds.method,
                    password: fileds.password,
                    level: 0,
                },
            ],
        },
        streamSettings: new OutboundStream(opts).generate(),
    };
}
function generateTrojan(opts) {
    const fileds = opts.fileds;
    const flow = fileds.flow;
    return {
        tag: 'out-proxy',
        protocol: 'trojan',
        settings: {
            servers: [
                {
                    address: fileds.address,
                    port: (0, utils_1.getPort)(fileds.port),
                    password: fileds.userID,
                    flow: flow,
                    level: 0
                },
            ],
        },
        streamSettings: new OutboundStream(opts).generate(),
    };
}
function generateVMess(opts) {
    var _a;
    const fileds = opts.fileds;
    let encryption = (_a = fileds.encryption) !== null && _a !== void 0 ? _a : 'auto';
    if (encryption == '') {
        encryption = 'auto';
    }
    return {
        tag: 'out-proxy',
        protocol: 'vmess',
        settings: {
            vnext: [
                {
                    address: fileds.address,
                    port: (0, utils_1.getPort)(fileds.port),
                    users: [
                        {
                            id: fileds.userID,
                            security: encryption,
                            level: (0, utils_1.getUint)(fileds.userLevel, 0),
                            alterId: (0, utils_1.getUint)(fileds.alterID, 0),
                        },
                    ],
                },
            ],
        },
        streamSettings: new OutboundStream(opts).generate(),
    };
}
function generateVLess(opts) {
    var _a;
    const fileds = opts.fileds;
    return {
        tag: 'out-proxy',
        protocol: 'vless',
        settings: {
            vnext: [
                {
                    address: fileds.address,
                    port: (0, utils_1.getPort)(fileds.port),
                    users: [
                        {
                            id: fileds.userID,
                            encryption: 'none',
                            flow: ((_a = fileds.flow) !== null && _a !== void 0 ? _a : ''),
                            level: (0, utils_1.getUint)(fileds.userLevel, 0),
                        },
                    ],
                },
            ],
        },
        streamSettings: new OutboundStream(opts).generate(),
    };
}
class OutboundStream {
    constructor(opts) {
        this.opts = opts;
    }
    generate() {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
        const fileds = this.opts.fileds;
        const result = {};
        const security = (_a = fileds.security) !== null && _a !== void 0 ? _a : '';
        switch (security) {
            case '':
                break;
            case 'tls':
                result.security = security;
                result.tlsSettings = {
                    serverName: this._serverName(),
                    alpn: this._alpn(),
                    fingerprint: this._fingerprint(),
                };
                break;
            case 'xtls':
                result.security = 'xtls';
                result.xtlsSettings = {
                    serverName: this._serverName(),
                    alpn: this._alpn(),
                    fingerprint: this._fingerprint(),
                };
                break;
            case 'reality':
                result.security = security;
                result.realitySettings = {
                    serverName: this._serverName(),
                    fingerprint: (_b = this._fingerprint()) !== null && _b !== void 0 ? _b : 'random',
                    publicKey: (_c = fileds.publicKey) !== null && _c !== void 0 ? _c : '',
                    shortID: (_d = fileds.shortID) !== null && _d !== void 0 ? _d : '',
                    spiderX: (_e = fileds.spiderX) !== null && _e !== void 0 ? _e : '',
                };
                break;
            default:
                throw new Error(`stream not implemented security: ${security}`);
        }
        const protocol = (_f = fileds.protocol) !== null && _f !== void 0 ? _f : '';
        switch (protocol) {
            case '':
            case 'tcp':
                result.network = 'tcp';
                result.tcpSettings = {
                    header: {
                        type: 'none',
                    }
                };
                break;
            case 'kcp':
                result.network = 'kcp';
                result.kcpSettings = {
                    congestion: true,
                    header: {
                        type: 'wechat-video',
                    }
                };
                break;
            case 'ws':
                result.network = 'ws';
                result.wsSettings = {
                    path: this._path(),
                    headers: {
                        Host: this._serverName(),
                    },
                };
                break;
            case 'http':
                result.network = 'http';
                result.httpSettings = {
                    method: 'PUT',
                    host: [this._serverName()],
                    read_idle_timeout: 40,
                    path: this._path(),
                };
                break;
            // case 'domainsocket':
            //     break
            case 'quic':
                result.network = 'quic';
                result.quicSettings = {
                    header: {
                        type: 'wechat-video',
                    }
                };
                break;
            case 'grpc':
                result.network = 'grpc';
                result.grpcSettings = {
                    serviceName: this._serverName(),
                    idle_timeout: 40,
                };
                break;
            default:
                throw new Error(`stream not implemented protocol: ${protocol}`);
        }
        const opts = this.opts;
        if (((_h = (_g = opts.userdata) === null || _g === void 0 ? void 0 : _g.proxy) === null || _h === void 0 ? void 0 : _h.tproxy) && (0, utils_1.isLinux)() && !(0, utils_1.isPort)(opts.environment.port)) {
            result.sockopt = {
                mark: (_l = (_k = (_j = opts === null || opts === void 0 ? void 0 : opts.userdata) === null || _j === void 0 ? void 0 : _j.proxy) === null || _k === void 0 ? void 0 : _k.mark) !== null && _l !== void 0 ? _l : 99,
            };
        }
        return result;
    }
    _path() {
        var _a;
        const fileds = this.opts.fileds;
        const val = (_a = fileds.path) !== null && _a !== void 0 ? _a : '';
        if (val != '') {
            return val;
        }
        return '/';
    }
    _serverName() {
        var _a;
        const fileds = this.opts.fileds;
        const val = (_a = fileds.host) !== null && _a !== void 0 ? _a : '';
        if (val != '') {
            return val;
        }
        return fileds.address;
    }
    _alpn() {
        var _a;
        const fileds = this.opts.fileds;
        const val = (_a = fileds.alpn) !== null && _a !== void 0 ? _a : '';
        if (val != '') {
            return val.split(',');
        }
        return ["h2", "http/1.1"];
    }
    _fingerprint() {
        var _a;
        const fileds = this.opts.fileds;
        const val = (_a = fileds.fingerprint) !== null && _a !== void 0 ? _a : '';
        if (val != '') {
            return val;
        }
        return 'firefox';
    }
}
