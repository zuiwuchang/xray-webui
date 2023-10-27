/**
 * 代理規則
 */
export class Rule {
    domain: Array<string> = []
    ip: Array<string> = []
    private domain_ = new Set<string>()
    private ip_ = new Set<string>()

    pushDomain(a: Array<string>) {
        this._push(a)
        return this
    }
    pushIP(a: Array<string>) {
        this._push(a, true)
        return this
    }
    private _push(a: Array<string>, ip?: boolean) {
        if (!Array.isArray(a) || a.length == 0) {
            return
        }
        const keys = ip ? this.ip_ : this.domain_
        const vals = ip ? this.ip : this.domain
        for (const s of a) {
            if (typeof s !== "string") {
                continue
            }
            const val = s.trim()
            if (keys.has(val)) {
                continue
            }
            keys.add(val)
            vals.push(val)
        }
    }
    /**
     * 如果設定有效返回 true 否則返回 false
     */
    isValid(): boolean {
        return this.domain.length != 0 || this.ip.length != 0
    }
}