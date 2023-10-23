import * as core from "xray/core";
import { Metadata } from "xray/webui";
import { vless } from "./metadata/vless";
import { vmess } from "./metadata/vmess";
import { trojan } from "./metadata/trojan";
export function create(): Provider {
    return new Provider()
}
class Provider {
    /**
     * 調用防火牆 查看 透明代理 設定
     */
    getFirewall(): string {
        let s: string
        if (core.os === `linux`) {
            const { output, error, code } = core.exec({
                name: 'iptables-save',
                safe: true,
            })
            if (error) {
                s = ` code : ${code}\nerror : ${error}\noutput: ${output}`
            } else {
                s = `${output}`
            }
        } else {
            s = `not support`
        }
        return `--- ${core.os} ${core.arch} ---

${s}
`
    }
    /**
     * 爲 web 設置 ui 
     */
    metadata(): Array<Metadata> {
        return [
            vless, vmess, trojan,
        ]
    }
}
