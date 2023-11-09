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
exports.getPort = exports.getInt = exports.getUint = exports.isPort = exports.isWindows = exports.isLinux = void 0;
const core = __importStar(require("xray/core"));
/**
 * 如果系統運行在 linux 平臺，則返回 true，否則返回 false
 */
function isLinux() {
    return core.os == 'linux';
}
exports.isLinux = isLinux;
/**
 * 如果系統運行在 windows 平臺，則返回 true，否則返回 false
 */
function isWindows() {
    return core.os == 'windows';
}
exports.isWindows = isWindows;
/**
 * 如果 port 是一個合法的端口號，則返回 true，否則返回 false
 */
function isPort(port) {
    return Number.isSafeInteger(port) && port > 0 && port < 65535;
}
exports.isPort = isPort;
function getUint(v, def) {
    if (Number.isSafeInteger(v)) {
        if (v < 0) {
            throw new Error(`invalid uint: ${v}`);
        }
        return v;
    }
    if (v === undefined || v === null || v === '') {
        if (Number.isSafeInteger(def) && def >= 0) {
            return def;
        }
        throw new Error(`invalid uint: ${v}`);
    }
    const val = parseInt(v);
    if (Number.isSafeInteger(val) && val >= 0) {
        return val;
    }
    throw new Error(`invalid uint: ${v}`);
}
exports.getUint = getUint;
function getInt(v, def) {
    if (Number.isSafeInteger(v)) {
        return v;
    }
    if (v === undefined || v === null || v === '') {
        if (Number.isSafeInteger(def)) {
            return def;
        }
        throw new Error(`invalid int: ${v}`);
    }
    const val = parseInt(v);
    if (Number.isSafeInteger(val)) {
        return val;
    }
    throw new Error(`invalid int: ${v}`);
}
exports.getInt = getInt;
function getPort(v, def) {
    if (Number.isSafeInteger(v)) {
        if (!isPort(v)) {
            throw new Error(`invalid port: ${v}`);
        }
        return v;
    }
    if (v === undefined || v === null || v === '') {
        if (Number.isSafeInteger(def)) {
            return def;
        }
        throw new Error(`invalid port: ${v}`);
    }
    const port = parseInt(v);
    if (isPort(port)) {
        return port;
    }
    throw new Error(`invalid port: ${v}`);
}
exports.getPort = getPort;
