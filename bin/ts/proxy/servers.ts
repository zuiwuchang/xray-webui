import { sessionStorage } from "xray/core"

export function getServers(): Array<string> {
    const servers: Array<string> = []
    const str = sessionStorage.getItem('servers')
    if (str) {
        const o: Array<string> = JSON.parse(str)
        if (Array.isArray(o)) {
            for (const v of o) {
                if (v.indexOf(':') < 0) {
                    servers.push(v)
                }
            }
        }
    }
    return servers
}