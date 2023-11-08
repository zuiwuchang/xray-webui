"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateLog = void 0;
function generateLog(opts) {
    var _a, _b, _c, _d, _e;
    if (opts.environment.port) {
        return undefined;
    }
    return {
        loglevel: (_c = (_b = (_a = opts.userdata) === null || _a === void 0 ? void 0 : _a.log) === null || _b === void 0 ? void 0 : _b.level) !== null && _c !== void 0 ? _c : 'warning',
        dnsLog: ((_e = (_d = opts.userdata) === null || _d === void 0 ? void 0 : _d.log) === null || _e === void 0 ? void 0 : _e.dns) ? true : false,
    };
}
exports.generateLog = generateLog;
