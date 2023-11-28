"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Rule = void 0;
/**
 * 代理規則
 */
class Rule {
    constructor() {
        this.domain = [];
        this.ip = [];
        this.domain_ = new Set();
        this.ip_ = new Set();
    }
    pushDomain(a) {
        this._push(a);
        return this;
    }
    pushIP(a) {
        this._push(a, true);
        return this;
    }
    _push(a, ip) {
        if (!Array.isArray(a) || a.length == 0) {
            return;
        }
        const keys = ip ? this.ip_ : this.domain_;
        const vals = ip ? this.ip : this.domain;
        for (const s of a) {
            if (typeof s !== "string") {
                continue;
            }
            const val = s.trim();
            if (keys.has(val)) {
                continue;
            }
            keys.add(val);
            vals.push(val);
        }
    }
    /**
     * 如果設定有效返回 true 否則返回 false
     */
    isValid() {
        return this.domain.length != 0 || this.ip.length != 0;
    }
    /**
     * 如果域名存在 返回 true 否則返回 false
     */
    hasDomain(s) {
        return this.domain_.has(s);
    }
    /**
     * 如果 IP 存在 返回 true 否則返回 false
     */
    hasIP(s) {
        return this.ip_.has(s);
    }
}
exports.Rule = Rule;
