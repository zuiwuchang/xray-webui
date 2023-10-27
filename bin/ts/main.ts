import * as core from "xray/core";
import { ConfigureOption, ConfigureResult, Metadata, Provider, ServeResult } from "xray/webui";
import { vless } from "./metadata/vless";
import { vmess } from "./metadata/vmess";
import { trojan } from "./metadata/trojan";
import { Xray } from "./xray/xray";
import { shadowsocks } from "./metadata/shadowsocks";
import { socks } from "./metadata/socks";
import { generateDNS } from "./xray/dns";
import { generateLog } from "./xray/log";
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
    configure(opts: ConfigureOption): ConfigureResult {
        core.println(JSON.stringify(opts, undefined, '    '))
        const o: Xray = {
            log: generateLog(opts),
            dns: generateDNS(opts),
        }
        return {
            content: JSON.stringify(o, undefined, '    '),
            extension: '.json'
        }
    }
    /**
     * 返回 啓用 xray 的命令
     */
    serve(dir: string, cnf: string): ServeResult {
        const isWindows = core.os == "windows"
        const separator = isWindows ? '\\' : '/'
        const cwd = `${dir}${separator}xray`
        const name = isWindows ? `${cwd}${separator}xray.exe` : `${cwd}${separator}xray`
        return {
            dir: cwd,
            name: name,
            args: ['run', '-c', cnf],
        }
    }
}
