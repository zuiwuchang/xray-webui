import * as core from "xray/core";
import { ConfigureOptions, ConfigureResult, Default, Metadata, Provider, ServeResult, TurnOptions } from "xray/webui";
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
    /**
     * 返回默認設定
     */
    getDefault(): Default {
        return {
            url: 'https://www.youtube.com/',
            run: true,
            firewall: false,
            strategy: 4,
            userdata: `// 爲代理設置訪問用戶名密碼
local accounts = [
    {
        // 用戶名
        user: 'killer',
        // 密碼
        password: '19890604',
    },
];
{
    // 日誌設定
    log: {
        // 要記錄的日誌等級
        // level: 'debug',      // 調試程序時用到的輸出信息
        // level: 'info',           // 運行時的狀態信息
        // level: 'warning',  // 認的設定，發生了一些不影響正常運作的問題時輸出的訊息，但有可能影響使用者的體驗
        // level: 'error',         // 遇到了無法正常運作的問題，需要立即解決
        // level: 'none',         // 不記錄任何內容

        // 如果爲 true 啓用 dns 查詢日誌
        // dns: true,
    },
    // socks 代理設定
    socks: {
        // 監聽地址，默認 '127.0.0.1'
        // bind: '0.0.0.0',
        // 監聽端口，如果無效 則不啓用 socks 代理
        port: 1080,
        // 如果爲 true 則允許代理 udp
        udp: true,
        // 用戶數組默認不需要認證
        // accounts: accounts,
    },
    // http 代理設定
    http: {
        // 監聽地址，默認 '127.0.0.1'
        // bind: '0.0.0.0',
        // 監聽端口，如果無效 則不啓用 http 代理
        // port: 8118,
        // 用戶數組默認不需要認證
        // accounts: accounts,
    },
    // 提供無污染的 dns 服務
    dns: {
        // 監聽地址，默認 '0.0.0.0'
        // bind: '127.0.0.1',
        // 監聽端口，如果無效 則不啓用 dns 服務
        // port: 10053,
    },
    // 透明代理設定
    proxy: {
        // 監聽地址，默認 '0.0.0.0'
        // bind: '127.0.0.1',
        // 監聽端口，如果無效 則不啓用 透明代理
        port: 12345,
        // 如果爲 true，則在 linnux 下使用 tproxy 作爲全局代理，否則使用 redirect 作爲全局代理
        tproxy: true,
        // tproxy mark
        mark: 99,
        // 只有在 linux 下使用 redirect 模式時有效，如果設置會攔截連接 53 端口的 udp/tcp 重定向到此值
        // dns: '127.0.0.1:10053',
        // 目前在 windows 下使用 tun2socks 實現透明代理，這裏是需要提供的一些網卡相關設定
        tun2socks: {
            // socks5 代理地址 ip:port，默認爲 127.0.0.1:\${userdata.proxy.port}
            // socks5: '192.168.1.1:1080',
            // 系統默認上網網關 ip
            gateway: '192.168.1.1',
            // 虛擬網卡使用的 dns 服務器 ip 地址，不能帶端口 
            dns: '8.8.8.8',
            // tun2socks 虛擬網卡 ip
            addr: '192.168.123.1',
            // tun2socks 虛擬網卡 子網掩碼
            mask: '255.255.255.0',
        }
    },
    routing: {
        // 爲 bt 設置出棧 tag
        bittorrent: 'out-freedom', // 不使用代理
        // bittorrent: 'out-blackhole', // 阻止訪問
        // bittorrent: 'out-proxy', // 使用代理

        // 要代理訪問的 ip，忽略策略設定，這些 ip 將始終被代理訪問
        /**
        proxyIP: [
            // '8.8.8.8',
        ],/**/
        // 要代理訪問的 域名，忽略策略設定，這些 域名 將始終被代理訪問
        /**
        proxyDomain: [
            'geosite:apple',
            'geosite:google',
            'geosite:microsoft',
            'geosite:facebook',
            'geosite:twitter',
            'geosite:telegram',
            'geosite:geolocation-!cn',
            'geosite:tld-!cn',
        ],/**/

        // 要直接訪問的 ip，忽略策略設定，這些 ip 將始終被直接訪問
        /**
        directIP: [
            'geoip:private',
            'geoip:cn',
        ],/**/
        // 要直接訪問的 域名，忽略策略設定，這些 域名 將始終被直接訪問
        /**
        directDomain: [
            'geosite:cn',
        ],/**/

        // 要禁止訪問的 ip，忽略策略設定，這些 ip 將始終被禁止訪問
        /**
        blockIP: [
            // 'geoip:cn',
        ],/**/
        // 要禁止訪問的 域名，忽略策略設定，這些 域名 將始終被禁止訪問
        /**/
        blockDomain: [
            'geosite:category-ads',
            // 'geosite:category-ads-all',
        ],/**/
    }
}`,
        }
    }
}
