"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.turnStateLinux = exports.turnOffLinux = exports.turnOnLinux = void 0;
const core = __importStar(require("xray/core"));
const utils_1 = require("../xray/utils");
const servers_1 = require("./servers");
function turnOnLinux(opts) {
    var _a, _b;
    switch ((_b = (_a = opts.userdata) === null || _a === void 0 ? void 0 : _a.strategy) === null || _b === void 0 ? void 0 : _b.proxy) {
        case 'v6':
            turnOnV6(opts);
            break;
        case 'v4v6':
            turnOnV4(opts);
            turnOnV6(opts);
            break;
        case 'v4':
        default:
            turnOnV4(opts);
            break;
    }
}
exports.turnOnLinux = turnOnLinux;
function turnOnV4(opts) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
    const port = (_c = (_b = (_a = opts.userdata) === null || _a === void 0 ? void 0 : _a.proxy) === null || _b === void 0 ? void 0 : _b.port) !== null && _c !== void 0 ? _c : 0;
    if (!(0, utils_1.isPort)(port)) {
        throw new Error('proxy port invalid');
    }
    const servers = (0, servers_1.getServers)().filter((s) => s.includes('.'));
    console.log('v4 servers', servers);
    let message;
    const strs = [
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
    ];
    const mark = (_f = (_e = (_d = opts.userdata) === null || _d === void 0 ? void 0 : _d.proxy) === null || _e === void 0 ? void 0 : _e.mark) !== null && _f !== void 0 ? _f : 99;
    if ((_h = (_g = opts.userdata) === null || _g === void 0 ? void 0 : _g.proxy) === null || _h === void 0 ? void 0 : _h.tproxy) {
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
`);
        if (servers.length > 0) {
            strs.push("# 放行服務器地址");
            for (const s of servers) {
                strs.push(`iptables -t mangle -A XRAY -d "${s}" -j RETURN
iptables -t mangle -A XRAY_SELF -d "${s}" -j RETURN`);
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
`);
        message = ' turn on tproxy success';
    }
    else {
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
`);
        if (servers.length > 0) {
            strs.push("# 放行服務器地址");
            for (const s of servers) {
                strs.push(`iptables -t nat -A XRAY_REDIRECT -d "${s}" -j RETURN`);
            }
        }
        strs.push(`iptables -t nat -A XRAY_REDIRECT -m mark --mark ${mark} -j RETURN # 放行所有 mark ${mark} 的流量

iptables -t nat -A XRAY_REDIRECT -p tcp -j REDIRECT --to-ports "$PROXY_PORT" # tcp 到 tproxy 代理端口
iptables -t nat -A PREROUTING -p tcp -j XRAY_REDIRECT # 對局域網設備進行代理
iptables -t nat -A OUTPUT -p tcp -j XRAY_REDIRECT # 對本機進行代理
`);
        const dns = (_l = (_k = (_j = opts.userdata) === null || _j === void 0 ? void 0 : _j.proxy) === null || _k === void 0 ? void 0 : _k.dns) !== null && _l !== void 0 ? _l : '';
        if (dns != '') {
            strs.push(`
iptables -t nat -A OUTPUT -p udp -m udp --dport 53 -j DNAT --to-destination ${dns}
iptables -t nat -A OUTPUT -p tcp -m tcp --dport 53 -j DNAT --to-destination ${dns}
`);
        }
        message = ' turn on redirect success';
    }
    core.exec({
        name: 'bash',
        args: ['-c', strs.join("\n")]
    });
    console.log(message);
}
function turnOnV6(opts) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
    const port = (_c = (_b = (_a = opts.userdata) === null || _a === void 0 ? void 0 : _a.proxy) === null || _b === void 0 ? void 0 : _b.port) !== null && _c !== void 0 ? _c : 0;
    if (!(0, utils_1.isPort)(port)) {
        throw new Error('proxy port invalid');
    }
    const servers = (0, servers_1.getServers)().filter((s) => s.includes(':'));
    console.log('v6 servers', servers);
    let message;
    const strs = [
        `#!/bin/bash
set -e

PROXY_PORT=${port}
# https://www.iana.org/assignments/iana-ipv6-special-registry/iana-ipv6-special-registry.xhtml
Whitelist=(
    ::1/128
    fe80::/10
)
`
    ];
    const mark = (_f = (_e = (_d = opts.userdata) === null || _d === void 0 ? void 0 : _d.proxy) === null || _e === void 0 ? void 0 : _e.mark) !== null && _f !== void 0 ? _f : 99;
    if ((_h = (_g = opts.userdata) === null || _g === void 0 ? void 0 : _g.proxy) === null || _h === void 0 ? void 0 : _h.tproxy) {
        strs.push(`# 添加路由表 106
if [[ \`ip -6 rule list  | egrep '0x1 lookup 106'\` == "" ]];then
    ip -6 rule add fwmark 1 table 106
fi
# 爲路由表 106 設定規則
if [[ \`ip -6 route list table 106 | egrep 'dev lo'\` == "" ]];then
    ip -6 route add local ::/0 dev lo table 106
fi

# 已經設置過直接返回
if [[ \`ip6tables-save |egrep '\\-A OUTPUT \\-p udp \\-j XRAY6_SELF'\` != "" ]];then
    exit 0
fi

# 創建鏈
ip6tables -t mangle -N XRAY6
ip6tables -t mangle -N XRAY6_SELF
ip6tables -t mangle -N XRAY6_DIVERT

# 放行私有地址與廣播地址
for whitelist in "\${Whitelist[@]}"
do
    ip6tables -t mangle -A XRAY6 -d "$whitelist" -j RETURN
    ip6tables -t mangle -A XRAY6_SELF -d "$whitelist" -j RETURN
done
`);
        if (servers.length > 0) {
            strs.push("# 放行服務器地址");
            for (const s of servers) {
                strs.push(`ip6tables -t mangle -A XRAY6 -d "${s}" -j RETURN
ip6tables -t mangle -A XRAY6_SELF -d "${s}" -j RETURN`);
            }
        }
        strs.push(`
# 可選的配置避免已有連接的包二次通過 tproxy 從而提升一些性能
ip6tables -t mangle -A XRAY6_DIVERT -j MARK --set-mark 1
ip6tables -t mangle -A XRAY6_DIVERT -j ACCEPT
ip6tables -t mangle -I PREROUTING -p tcp -m socket -j XRAY6_DIVERT

# 代理局域網設備 
ip6tables -t mangle -A XRAY6 -p tcp -j TPROXY --on-port "$PROXY_PORT" --tproxy-mark 1 # tcp 到 tproxy 代理端口
ip6tables -t mangle -A XRAY6 -p udp -j TPROXY --on-port "$PROXY_PORT" --tproxy-mark 1 # udp 到 tproxy 代理端口
ip6tables -t mangle -A PREROUTING -j XRAY6 # 流量都重定向到 XRAY 鏈

# 代理本機
ip6tables -t mangle -A XRAY6_SELF -m mark --mark ${mark} -j RETURN # 放行所有 mark ${mark} 的流量
ip6tables -t mangle -A XRAY6_SELF -j MARK --set-mark 1 # 爲流量設置 mark 1
ip6tables -t mangle -A OUTPUT -p tcp -j XRAY6_SELF # tcp 到 XRAY_SELF 鏈
ip6tables -t mangle -A OUTPUT -p udp -j XRAY6_SELF # udp 到 XRAY_SELF 鏈
`);
        message = ' turn on tproxy success';
    }
    else {
        strs.push(`# 已經設置過直接返回
if [[ \`ip6tables-save |egrep '\\-A OUTPUT \\-p udp \\-j XRAY6_REDIRECT'\` != "" ]];then
    exit 0
fi

# 設置 tcp
ip6tables -t nat -N XRAY6_REDIRECT
# 放行私有地址與廣播地址
for whitelist in "\${Whitelist[@]}"
do
    ip6tables -t nat -A XRAY6_REDIRECT -d "$whitelist" -j RETURN
done
`);
        if (servers.length > 0) {
            strs.push("# 放行服務器地址");
            for (const s of servers) {
                strs.push(`ip6tables -t nat -A XRAY6_REDIRECT -d "${s}" -j RETURN`);
            }
        }
        strs.push(`ip6tables -t nat -A XRAY6_REDIRECT -m mark --mark ${mark} -j RETURN # 放行所有 mark ${mark} 的流量
        
ip6tables -t nat -A XRAY6_REDIRECT -p tcp -j REDIRECT --to-ports "$PROXY_PORT" # tcp 到 tproxy 代理端口
ip6tables -t nat -A PREROUTING -p tcp -j XRAY6_REDIRECT # 對局域網設備進行代理
ip6tables -t nat -A OUTPUT -p tcp -j XRAY6_REDIRECT # 對本機進行代理
`);
        const dns = (_l = (_k = (_j = opts.userdata) === null || _j === void 0 ? void 0 : _j.proxy) === null || _k === void 0 ? void 0 : _k.dns6) !== null && _l !== void 0 ? _l : '';
        if (dns != '') {
            strs.push(`
ip6tables -t nat -A OUTPUT -p udp -m udp --dport 53 -j DNAT --to-destination ${dns}
ip6tables -t nat -A OUTPUT -p tcp -m tcp --dport 53 -j DNAT --to-destination ${dns}
`);
        }
        message = ' turn on redirect success';
    }
    core.exec({
        name: 'bash',
        args: ['-c', strs.join("\n")]
    });
    console.log(message);
}
function turnOffLinux(opts) {
    var _a, _b;
    switch ((_b = (_a = opts.userdata) === null || _a === void 0 ? void 0 : _a.strategy) === null || _b === void 0 ? void 0 : _b.proxy) {
        case 'v6':
            turnOffV6(opts);
            break;
        case 'v4v6':
            turnOffV4(opts);
            turnOffV6(opts);
            break;
        case 'v4':
        default:
            turnOffV4(opts);
            break;
    }
}
exports.turnOffLinux = turnOffLinux;
function turnOffV6(opts) {
    var _a, _b, _c, _d, _e;
    const strs = [];
    let message;
    if ((_b = (_a = opts.userdata) === null || _a === void 0 ? void 0 : _a.proxy) === null || _b === void 0 ? void 0 : _b.tproxy) {
        strs.push(`#!/bin/bash
set -e

# 清空 XRAY_DIVERT
if [[ \`ip6tables-save | egrep '\\-A PREROUTING \\-p tcp \\-m socket \\-j XRAY6_DIVERT'\` != "" ]];then
    ip6tables -t mangle -D PREROUTING -p tcp -m socket -j XRAY6_DIVERT
fi
if [[ \`ip6tables-save | egrep XRAY6_DIVERT\` != "" ]];then
    ip6tables -t mangle -F XRAY6_DIVERT
    ip6tables -t mangle -X XRAY6_DIVERT
fi

# 清空 XRAY_SELF 
if [[ \`ip6tables-save | egrep '\\-A OUTPUT \\-p tcp \\-j XRAY6_SELF'\` != "" ]];then
    ip6tables -t mangle -D OUTPUT -p tcp -j XRAY6_SELF
fi
if [[ \`ip6tables-save | egrep '\\-A OUTPUT \\-p udp \\-j XRAY6_SELF'\` != "" ]];then
    ip6tables -t mangle -D OUTPUT -p udp -j XRAY6_SELF
fi
if [[ \`ip6tables-save | egrep XRAY6_SELF\` != "" ]];then
    ip6tables -t mangle -F XRAY6_SELF
    ip6tables -t mangle -X XRAY6_SELF
fi

# 清空 XRAY 
if [[ \`ip6tables-save | egrep '\\-A PREROUTING \\-j XRAY6'\` != "" ]];then
    ip6tables -t mangle -D PREROUTING -j XRAY6
fi
if [[ \`ip6tables-save | egrep XRAY6\` != "" ]];then
    ip6tables -t mangle -F XRAY6
    ip6tables -t mangle -X XRAY6
fi

# 刪除 路由規則
if [[ \`ip -6 route list table 106 | egrep 'dev lo'\` != "" ]];then
    ip -6 route del local ::/0 dev lo table 106
fi
# 刪除 路由表
if [[ \`ip -6 rule list  | egrep '0x1 lookup 106'\` != "" ]];then
    ip -6 rule del fwmark 1 table 106
fi
`);
        message = ' turn off tproxy success';
    }
    else {
        strs.push(`#!/bin/bash`);
        const dns = (_e = (_d = (_c = opts.userdata) === null || _c === void 0 ? void 0 : _c.proxy) === null || _d === void 0 ? void 0 : _d.dns6) !== null && _e !== void 0 ? _e : '';
        if (dns != '') {
            strs.push(`ip6tables -t nat -D OUTPUT -p udp -m udp --dport 53 -j DNAT --to-destination ${dns}
ip6tables -t nat -D OUTPUT -p tcp -m tcp --dport 53 -j DNAT --to-destination ${dns}
`);
        }
        strs.push(`set -e

# 清空 XRAY
if ip6tables-save | grep -wq '\\-A PREROUTING \\-p tcp \\-j XRAY6_REDIRECT'; then
    ip6tables -t nat -D PREROUTING -p tcp -j XRAY6_REDIRECT
fi
if ip6tables-save | grep -wq '\\-A OUTPUT \\-p tcp \\-j XRAY6_REDIRECT'; then
    ip6tables -t nat -D OUTPUT -p tcp -j XRAY6_REDIRECT
fi
if ip6tables-save | grep -wq 'XRAY6_REDIRECT'; then
    ip6tables -t nat -F XRAY6_REDIRECT
    ip6tables -t nat -X XRAY6_REDIRECT
fi`);
        message = ' turn off redirect success';
    }
    core.exec({
        name: 'bash',
        args: ['-c', strs.join("\n")],
        log: true,
    });
    console.log(message);
}
function turnOffV4(opts) {
    var _a, _b, _c, _d, _e;
    const strs = [];
    let message;
    if ((_b = (_a = opts.userdata) === null || _a === void 0 ? void 0 : _a.proxy) === null || _b === void 0 ? void 0 : _b.tproxy) {
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
`);
        message = ' turn off tproxy success';
    }
    else {
        strs.push(`#!/bin/bash`);
        const dns = (_e = (_d = (_c = opts.userdata) === null || _c === void 0 ? void 0 : _c.proxy) === null || _d === void 0 ? void 0 : _d.dns) !== null && _e !== void 0 ? _e : '';
        if (dns != '') {
            strs.push(`iptables -t nat -D OUTPUT -p udp -m udp --dport 53 -j DNAT --to-destination ${dns}
iptables -t nat -D OUTPUT -p tcp -m tcp --dport 53 -j DNAT --to-destination ${dns}
`);
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
fi`);
        message = ' turn off redirect success';
    }
    core.exec({
        name: 'bash',
        args: ['-c', strs.join("\n")],
        log: true,
    });
    console.log(message);
}
function turnStateLinux() {
    const str = `#!/bin/bash
set -e
if [ -f /sbin/ip6tables-save ];then
    echo '--- v6 state ---'
    ip6tables-save
    echo ''
fi

if [ -f /sbin/iptables-save ];then
    echo '--- v4 state ---'
    iptables-save
fi
`;
    const { output, error, code } = core.exec({
        name: 'bash',
        args: ['-c', str],
        safe: true,
    });
    if (error) {
        return ` code : ${code}\nerror : ${error}\noutput: ${output}`;
    }
    else {
        return `${output}`;
    }
}
exports.turnStateLinux = turnStateLinux;
