"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getServers = void 0;
const core_1 = require("xray/core");
function getServers() {
    const servers = [];
    const str = core_1.sessionStorage.getItem('servers');
    if (str) {
        const o = JSON.parse(str);
        if (Array.isArray(o)) {
            for (const v of o) {
                if (v.indexOf(':') < 0) {
                    servers.push(v);
                }
            }
        }
    }
    return servers;
}
exports.getServers = getServers;
