"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateLog = void 0;
function generateLog(opts) {
    if (opts.environment.port) {
        return undefined;
    }
    return {
        loglevel: 'warning',
    };
}
exports.generateLog = generateLog;
