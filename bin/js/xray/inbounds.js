"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateInbounds = void 0;
const utils_1 = require("./utils");
function generateInbounds(opts) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const inbounds = [];
    let port = opts.environment.port;
    if ((0, utils_1.isPort)(port)) {
        inbounds.push({
            protocol: 'socks',
            tag: 'socks',
            listen: '127.0.0.1',
            port: port,
            settings: {
                auth: 'noauth',
            },
        });
    }
    else {
        const userdata = opts.userdata;
        let port = (_a = userdata === null || userdata === void 0 ? void 0 : userdata.socks) === null || _a === void 0 ? void 0 : _a.port;
        if ((0, utils_1.isPort)(port)) {
            const socks = userdata.socks;
            const accounts = socks.accounts;
            inbounds.push({
                protocol: 'socks',
                tag: 'in-socks',
                listen: (_b = socks.bind) !== null && _b !== void 0 ? _b : '127.0.0.1',
                port: port,
                settings: accounts && Array.isArray(accounts) && accounts.length > 0 ? {
                    auth: 'password',
                    accounts: accounts.map((v) => {
                        var _a, _b;
                        return {
                            user: (_a = v === null || v === void 0 ? void 0 : v.user) !== null && _a !== void 0 ? _a : '',
                            pass: (_b = v === null || v === void 0 ? void 0 : v.password) !== null && _b !== void 0 ? _b : '',
                        };
                    }),
                    udp: (_c = socks === null || socks === void 0 ? void 0 : socks.udp) !== null && _c !== void 0 ? _c : false,
                    userLevel: 0,
                } : {
                    auth: 'noauth',
                    udp: (_d = socks === null || socks === void 0 ? void 0 : socks.udp) !== null && _d !== void 0 ? _d : false,
                    userLevel: 0,
                },
            });
        }
        port = (_e = userdata === null || userdata === void 0 ? void 0 : userdata.http) === null || _e === void 0 ? void 0 : _e.port;
        if ((0, utils_1.isPort)(port)) {
            const http = userdata.http;
            const accounts = http.accounts;
            inbounds.push({
                protocol: 'http',
                tag: 'in-http',
                listen: (_f = http.bind) !== null && _f !== void 0 ? _f : '127.0.0.1',
                port: port,
                settings: {
                    timeout: 300,
                    allowTransparent: false,
                    accounts: accounts && Array.isArray(accounts) && accounts.length > 0 ? accounts.map((v) => {
                        var _a, _b;
                        return {
                            user: (_a = v === null || v === void 0 ? void 0 : v.user) !== null && _a !== void 0 ? _a : '',
                            pass: (_b = v === null || v === void 0 ? void 0 : v.password) !== null && _b !== void 0 ? _b : '',
                        };
                    }) : undefined,
                    userLevel: 0,
                },
            });
        }
        port = (_g = userdata === null || userdata === void 0 ? void 0 : userdata.proxy) === null || _g === void 0 ? void 0 : _g.port;
        if ((0, utils_1.isLinux)() && (0, utils_1.isPort)(port)) {
            const proxy = userdata.proxy;
            inbounds.push({
                protocol: 'dokodemo-door',
                tag: 'in-proxy',
                listen: (_h = proxy.bind) !== null && _h !== void 0 ? _h : '0.0.0.0',
                port: port,
                settings: {
                    network: 'tcp,udp',
                    followRedirect: true,
                },
                sniffing: {
                    enabled: true,
                    destOverride: [
                        'http', 'tls',
                    ],
                },
                streamSettings: {
                    network: 'tcp',
                    sockopt: {
                        tproxy: proxy.tproxy ? 'tproxy' : 'redirect',
                    },
                }
            });
        }
    }
    return inbounds;
}
exports.generateInbounds = generateInbounds;
