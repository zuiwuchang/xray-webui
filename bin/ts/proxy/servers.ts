import { sessionStorage } from "xray/core"

export function getServers(): Array<string> {
    const servers: Array<string> = []
    const str = sessionStorage.getItem('servers')
    if (str) {
        const o = JSON.parse(str)
        if (Array.isArray(o)) {
            servers.push(...o)
        }
    }
    return servers
}