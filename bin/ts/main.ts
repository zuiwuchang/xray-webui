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
import { turnOffLinux, turnOnLinux } from "./proxy/linux";
import { isLinux, isWindows } from "./xray/utils";
import { turnOffWindows, turnOnWindows } from "./proxy/windows";
export function create(): Provider {
    return new myProvider()
}
class myProvider implements Provider {
    version(): string {
        const isWindows = core.os == "windows"
        const separator = isWindows ? '\\' : '/'
        const dir = `${core.root}${separator}xray`
        const name = isWindows ? 'xray.exe' : 'xray'
        const args = ['version']
        const s = core.exec({
            name: `${dir}${separator}${name}`,
            args: args,
        })
        const strs = s.split("\n")
        for (let line of strs) {
            line = line.trim()
            if (line.startsWith('Xray')) {
                return line
            }
        }
        return ''
    }
    /**
     * 返回透明代理設定
     */
    firewall(): string {
        let s: string
        if (isLinux()) {
            const { output, error, code } = core.exec({
                name: 'iptables-save',
                safe: true,
            })
            if (error) {
                s = ` code : ${code}\nerror : ${error}\noutput: ${output}`
            } else {
                s = `${output}`
            }
        } else if (isWindows()) {
            const { output, error, code } = core.exec({
                name: 'NETSTAT.EXE',
                args: ['-nr'],
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
    turnOn(opts: TurnOptions<Userdata>) {
        if (core.os === `linux`) {
            turnOnLinux(opts)
        } else if (core.os === `windows`) {
            turnOnWindows(opts)
        } else {
            throw new Error(`turnOn not implemented on ${core.os} ${core.arch}`)
        }
    }
    /**
     * 關閉透明代理
     */
    turnOff(opts: TurnOptions<Userdata>) {
        if (core.os === `linux`) {
            turnOffLinux(opts)
        } else if (core.os === `windows`) {
            turnOffWindows(opts)
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
        let ips: undefined | Array<string>
        let ip: undefined | string
        const address = opts.fileds.address!
        const arrs = core.lookupHost(address)
        if (arrs && arrs.length > 0) {
            core.sessionStorage.setItem('dns', JSON.stringify({
                address: address,
                ips: arrs,
            }))
            ips = arrs
            ip = arrs[0]
        }
        const o: Xray = {
            log: generateLog(opts),
            dns: generateDNS(opts, ips),
            inbounds: generateInbounds(opts),
            outbounds: generateOutbounds(opts, ip),
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
            if (core.os === 'linux' || isWindows) {
                try {
                    const s = JSON.stringify(this._servers(opts.fileds.address!))
                    console.log('address:', s)
                    core.sessionStorage.setItem('servers', s)
                } catch (e) {
                    console.warn('address:', e)
                    core.sessionStorage.removeItem('servers')
                }
            }
        }
        return {
            dir: dir,
            name: `${dir}${separator}${name}`,
            args: args,
        }
    }
    /**
     * 返回緩存的服務器 ip
     */
    private _servers(address: string): Array<string> {
        const s = core.sessionStorage.getItem('dns') ?? ''
        if (s != '') {
            try {
                const o = JSON.parse(s)
                if (o.address == address) {
                    return o.ips
                }
            } catch (e) {
                console.warn(e)
            }
        }
        return core.lookupHost(address)
    }
}
