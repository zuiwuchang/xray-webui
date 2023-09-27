export function getErrorString(o: any): string {
    if (typeof o === "object") {
        if (o.error) {
            const e = o.error
            if (typeof e === "object") {
                if (typeof e.message) {
                    return `${e.message}`
                }
            }
            return `${e}`
        } else if (o.message) {
            return `${o.message}`
        }
    }
    return `${o}`
}