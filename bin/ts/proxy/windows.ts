import { TurnOptions } from "xray/webui";
import { Userdata } from "../xray/userdata";
import * as systemctl from "xray/systemctl";
import * as core from "xray/core";
import { isPort } from "../xray/utils";
import { getServers } from "./servers";

function parseHost(s: string): string {
    const i = s.lastIndexOf(':')
    if (i <= 0) {
        throw new Error(`tun2socks.socks5 invalid: ${s}`)
    }
    let port: number
    try {
        port = parseInt(s.substring(i + 1))
    } catch (_) {
        throw new Error(`tun2socks.socks5 invalid: ${s}`)
    }
    if (isPort(port)) {
        throw new Error(`tun2socks.socks5 invalid: ${s}`)
    }
    return s.substring(0, i)
}
class Wintun {
    constructor(readonly dns: string, readonly ip: string, readonly mask: string) { }
    writeTextFile(): [string, string] {
        const [before, after] = core.root.endsWith('/') || core.root.endsWith('\\') ?
            [`${core.root}tun2socks\\wintun_before.bat`, `${core.root}tun2socks\\wintun_after.bat`] :
            [`${core.root}\\tun2socks\\wintun_before.bat`, `${core.root}\\tun2socks\\wintun_after.bat`]
        core.writeTextFile(before, `netsh interface ip set address name="wintun" source=static addr=169.254.81.186 mask=255.255.255.0 gateway=none
`)
        core.writeTextFile(after, `netsh interface ip set dnsservers name="wintun" source=static addr=${this.dns}
netsh interface ip set address name="wintun" source=static addr=${this.ip} mask=${this.mask} gateway=none
`)
        return [before, after]
    }
    wait() {
        while (true) {
            // 等待創建虛擬網卡
            this._waitCreated()

            //  等待 ip dns 設置就緒
            if (this._checkIP(this.ip)) {
                break
            } else {
                core.sleep(500)
            }
        }
    }
    private _waitCreated() {
        let count = 0
        while (count < 3) {
            if (this._isCreated()) {
                count++
            } else {
                count = 0
            }
            core.sleep(500)
        }
    }
    private _isCreated() {
        const items = core.interfaces()
        for (const item of items) {
            if (item.name == 'wintun') {
                return true
            }
        }
        return false
    }
    private _isSet(ip: string) {
        const items = core.interfaces()
        for (const item of items) {
            if (item.name == 'wintun') {
                for (const s of item.addrs) {
                    if (s.startsWith(ip)) {
                        return true
                    }
                }
                return false
            }
        }
        return false
    }
    private _checkIP(ip: string): boolean {
        let count = 0
        while (count < 3) {
            if (this._isSet(ip)) {
                count++
            } else {
                return false
            }
            core.sleep(500)
        }
        return true
    }
}

export function turnOnWindows(opts: TurnOptions<Userdata>) {
    const status = systemctl.status('tun2socks')
    if (status) {
        // 服務已運行 直接返回
        console.log('turn on tun2socks success (none)')
        return
    }

    const tun2socks = opts?.userdata?.proxy?.tun2socks
    let socks5 = (tun2socks?.socks5 ?? '').trim()
    let socks5ip: undefined | Array<string>
    if (socks5 == '') {
        const port = opts.userdata?.proxy?.port ?? 0
        if (!isPort(port)) {
            throw new Error('proxy port invalid')
        }
        socks5 = `127.0.0.1:${port}`
    } else {
        const host = parseHost(socks5)
        socks5ip = core.lookupHost(host)
    }
    console.info(socks5)
    const servers = getServers()
    const dns = tun2socks?.dns ?? '8.8.8.8'
    const gateway = tun2socks?.gateway ?? '192.168.1.1'
    const addr = tun2socks?.addr ?? '192.168.123.1'
    const mask = tun2socks?.mask ?? '255.255.255.0'

    try {
        const wintun = new Wintun(dns, addr, mask)
        const [before, after] = wintun.writeTextFile()
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
        })

        // 等待網卡繼續
        wintun.wait()

        // 放行到服務器地址
        for (const server of servers) {
            core.exec({
                name: 'route',
                args: ['add', server, gateway],
                log: true,
            })
        }
        // 放行到 socks5 服務器地址
        if (socks5ip) {
            for (const ip of socks5ip) {
                core.exec({
                    name: 'route',
                    args: ['add', ip, gateway],
                    log: true,
                })
            }
        }
        // 刪除默認路由
        core.exec({
            name: 'route',
            args: ['delete', '0.0.0.0/0'],
            log: true,
        })
        // 添加 tun2socks 路徑
        core.sleep(1000);
        core.exec({
            name: 'route',
            args: ['add', '0.0.0.0/0', addr],
            log: true,
        })
        console.log('turn on tun2socks success')
    } catch (e) {
        systemctl.uninstall('tun2socks')
        throw e
    }
}

export function turnOffWindows(opts: TurnOptions<Userdata>) {
    // const status = systemctl.status('tun2socks')
    // if (!status) {
    //     // 服務未運 直接返回
    //     console.log('turn off tun2socks success (none)')
    //     return
    // }

    const tun2socks = opts?.userdata?.proxy?.tun2socks;
    let socks5 = (tun2socks?.socks5 ?? '').trim()
    let socks5ip: undefined | Array<string>
    if (socks5 == '') {
        const port = opts.userdata?.proxy?.port ?? 0
        if (!isPort(port)) {
            throw new Error('proxy port invalid')
        }
        socks5 = `127.0.0.1:${port}`
    } else {
        const host = parseHost(socks5)
        socks5ip = core.lookupHost(host)
    }
    const servers = getServers()
    const gateway = tun2socks?.gateway ?? '192.168.1.1'

    // 刪除服務器地址
    for (const server of servers) {
        core.exec({
            name: 'route',
            args: ['delete', server, gateway,],
            log: true,
            safe: true,
        })
    }
    // 刪除 socks5 服務器地址
    if (socks5ip) {
        for (const ip of socks5ip) {
            core.exec({
                name: 'route',
                args: ['delete', ip, gateway,],
                log: true,
                safe: true,
            })
        }
    }
    // 刪除默認路由
    core.exec({
        name: 'route',
        args: ['delete', '0.0.0.0/0'],
        log: true,
    })
    // 恢復默認路由
    core.exec({
        name: 'route',
        args: ['add', '0.0.0.0/0', gateway],
        log: true,
    })
    // 關閉 tun2socks 服務
    systemctl.uninstall('tun2socks')

    console.log('turn off tun2socks success')
}