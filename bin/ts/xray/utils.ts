import * as core from "xray/core";
/**
 * 如果系統運行在 linux 平臺，則返回 true，否則返回 false
 */
export function isLinux(): boolean {
    return core.os == 'linux'
}
/**
 * 如果 port 是一個合法的端口號，則返回 true，否則返回 false
 */
export function isPort(port: any): port is number {
    return Number.isSafeInteger(port) && port > 0 && port < 65535
}
export function getUint(v: any, def?: number): number {
    if (Number.isSafeInteger(v)) {
        if (v < 0) {
            throw new Error(`invalid uint: ${v}`)
        }
        return v
    }
    if (v === undefined || v === null || v === '') {
        if (Number.isSafeInteger(def) && def! >= 0) {
            return def!
        }
        throw new Error(`invalid uint: ${v}`)
    }
    const val = parseInt(v)
    if (Number.isSafeInteger(val) && val >= 0) {
        return val
    }
    throw new Error(`invalid uint: ${v}`)
}
export function getInt(v: any, def?: number): number {
    if (Number.isSafeInteger(v)) {
        return v
    }
    if (v === undefined || v === null || v === '') {
        if (Number.isSafeInteger(def)) {
            return def!
        }
        throw new Error(`invalid int: ${v}`)
    }
    const val = parseInt(v)
    if (Number.isSafeInteger(val)) {
        return val
    }
    throw new Error(`invalid int: ${v}`)
}
export function getPort(v: any, def?: number): number {
    if (Number.isSafeInteger(v)) {
        if (!isPort(v)) {
            throw new Error(`invalid port: ${v}`)
        }
        return v
    }
    if (v === undefined || v === null || v === '') {
        if (Number.isSafeInteger(def)) {
            return def!
        }
        throw new Error(`invalid port: ${v}`)
    }
    const port = parseInt(v)
    if (isPort(port)) {
        return port
    }
    throw new Error(`invalid port: ${v}`)
}