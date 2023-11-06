import * as core from "xray/core";
import { ConfigureOptions, ConfigureResult, Metadata, Provider, ServeResult, TurnOptions } from "xray/webui";
import { vless } from "./metadata/vless";
import { vmess } from "./metadata/vmess";
import { trojan } from "./metadata/trojan";
import { Xray } from "./xray/xray";
import { shadowsocks } from "./metadata/shadowsocks";
import { socks } from "./metadata/socks";
import { generateDNS } from "./xray/dns";
import { generateLog } from "./xray/log";
import { generateInbounds } from "./xray/inbounds";
import { Userdata } from "./xray/userdata";
import { generateOutbounds } from "./xray/outbounds";
import { generateRouting } from "./xray/routing";
export function create(): Provider {
    return new myProvider()
}
class myProvider implements Provider {
    /**
     * 返回透明代理設定
     */
    firewall(): string {
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
            s = `not implemented`
        }
        return `--- ${core.os} ${core.arch} ---

${s}
`
    }
    /**
     * 啓動透明代理
     */
    turnOn(opts: TurnOptions) {
        if (core.os === `linux`) {
            console.log('turn on', opts.url)
        } else {
            throw new Error(`turnOn not implemented on ${core.os} ${core.arch}`)
        }
    }
    /**
     * 關閉透明代理
     */
    turnOff(opts: TurnOptions) {
        if (core.os === `linux`) {
            console.log('turn off', opts.url)
        } else {
            throw new Error(`turnOff not implemented on ${core.os} ${core.arch}`)
        }
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
    configure(opts: ConfigureOptions<Userdata>): ConfigureResult {
        const o: Xray = {
            log: generateLog(opts),
            dns: generateDNS(opts),
            inbounds: generateInbounds(opts),
            outbounds: generateOutbounds(opts),
            routing: generateRouting(opts),
        }
        return {
            content: JSON.stringify(o, undefined, '    '),
            extension: '.json'
        }
    }
    /**
     * 返回 啓用 xray 的命令
     */
    serve(cnf: string, opts: ConfigureOptions<Userdata>): ServeResult {
        const isWindows = core.os == "windows"
        const separator = isWindows ? '\\' : '/'
        const dir = `${core.root}${separator}xray`
        const name = isWindows ? 'xray.exe' : 'xray'
        const args = ['run', '-c', cnf]
        if (!opts.environment.port) {
            console.log('serve:', name, ...args)
            if (core.os === 'linux') {
                const storage = core.sessionStorage
                try {
                    const s = JSON.stringify(core.lookupHost(opts.fileds.address!))
                    console.log('address:', s)
                    storage.setItem('servers', s)
                } catch (e) {
                    console.warn('address:', e)
                    storage.removeItem('servers')
                }
            }
        }
        return {
            dir: dir,
            name: `${dir}${separator}${name}`,
            args: args,
        }
    }
}
