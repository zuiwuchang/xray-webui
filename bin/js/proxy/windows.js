"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.turnOffWindows = exports.turnOnWindows = void 0;
const systemctl = __importStar(require("xray/systemctl"));
const core = __importStar(require("xray/core"));
const utils_1 = require("../xray/utils");
const servers_1 = require("./servers");
function parseHost(s) {
    const i = s.lastIndexOf(':');
    if (i <= 0) {
        throw new Error(`tun2socks.socks5 invalid: ${s}`);
    }
    let port;
    try {
        port = parseInt(s.substring(i + 1));
    }
    catch (_) {
        throw new Error(`tun2socks.socks5 invalid: ${s}`);
    }
    if ((0, utils_1.isPort)(port)) {
        throw new Error(`tun2socks.socks5 invalid: ${s}`);
    }
    return s.substring(0, i);
}
class Wintun {
    constructor(dns, ip, mask) {
        this.dns = dns;
        this.ip = ip;
        this.mask = mask;
    }
    writeTextFile() {
        const [before, after] = core.root.endsWith('/') || core.root.endsWith('\\') ?
            [`${core.root}tun2socks\\wintun_before.bat`, `${core.root}tun2socks\\wintun_after.bat`] :
            [`${core.root}\\tun2socks\\wintun_before.bat`, `${core.root}\\tun2socks\\wintun_after.bat`];
        core.writeTextFile(before, `netsh interface ip set address name="wintun" source=static addr=169.254.81.186 mask=255.255.255.0 gateway=none
`);
        core.writeTextFile(after, `netsh interface ip set dnsservers name="wintun" source=static addr=${this.dns}
netsh interface ip set address name="wintun" source=static addr=${this.ip} mask=${this.mask} gateway=none
`);
        return [before, after];
    }
    wait() {
        while (true) {
            // 等待創建虛擬網卡
            this._waitCreated();
            //  等待 ip dns 設置就緒
            if (this._checkIP(this.ip)) {
                break;
            }
            else {
                core.sleep(500);
            }
        }
    }
    _waitCreated() {
        let count = 0;
        while (count < 3) {
            if (this._isCreated()) {
                count++;
            }
            else {
                count = 0;
            }
            core.sleep(500);
        }
    }
    _isCreated() {
        const items = core.interfaces();
        for (const item of items) {
            if (item.name == 'wintun') {
                return true;
            }
        }
        return false;
    }
    _isSet(ip) {
        const items = core.interfaces();
        for (const item of items) {
            if (item.name == 'wintun') {
                for (const s of item.addrs) {
                    if (s.startsWith(ip)) {
                        return true;
                    }
                }
                return false;
            }
        }
        return false;
    }
    _checkIP(ip) {
        let count = 0;
        while (count < 3) {
            if (this._isSet(ip)) {
                count++;
            }
            else {
                return false;
            }
            core.sleep(500);
        }
        return true;
    }
}
function turnOnWindows(opts) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
    const status = systemctl.status('tun2socks');
    if (status) {
        // 服務已運行 直接返回
        console.log('turn on tun2socks success (none)');
        return;
    }
    const tun2socks = (_b = (_a = opts === null || opts === void 0 ? void 0 : opts.userdata) === null || _a === void 0 ? void 0 : _a.proxy) === null || _b === void 0 ? void 0 : _b.tun2socks;
    let socks5 = ((_c = tun2socks === null || tun2socks === void 0 ? void 0 : tun2socks.socks5) !== null && _c !== void 0 ? _c : '').trim();
    let socks5ip;
    if (socks5 == '') {
        const port = (_f = (_e = (_d = opts.userdata) === null || _d === void 0 ? void 0 : _d.proxy) === null || _e === void 0 ? void 0 : _e.port) !== null && _f !== void 0 ? _f : 0;
        if (!(0, utils_1.isPort)(port)) {
            throw new Error('proxy port invalid');
        }
        socks5 = `127.0.0.1:${port}`;
    }
    else {
        const host = parseHost(socks5);
        socks5ip = core.lookupHost(host);
    }
    console.info(socks5);
    const servers = (0, servers_1.getServers)();
    const dns = (_g = tun2socks === null || tun2socks === void 0 ? void 0 : tun2socks.dns) !== null && _g !== void 0 ? _g : '8.8.8.8';
    const gateway = (_h = tun2socks === null || tun2socks === void 0 ? void 0 : tun2socks.gateway) !== null && _h !== void 0 ? _h : '192.168.1.1';
    const addr = (_j = tun2socks === null || tun2socks === void 0 ? void 0 : tun2socks.addr) !== null && _j !== void 0 ? _j : '192.168.123.1';
    const mask = (_k = tun2socks === null || tun2socks === void 0 ? void 0 : tun2socks.mask) !== null && _k !== void 0 ? _k : '255.255.255.0';
    try {
        const wintun = new Wintun(dns, addr, mask);
        const [before, after] = wintun.writeTextFile();
        // 運行 服務
        systemctl.install({
            id: 'tun2socks',
            name: `${core.root}/tun2socks/tun2socks-windows-amd64.exe`,
            args: ['-device', 'wintun', '-proxy', `socks5://${socks5}`,
                '-tun-pre-up', before,
                '-tun-post-up', after,
            ],
            log: true,
            run: systemctl.Run.start,
        });
        // 等待網卡繼續
        wintun.wait();
        // 放行到服務器地址
        for (const server of servers) {
            core.exec({
                name: 'route',
                args: ['add', server, gateway],
                log: true,
            });
        }
        // 放行到 socks5 服務器地址
        if (socks5ip) {
            for (const ip of socks5ip) {
                core.exec({
                    name: 'route',
                    args: ['add', ip, gateway],
                    log: true,
                });
            }
        }
        // 刪除默認路由
        core.exec({
            name: 'route',
            args: ['delete', '0.0.0.0/0'],
            log: true,
        });
        // 添加 tun2socks 路徑
        core.sleep(1000);
        core.exec({
            name: 'route',
            args: ['add', '0.0.0.0/0', addr],
            log: true,
        });
        console.log('turn on tun2socks success');
    }
    catch (e) {
        systemctl.uninstall('tun2socks');
        throw e;
    }
}
exports.turnOnWindows = turnOnWindows;
function turnOffWindows(opts) {
    // const status = systemctl.status('tun2socks')
    // if (!status) {
    //     // 服務未運 直接返回
    //     console.log('turn off tun2socks success (none)')
    //     return
    // }
    var _a, _b, _c, _d, _e, _f, _g;
    const tun2socks = (_b = (_a = opts === null || opts === void 0 ? void 0 : opts.userdata) === null || _a === void 0 ? void 0 : _a.proxy) === null || _b === void 0 ? void 0 : _b.tun2socks;
    let socks5 = ((_c = tun2socks === null || tun2socks === void 0 ? void 0 : tun2socks.socks5) !== null && _c !== void 0 ? _c : '').trim();
    let socks5ip;
    if (socks5 == '') {
        const port = (_f = (_e = (_d = opts.userdata) === null || _d === void 0 ? void 0 : _d.proxy) === null || _e === void 0 ? void 0 : _e.port) !== null && _f !== void 0 ? _f : 0;
        if (!(0, utils_1.isPort)(port)) {
            throw new Error('proxy port invalid');
        }
        socks5 = `127.0.0.1:${port}`;
    }
    else {
        const host = parseHost(socks5);
        socks5ip = core.lookupHost(host);
    }
    const servers = (0, servers_1.getServers)();
    const gateway = (_g = tun2socks === null || tun2socks === void 0 ? void 0 : tun2socks.gateway) !== null && _g !== void 0 ? _g : '192.168.1.1';
    // 刪除服務器地址
    for (const server of servers) {
        core.exec({
            name: 'route',
            args: ['delete', server, gateway,],
            log: true,
            safe: true,
        });
    }
    // 刪除 socks5 服務器地址
    if (socks5ip) {
        for (const ip of socks5ip) {
            core.exec({
                name: 'route',
                args: ['delete', ip, gateway,],
                log: true,
                safe: true,
            });
        }
    }
    // 刪除默認路由
    core.exec({
        name: 'route',
        args: ['delete', '0.0.0.0/0'],
        log: true,
    });
    // 恢復默認路由
    core.exec({
        name: 'route',
        args: ['add', '0.0.0.0/0', gateway],
        log: true,
    });
    // 關閉 tun2socks 服務
    systemctl.uninstall('tun2socks');
    console.log('turn off tun2socks success');
}
exports.turnOffWindows = turnOffWindows;
