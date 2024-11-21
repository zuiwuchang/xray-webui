import { ConfigureOptions } from "xray/webui";
import { Outbounds } from "./outbounds/outbounds";
import { Userdata } from "./userdata";
import { getPort, getUint, isLinux, isPort } from "./utils";
import { VLess } from "./outbounds/vless";
import { VLessFileds } from "../metadata/vless";
import { Stream } from "./transport/stream";
import { TCPStream } from "./transport/tcp";
import { GRPCStream } from "./transport/grpc";
import { WSStream } from "./transport/ws";
import { VMess } from "./outbounds/vmess";
import { VMessFileds } from "../metadata/vmess";
import { HttpStream } from "./transport/http";
import { QuicStream } from "./transport/quic";
import { KCPStream } from "./transport/kcp";
import { Trojan } from "./outbounds/trojan";
import { TrojanFileds } from "../metadata/trojan";
import { Shadowsocks } from "./outbounds/shadowsocks";
import { Socks } from "./outbounds/socks";
import { Freedom } from "./outbounds/freedom";
import { Blackhole } from "./outbounds/blackhole";
import { DNS } from "./outbounds/dns";
import { HttpupgradeStream } from "./transport/httpupgrade";
import { SplithttpStream } from "./transport/splithttp";

export function generateOutbounds(opts: ConfigureOptions<Userdata>, ip?: string): Array<Outbounds> {
    const isport = isPort(opts.environment.port)
    if (isport) {
        return [generateOutbound(opts)]
    }
    const outbound = generateOutbound(opts, ip)
    const mark = opts.userdata?.proxy?.mark ?? 99

    const freedom: Freedom = {
        tag: 'out-freedom',
        protocol: 'freedom',
        streamSettings: {
            sockopt: {
                mark: mark,
            },
        },
    }
    const blackhole: Blackhole = {
        tag: 'out-blackhole',
        protocol: 'blackhole',
        settings: {},
    }

    const dns: DNS = {
        tag: 'out-dns',
        protocol: 'dns',
        settings: {
            address: '8.8.8.8',
            port: 53,
        },
        streamSettings: {
            sockopt: {
                mark: mark,
            },
        },
    }

    return opts.strategy.value < 5 ? [outbound, freedom, blackhole, dns] : [freedom, outbound, blackhole, dns]
}
function generateOutbound(opts: ConfigureOptions<Userdata>, ip?: string): Outbounds {
    switch (opts.environment.scheme) {
        case 'vless':
            return generateVLess(opts, ip)
        case 'vmess':
            return generateVMess(opts, ip)
        case 'trojan':
            return generateTrojan(opts, ip)
        case 'ss':
            return generateShadowsocks(opts, ip)
        case 'socks':
            return generateSocks(opts, ip)
        default:
            throw new Error(`unknow scheme: ${opts.environment.scheme}`)
    }
}
function generateSocks(opts: ConfigureOptions<Userdata>, ip?: string): Socks {
    const fileds = opts.fileds
    const username = fileds.username ?? ''
    const password = fileds.password ?? ''
    return {
        tag: 'out-proxy',
        protocol: 'socks',
        settings: {
            servers: [
                {
                    address: ip ?? fileds.address!,
                    port: getPort(fileds.port),
                    users: username != '' || password != '' ? [
                        {
                            user: username,
                            pass: password,
                        }
                    ] : undefined,
                },
            ],
        },
        streamSettings: new OutboundStream(opts).generate(),
    }
}
function generateShadowsocks(opts: ConfigureOptions<Userdata>, ip?: string): Shadowsocks {
    const fileds = opts.fileds
    return {
        tag: 'out-proxy',
        protocol: 'shadowsocks',
        settings: {
            servers: [
                {
                    address: ip ?? fileds.address!,
                    port: getPort(fileds.port),
                    method: fileds.encryption! as any,
                    password: fileds.password!,
                    level: 0,
                },
            ],
        },
        streamSettings: new OutboundStream(opts).generate(),
    }
}
function generateTrojan(opts: ConfigureOptions<Userdata>, ip?: string): Trojan {
    const fileds: TrojanFileds = opts.fileds
    const flow = fileds.flow
    return {
        tag: 'out-proxy',
        protocol: 'trojan',
        settings: {
            servers: [
                {
                    address: ip ?? fileds.address!,
                    port: getPort(fileds.port),
                    password: fileds.userID!,
                    flow: flow,
                    level: 0
                },
            ],
        },
        streamSettings: new OutboundStream(opts).generate(),
    }
}
function generateVMess(opts: ConfigureOptions<Userdata>, ip?: string): VMess {
    const fileds: VMessFileds = opts.fileds
    let encryption = fileds.encryption ?? 'auto'
    if (encryption == '') {
        encryption = 'auto'
    }
    return {
        tag: 'out-proxy',
        protocol: 'vmess',
        settings: {
            vnext: [
                {
                    address: ip ?? fileds.address!,
                    port: getPort(fileds.port),
                    users: [
                        {
                            id: fileds.userID!,
                            security: encryption as any,
                            level: getUint(fileds.userLevel, 0),
                            alterId: getUint(fileds.alterID, 0),
                        },
                    ],
                },
            ],
        },
        streamSettings: new OutboundStream(opts).generate(),
    }
}
function generateVLess(opts: ConfigureOptions<Userdata>, ip?: string): VLess {
    const fileds: VLessFileds = opts.fileds
    return {
        tag: 'out-proxy',
        protocol: 'vless',
        settings: {
            vnext: [
                {
                    address: ip ?? fileds.address!,
                    port: getPort(fileds.port),
                    users: [
                        {
                            id: fileds.userID!,
                            encryption: 'none',
                            flow: (fileds.flow ?? '') as any,
                            level: getUint(fileds.userLevel, 0),
                        },
                    ],
                },
            ],
        },
        streamSettings: new OutboundStream(opts).generate(),
    }
}

class OutboundStream {
    constructor(readonly opts: ConfigureOptions<Userdata>) { }
    generate(): Stream {
        const fileds = this.opts.fileds
        const result: Stream = {}
        const security = fileds.security ?? ''
        switch (security) {
            case '':
                break
            case 'none':
                result.security = security;
                break;
            case 'tls':
                result.security = security
                result.tlsSettings = {
                    serverName: this._serverName(),
                    alpn: this._alpn(),
                    fingerprint: this._fingerprint(),
                }
                break
            case 'xtls':
                result.security = security
                result.xtlsSettings = {
                    serverName: this._serverName(),
                    alpn: this._alpn(),
                    fingerprint: this._fingerprint(),
                }
                break
            case 'reality':
                result.security = security
                result.realitySettings = {
                    serverName: this._serverName(),
                    fingerprint: this._fingerprint() ?? 'random',
                    publicKey: fileds.publicKey ?? '',
                    shortID: fileds.shortID ?? '',
                    spiderX: fileds.spiderX ?? '',
                }
                break
            default:
                throw new Error(`stream not implemented security: ${security}`)
        }
        const protocol = fileds.protocol ?? ''
        switch (protocol) {
            case '':
            case 'tcp':
                result.network = 'tcp';
                (result as TCPStream).tcpSettings = {
                    header: {
                        type: 'none',
                    }
                }
                break
            case 'kcp':
                result.network = 'kcp';
                (result as KCPStream).kcpSettings = {
                    congestion: true,
                    header: {
                        type: 'wechat-video',
                    }
                }
                break
            case 'ws':
                result.network = 'ws';
                (result as WSStream).wsSettings = {
                    path: this._path(),
                    headers: {
                        Host: this._serverName(),
                    },
                }
                break
            case 'http':
                result.network = 'http';
                (result as HttpStream).httpSettings = {
                    method: 'PUT',
                    host: [this._serverName()],
                    read_idle_timeout: 40,
                    path: this._path(),
                }
                break
            case 'http-grpc':
                result.network = 'http';
                (result as HttpStream).httpSettings = {
                    method: 'PUT',
                    host: [this._serverName()],
                    read_idle_timeout: 40,
                    path: this._path(),
                    headers: {
                        "Content-Type": ["application/grpc+proto"]
                    }
                }
                break
            // case 'domainsocket':
            //     break
            case 'quic':
                result.network = 'quic';
                (result as QuicStream).quicSettings = {
                    header: {
                        type: 'wechat-video',
                    }
                }
                break
            case 'grpc':
                result.network = 'grpc';
                (result as GRPCStream).grpcSettings = {
                    serviceName: this._serviceName(),
                    multiMode: this._multiMode(),
                    idle_timeout: 40,
                    initial_windows_size: 65536,
                    permit_without_stream: true,
                }
                break
            case 'httpupgrade':
                result.network = 'httpupgrade';
                (result as HttpupgradeStream).httpupgradeSettings = {
                    host: this._serverName(),
                    path: this._path(),
                }
                break
            case 'splithttp':
            case 'xhttp':
                result.network = 'xhttp';

                (result as SplithttpStream).xhttpSettings = {
                    mode: this._xhttpMode(),
                    host: this._serverName(),
                    path: this._path(),
                    extra: this._xhttpExtra(),
                }
                break
            default:
                throw new Error(`stream not implemented protocol: ${protocol}`)
        }
        const opts = this.opts
        if (opts.userdata?.proxy?.tproxy && isLinux() && !isPort(opts.environment.port)) {
            result.sockopt = {
                mark: opts?.userdata?.proxy?.mark ?? 99,
            }
        }
        return result
    }
    private _xhttpExtra(): any {
        const fileds = this.opts.fileds
        const val = fileds.extra ?? ''
        if (val !== '') {
            return JSON.parse(val)
        }
        return
    }
    private _xhttpMode(): string {
        const fileds = this.opts.fileds
        const val = fileds.mode ?? 'auto'
        return val == '' ? 'auto' : val
    }
    private _multiMode(): boolean {
        const fileds = this.opts.fileds
        const val = fileds.mode ?? ''
        return val == 'multi'
    }
    private _serviceName(): string {
        const fileds = this.opts.fileds
        const val = fileds.path ?? ''
        if (val != '') {
            return val
        }
        return ''
    }
    private _path(): string {
        const fileds = this.opts.fileds
        const val = fileds.path ?? ''
        if (val != '') {
            return val
        }
        return '/'
    }
    private _serverName(): string {
        const fileds = this.opts.fileds
        const val = fileds.host ?? ''
        if (val != '') {
            return val
        }
        return fileds.address!
    }
    private _alpn(): Array<string> | undefined {
        const fileds = this.opts.fileds
        const val = fileds.alpn ?? ''
        if (val != '') {
            return val.split(',')
        }
        return ["h2", "http/1.1"]
    }
    private _fingerprint(): string {
        const fileds = this.opts.fileds
        const val = fileds.fingerprint ?? ''
        if (val != '') {
            return val
        }
        return 'firefox'
    }
}
