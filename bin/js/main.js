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
function create() {
    return new Provider();
}
exports.create = create;
class Provider {
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
        ];
    }
}
