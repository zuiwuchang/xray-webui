"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateOutbounds = void 0;
const utils_1 = require("./utils");
function generateOutbounds(opts, ip) {
    var _a, _b, _c;
    const isport = (0, utils_1.isPort)(opts.environment.port);
    if (isport) {
        return [generateOutbound(opts)];
    }
    const outbound = generateOutbound(opts, ip);
    const mark = (_c = (_b = (_a = opts.userdata) === null || _a === void 0 ? void 0 : _a.proxy) === null || _b === void 0 ? void 0 : _b.mark) !== null && _c !== void 0 ? _c : 99;
    const freedom = {
        tag: 'out-freedom',
        protocol: 'freedom',
        streamSettings: {
            sockopt: {
                mark: mark,
            },
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
            sockopt: {
                mark: mark,
            },
        },
    };
    return opts.strategy.value < 5 ? [outbound, freedom, blackhole, dns] : [freedom, outbound, blackhole, dns];
}
exports.generateOutbounds = generateOutbounds;
function generateOutbound(opts, ip) {
    var _a, _b, _c;
    let outbound;
    switch (opts.environment.scheme) {
        case 'vless':
            outbound = generateVLess(opts, ip);
            break;
        case 'vmess':
            outbound = generateVMess(opts, ip);
            break;
        case 'trojan':
            outbound = generateTrojan(opts, ip);
            break;
        case 'ss':
            outbound = generateShadowsocks(opts, ip);
            break;
        case 'socks':
            return generateSocks(opts, ip);
        default:
            throw new Error(`unknow scheme: ${opts.environment.scheme}`);
    }
    const protocol = (_a = opts.fileds.protocol) !== null && _a !== void 0 ? _a : '';
    switch (protocol) {
        case '':
        case 'tcp':
        case 'raw':
        case 'ws':
        case 'httpupgrade':
            const mux = (_c = (_b = opts.userdata) === null || _b === void 0 ? void 0 : _b.strategy) === null || _c === void 0 ? void 0 : _c.mux;
            if (mux && mux.enabled) {
                outbound.mux = mux;
            }
            break;
    }
    return outbound;
}
function generateSocks(opts, ip) {
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
                    address: ip !== null && ip !== void 0 ? ip : fileds.address,
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
function generateShadowsocks(opts, ip) {
    const fileds = opts.fileds;
    return {
        tag: 'out-proxy',
        protocol: 'shadowsocks',
        settings: {
            servers: [
                {
                    address: ip !== null && ip !== void 0 ? ip : fileds.address,
                    port: (0, utils_1.getPort)(fileds.port),
                    method: fileds.encryption,
                    password: fileds.password,
                    level: 0,
                },
            ],
        },
        streamSettings: new OutboundStream(opts).generate(),
    };
}
function generateTrojan(opts, ip) {
    const fileds = opts.fileds;
    const flow = fileds.flow;
    return {
        tag: 'out-proxy',
        protocol: 'trojan',
        settings: {
            servers: [
                {
                    address: ip !== null && ip !== void 0 ? ip : fileds.address,
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
function generateVMess(opts, ip) {
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
                    address: ip !== null && ip !== void 0 ? ip : fileds.address,
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
function generateVLess(opts, ip) {
    var _a;
    const fileds = opts.fileds;
    return {
        tag: 'out-proxy',
        protocol: 'vless',
        settings: {
            vnext: [
                {
                    address: ip !== null && ip !== void 0 ? ip : fileds.address,
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
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q;
        const fileds = this.opts.fileds;
        const result = {};
        const security = (_a = fileds.security) !== null && _a !== void 0 ? _a : '';
        switch (security) {
            case '':
                break;
            case 'none':
                result.security = security;
                break;
            case 'tls':
                result.security = security;
                result.tlsSettings = {
                    serverName: this._serverName(),
                    alpn: this._alpn(),
                    fingerprint: this._fingerprint(),
                    allowInsecure: ((_c = (_b = this.opts.userdata) === null || _b === void 0 ? void 0 : _b.strategy) === null || _c === void 0 ? void 0 : _c.allowInsecure) ? true : false,
                };
                break;
            case 'xtls':
                result.security = security;
                result.xtlsSettings = {
                    serverName: this._serverName(),
                    alpn: this._alpn(),
                    fingerprint: this._fingerprint(),
                    allowInsecure: ((_e = (_d = this.opts.userdata) === null || _d === void 0 ? void 0 : _d.strategy) === null || _e === void 0 ? void 0 : _e.allowInsecure) ? true : false,
                };
                break;
            case 'reality':
                result.security = security;
                result.realitySettings = {
                    serverName: this._serverName(),
                    fingerprint: (_f = this._fingerprint()) !== null && _f !== void 0 ? _f : 'random',
                    publicKey: (_g = fileds.publicKey) !== null && _g !== void 0 ? _g : '',
                    shortID: (_h = fileds.shortID) !== null && _h !== void 0 ? _h : '',
                    spiderX: (_j = fileds.spiderX) !== null && _j !== void 0 ? _j : '',
                };
                break;
            default:
                throw new Error(`stream not implemented security: ${security}`);
        }
        const protocol = (_k = fileds.protocol) !== null && _k !== void 0 ? _k : '';
        switch (protocol) {
            case '':
            case 'raw':
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
            case 'http-grpc':
                result.network = 'http';
                result.httpSettings = {
                    method: 'PUT',
                    host: [this._serverName()],
                    read_idle_timeout: 40,
                    path: this._path(),
                    headers: {
                        "Content-Type": ["application/grpc+proto"]
                    }
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
                    serviceName: this._serviceName(),
                    multiMode: this._multiMode(),
                    idle_timeout: 40,
                    initial_windows_size: 65536,
                    permit_without_stream: true,
                };
                break;
            case 'httpupgrade':
                result.network = 'httpupgrade';
                result.httpupgradeSettings = {
                    host: this._serverName(),
                    path: this._path(),
                };
                break;
            case 'splithttp':
            case 'xhttp':
                result.network = 'xhttp';
                result.xhttpSettings = {
                    mode: this._xhttpMode(),
                    host: this._serverName(),
                    path: this._path(),
                    extra: this._xhttpExtra(),
                };
                break;
            default:
                throw new Error(`stream not implemented protocol: ${protocol}`);
        }
        const opts = this.opts;
        if (((_m = (_l = opts.userdata) === null || _l === void 0 ? void 0 : _l.proxy) === null || _m === void 0 ? void 0 : _m.tproxy) && (0, utils_1.isLinux)() && !(0, utils_1.isPort)(opts.environment.port)) {
            result.sockopt = {
                mark: (_q = (_p = (_o = opts === null || opts === void 0 ? void 0 : opts.userdata) === null || _o === void 0 ? void 0 : _o.proxy) === null || _p === void 0 ? void 0 : _p.mark) !== null && _q !== void 0 ? _q : 99,
                domainStrategy: "UseIP",
            };
        }
        else {
            result.sockopt = {
                domainStrategy: "UseIP",
            };
        }
        return result;
    }
    _xhttpExtra() {
        var _a;
        const fileds = this.opts.fileds;
        const val = (_a = fileds.extra) !== null && _a !== void 0 ? _a : '';
        if (val !== '') {
            return JSON.parse(val);
        }
        return;
    }
    _xhttpMode() {
        var _a;
        const fileds = this.opts.fileds;
        const val = (_a = fileds.mode) !== null && _a !== void 0 ? _a : 'auto';
        return val == '' ? 'auto' : val;
    }
    _multiMode() {
        var _a;
        const fileds = this.opts.fileds;
        const val = (_a = fileds.mode) !== null && _a !== void 0 ? _a : '';
        return val == 'multi';
    }
    _serviceName() {
        var _a;
        const fileds = this.opts.fileds;
        const val = (_a = fileds.path) !== null && _a !== void 0 ? _a : '';
        if (val != '') {
            return val;
        }
        return '';
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
