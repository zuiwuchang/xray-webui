import { ConfigureOptions } from "xray/webui";
import { Inbounds } from "./inbounds/inbounds";
import { Userdata } from "./userdata";
import { isLinux, isPort } from "./utils";

export function generateInbounds(opts: ConfigureOptions<Userdata>): Array<Inbounds> {
    const inbounds: Array<Inbounds> = []
    let port = opts.environment.port
    if (isPort(port)) {
        inbounds.push({
            protocol: 'socks',
            tag: 'socks',
            listen: '127.0.0.1',
            port: port,
            settings: {
                auth: 'noauth',
            },
        })
    } else {
        const userdata = opts.userdata
        let port = userdata?.socks?.port
        if (isPort(port)) {
            const socks = userdata!.socks!
            const accounts = socks.accounts
            inbounds.push({
                protocol: 'socks',
                tag: 'in-socks',
                listen: socks.bind ?? '127.0.0.1',
                port: port,
                settings: accounts && Array.isArray(accounts) && accounts.length > 0 ? {
                    auth: 'password',
                    accounts: accounts.map((v) => {
                        return {
                            user: v?.user ?? '',
                            pass: v?.password ?? '',
                        }
                    }),
                    udp: socks?.udp ?? false,
                    userLevel: 0,
                } : {
                    auth: 'noauth',
                    udp: socks?.udp ?? false,
                    userLevel: 0,
                },
            })
        }
        port = userdata?.http?.port
        if (isPort(port)) {
            const http = userdata!.http!
            const accounts = http.accounts
            inbounds.push({
                protocol: 'http',
                tag: 'in-http',
                listen: http.bind ?? '127.0.0.1',
                port: port,
                settings: {
                    timeout: 300,
                    allowTransparent: false,
                    accounts: accounts && Array.isArray(accounts) && accounts.length > 0 ? accounts.map((v) => {
                        return {
                            user: v?.user ?? '',
                            pass: v?.password ?? '',
                        }
                    }) : undefined,
                    userLevel: 0,
                },
            })
        }
        port = userdata?.dns?.port
        if (isPort(port)) {
            const dns = userdata!.dns!
            inbounds.push({
                protocol: 'dokodemo-door',
                tag: 'in-dns',
                listen: dns?.bind ?? '0.0.0.0',
                port: port,
                settings: {
                    network: 'tcp,udp',
                    followRedirect: true,
                },
            })
        }
        port = userdata?.proxy?.port
        if (isLinux() && isPort(port)) {
            const proxy = userdata!.proxy!
            inbounds.push({
                protocol: 'dokodemo-door',
                tag: 'in-proxy',
                listen: proxy.bind ?? '0.0.0.0',
                port: port,
                settings: {
                    network: 'tcp,udp',
                    followRedirect: true,
                },
                sniffing: {
                    enabled: true,
                    destOverride: [
                        'http', 'tls',
                    ],
                },
                streamSettings: {
                    network: 'tcp',
                    sockopt: {
                        tproxy: proxy.tproxy ? 'tproxy' : 'redirect',
                    },
                }
            })
        }
    }
    return inbounds
}