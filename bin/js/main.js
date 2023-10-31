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
exports.create = void 0;
const core = __importStar(require("xray/core"));
const vless_1 = require("./metadata/vless");
const vmess_1 = require("./metadata/vmess");
const trojan_1 = require("./metadata/trojan");
const shadowsocks_1 = require("./metadata/shadowsocks");
const socks_1 = require("./metadata/socks");
const dns_1 = require("./xray/dns");
const log_1 = require("./xray/log");
const inbounds_1 = require("./xray/inbounds");
const outbounds_1 = require("./xray/outbounds");
function create() {
    return new myProvider();
}
exports.create = create;
class myProvider {
    /**
     * 調用防火牆 查看 透明代理 設定
     */
    getFirewall() {
        let s;
        if (core.os === `linux`) {
            const { output, error, code } = core.exec({
                name: 'iptables-save',
                safe: true,
            });
            if (error) {
                s = ` code : ${code}\nerror : ${error}\noutput: ${output}`;
            }
            else {
                s = `${output}`;
            }
        }
        else {
            s = `not support`;
        }
        return `--- ${core.os} ${core.arch} ---

${s}
`;
    }
    /**
     * 爲 web 設置 ui
     */
    metadata() {
        return [
            vless_1.vless, vmess_1.vmess,
            trojan_1.trojan,
            shadowsocks_1.shadowsocks,
            socks_1.socks,
        ];
    }
    /**
     * 返回 xray 設定
     */
    configure(opts) {
        core.println(JSON.stringify(opts, undefined, '    '));
        const o = {
            log: (0, log_1.generateLog)(opts),
            dns: (0, dns_1.generateDNS)(opts),
            inbounds: (0, inbounds_1.generateInbounds)(opts),
            outbounds: (0, outbounds_1.generateOutbounds)(opts),
        };
        return {
            content: JSON.stringify(o, undefined, '    '),
            extension: '.json'
        };
    }
    /**
     * 返回 啓用 xray 的命令
     */
    serve(dir, cnf) {
        const isWindows = core.os == "windows";
        const separator = isWindows ? '\\' : '/';
        const cwd = `${dir}${separator}xray`;
        const name = isWindows ? `${cwd}${separator}xray.exe` : `${cwd}${separator}xray`;
        return {
            dir: cwd,
            name: name,
            args: ['run', '-c', cnf],
        };
    }
}
