import { TurnOptions } from "xray/webui";
import * as core from "xray/core";
import { Userdata } from "../xray/userdata";
import { isPort } from "../xray/utils";
export function turnOnLinux(opts: TurnOptions<Userdata>) {
    const port = opts.userdata?.proxy?.port ?? 0
    if (!isPort(port)) {
        throw new Error('proxy port invalid')
    }
    const servers: Array<string> = []
    const str = core.sessionStorage.getItem('servers')
    if (str) {
        const o = JSON.parse(str)
        if (Array.isArray(o)) {
            servers.push(...o)
        }
    }
    let message: string
    const strs: Array<string> = [
        `#!/bin/bash
set -e

PROXY_PORT=${port}
# https://en.wikipedia.org/wiki/Reserved_IP_addresses
Whitelist=(
    0.0.0.0/8
    10.0.0.0/8
    100.64.0.0/10
    127.0.0.0/8
    169.254.0.0/16
    172.16.0.0/12
    192.0.0.0/24
    192.0.2.0/24
    192.88.99.0/24
    192.168.0.0/16
    198.18.0.0/15
    198.51.100.0/24
    203.0.113.0/24
    224.0.0.0/4
    233.252.0.0/24
    240.0.0.0/4
    255.255.255.255/32
)`
    ]
    const mark = opts.userdata?.proxy?.mark ?? 99
    if (opts.userdata?.proxy?.tproxy) {
        strs.push(`# 添加路由表 100
if [[ \`ip rule list  | egrep '0x1 lookup 100'\` == "" ]];then
    ip rule add fwmark 1 table 100
fi
# 爲路由表 100 設定規則
if [[ \`ip route list table 100 | egrep 'dev lo'\` == "" ]];then
    ip route add local 0.0.0.0/0 dev lo table 100
fi

# 已經設置過直接返回
if [[ \`iptables-save |egrep '\\-A OUTPUT \\-p udp \\-j XRAY_SELF'\` != "" ]];then
    exit 0
fi

# 創建鏈
iptables -t mangle -N XRAY
iptables -t mangle -N XRAY_SELF
iptables -t mangle -N XRAY_DIVERT

# 放行私有地址與廣播地址
for whitelist in "\${Whitelist[@]}"
do
    iptables -t mangle -A XRAY -d "$whitelist" -j RETURN
    iptables -t mangle -A XRAY_SELF -d "$whitelist" -j RETURN
done
`)
        if (servers.length > 0) {
            strs.push("# 放行服務器地址")
            for (const s of servers) {
                strs.push(`iptables -t mangle -A XRAY -d "${s}" -j RETURN
iptables -t mangle -A XRAY_SELF -d "${s}" -j RETURN`)
            }
        }
        strs.push(`
# 可選的配置避免已有連接的包二次通過 tproxy 從而提升一些性能
iptables -t mangle -A XRAY_DIVERT -j MARK --set-mark 1
iptables -t mangle -A XRAY_DIVERT -j ACCEPT
iptables -t mangle -I PREROUTING -p tcp -m socket -j XRAY_DIVERT

# 代理局域網設備 
iptables -t mangle -A XRAY -p tcp -j TPROXY --on-port "$PROXY_PORT" --tproxy-mark 1 # tcp 到 tproxy 代理端口
iptables -t mangle -A XRAY -p udp -j TPROXY --on-port "$PROXY_PORT" --tproxy-mark 1 # udp 到 tproxy 代理端口
iptables -t mangle -A PREROUTING -j XRAY # 流量都重定向到 XRAY 鏈

# 代理本機
iptables -t mangle -A XRAY_SELF -m mark --mark ${mark} -j RETURN # 放行所有 mark ${mark} 的流量
iptables -t mangle -A XRAY_SELF -j MARK --set-mark 1 # 爲流量設置 mark 1
iptables -t mangle -A OUTPUT -p tcp -j XRAY_SELF # tcp 到 XRAY_SELF 鏈
iptables -t mangle -A OUTPUT -p udp -j XRAY_SELF # udp 到 XRAY_SELF 鏈
`)
        message = ' turn on tproxy success'
    } else {
        strs.push(`# 已經設置過直接返回
if [[ \`iptables-save |egrep '\\-A OUTPUT \\-p udp \\-j XRAY_REDIRECT'\` != "" ]];then
    exit 0
fi

# 設置 tcp
iptables -t nat -N XRAY_REDIRECT
# 放行私有地址與廣播地址
for whitelist in "\${Whitelist[@]}"
do
    iptables -t nat -A XRAY_REDIRECT -d "$whitelist" -j RETURN
done
`)
        if (servers.length > 0) {
            strs.push("# 放行服務器地址")
            for (const s of servers) {
                strs.push(`iptables -t nat -A XRAY_REDIRECT -d "${s}" -j RETURN`)
            }
        }
        strs.push(`iptables -t nat -A XRAY_REDIRECT -m mark --mark ${mark} -j RETURN # 放行所有 mark ${mark} 的流量

iptables -t nat -A XRAY_REDIRECT -p tcp -j REDIRECT --to-ports "$PROXY_PORT" # tcp 到 tproxy 代理端口
iptables -t nat -A PREROUTING -p tcp -j XRAY_REDIRECT # 對局域網設備進行代理
iptables -t nat -A OUTPUT -p tcp -j XRAY_REDIRECT # 對本機進行代理
`)
        const dns = opts.userdata?.proxy?.dns ?? ''
        if (dns != '') {
            strs.push(`
iptables -t nat -A OUTPUT -p udp -m udp --dport 53 -j DNAT --to-destination ${dns}
iptables -t nat -A OUTPUT -p tcp -m tcp --dport 53 -j DNAT --to-destination ${dns}
`)
        }
        message = ' turn on redirect success'
    }
    core.exec({
        name: 'bash',
        args: ['-c', strs.join("\n")]
    })
    console.log(message)
}
export function turnOffLinux(opts: TurnOptions<Userdata>) {
    const strs: Array<string> = []
    let message: string
    if (opts.userdata?.proxy?.tproxy) {
        strs.push(`#!/bin/bash
set -e

# 清空 XRAY_DIVERT
if [[ \`iptables-save | egrep '\\-A PREROUTING \\-p tcp \\-m socket \\-j XRAY_DIVERT'\` != "" ]];then
    iptables -t mangle -D PREROUTING -p tcp -m socket -j XRAY_DIVERT
fi
if [[ \`iptables-save | egrep XRAY_DIVERT\` != "" ]];then
    iptables -t mangle -F XRAY_DIVERT
    iptables -t mangle -X XRAY_DIVERT
fi

# 清空 XRAY_SELF 
if [[ \`iptables-save | egrep '\\-A OUTPUT \\-p tcp \\-j XRAY_SELF'\` != "" ]];then
    iptables -t mangle -D OUTPUT -p tcp -j XRAY_SELF
fi
if [[ \`iptables-save | egrep '\\-A OUTPUT \\-p udp \\-j XRAY_SELF'\` != "" ]];then
    iptables -t mangle -D OUTPUT -p udp -j XRAY_SELF
fi
if [[ \`iptables-save | egrep XRAY_SELF\` != "" ]];then
    iptables -t mangle -F XRAY_SELF
    iptables -t mangle -X XRAY_SELF
fi

# 清空 XRAY 
if [[ \`iptables-save | egrep '\\-A PREROUTING \\-j XRAY'\` != "" ]];then
    iptables -t mangle -D PREROUTING -j XRAY
fi
if [[ \`iptables-save | egrep XRAY\` != "" ]];then
    iptables -t mangle -F XRAY
    iptables -t mangle -X XRAY
fi

# 刪除 路由規則
if [[ \`ip route list table 100 | egrep 'dev lo'\` != "" ]];then
    ip route del local 0.0.0.0/0 dev lo table 100
fi
# 刪除 路由表
if [[ \`ip rule list  | egrep '0x1 lookup 100'\` != "" ]];then
    ip rule del fwmark 1 table 100
fi
`)
        message = ' turn off tproxy success'
    } else {
        strs.push(`#!/bin/bash`)
        const dns = opts.userdata?.proxy?.dns ?? ''
        if (dns != '') {
            strs.push(`iptables -t nat -D OUTPUT -p udp -m udp --dport 53 -j DNAT --to-destination ${dns}
iptables -t nat -D OUTPUT -p tcp -m tcp --dport 53 -j DNAT --to-destination ${dns}
`)
        }
        strs.push(`set -e

# 清空 XRAY
if iptables-save | grep -wq '\\-A PREROUTING \\-p tcp \\-j XRAY_REDIRECT'; then
    iptables -t nat -D PREROUTING -p tcp -j XRAY_REDIRECT
fi
if iptables-save | grep -wq '\\-A OUTPUT \\-p tcp \\-j XRAY_REDIRECT'; then
    iptables -t nat -D OUTPUT -p tcp -j XRAY_REDIRECT
fi
if iptables-save | grep -wq 'XRAY_REDIRECT'; then
    iptables -t nat -F XRAY_REDIRECT
    iptables -t nat -X XRAY_REDIRECT
fi`)
        message = ' turn off redirect success'
    }
    core.exec({
        name: 'bash',
        args: ['-c', strs.join("\n")],
        log: true,
    })
    console.log(message)
}
