import * as core from "xray/core";
import { ConfigureOption, Metadata, Provider } from "xray/webui";
import { vless } from "./metadata/vless";
import { vmess } from "./metadata/vmess";
import { trojan } from "./metadata/trojan";
import { Xray } from "./xray/xray";
import { shadowsocks } from "./metadata/shadowsocks";
import { socks } from "./metadata/socks";
export function create(): Provider {
    return new myProvider()
}
class myProvider implements Provider {
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
            vless, vmess,
            trojan,
            shadowsocks,
            socks,
        ]
    }
    /**
     * 返回 xray 設定
     */
    configure(opts: ConfigureOption): string {
        core.println(JSON.stringify(opts, undefined, '    '))
        const o: Xray = {
            log: {
                loglevel: 'warning',
            },
        }
        return JSON.stringify(o, undefined, '    ')
    }
}
