"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.vmess = void 0;
const i18n_1 = require("./i18n");
exports.vmess = {
    label: {
        default: 'VMess',
    },
    protocol: 'vmess',
    fields: [
        // row
        {
            key: 'name',
            label: i18n_1.i18n.name,
            ui: 'text',
            class: 'col-12',
            from: {
                from: 'json',
                key: 'ps',
            },
            onlyUI: true,
        },
        // row
        {
            key: 'address',
            label: i18n_1.i18n.addr,
            ui: 'text',
            class: 'col-12 md:col-4',
            from: {
                from: 'json',
                key: 'add',
            },
        },
        {
            key: 'port',
            label: i18n_1.i18n.port,
            ui: 'number',
            class: 'col-12 md:col-4',
            from: {
                from: 'json',
                key: 'port',
            },
        },
        {
            key: 'protocol',
            label: i18n_1.i18n.protocol,
            ui: 'select-editable',
            value: [
                'tcp', 'ws', 'httpupgrade', 'xhttp', 'quic', 'kcp', 'http', 'grpc', 'http-grpc',
            ],
            class: 'col-12 md:col-4',
            from: {
                from: 'json',
                key: 'net',
            },
        },
        // row
        {
            // 主機名稱
            key: 'host',
            label: i18n_1.i18n.host,
            ui: 'text',
            class: 'col-12 md:col-4',
            from: {
                from: 'json',
                key: 'host',
            },
        },
        {
            // url path
            key: 'path',
            label: i18n_1.i18n.path,
            ui: 'text',
            class: 'col-12 md:col-4',
            from: {
                from: 'json',
                key: 'path',
            },
        },
        {
            // 傳輸層加密
            key: 'security',
            label: i18n_1.i18n.security,
            ui: 'select-editable',
            value: [
                '', 'tls', 'reality',
            ],
            class: 'col-12 md:col-4',
            from: {
                from: 'json',
                key: 'tls',
            },
        },
        // row
        {
            // 用戶 uuid
            key: 'userID',
            label: i18n_1.i18n.userID,
            ui: 'text',
            class: 'col-12 md:col-4',
            from: {
                from: 'json',
                key: 'id',
            },
        },
        {
            // 用戶 等級
            key: 'userLevel',
            label: i18n_1.i18n.userLevel,
            ui: 'number',
            class: 'col-12 md:col-4',
            from: {
                from: 'json',
                key: 'level',
            },
        },
        {
            // 加密方式
            key: 'encryption',
            label: i18n_1.i18n.encryption,
            ui: 'select-editable',
            value: ['auto', 'aes-128-gcm', 'chacha20-poly1305', 'none', 'zero'],
            class: 'col-12 md:col-4',
            from: {
                from: 'json',
                key: 'scy',
            },
        },
        // row
        {
            key: 'alpn',
            label: i18n_1.i18n.alpn,
            ui: 'select-editable',
            value: ['', 'h3', 'h2', 'http/1.1', 'h3,h2,http/1.1', 'h3,h2', 'h2,http/1.1'],
            class: 'col-12 md:col-4',
            from: {
                from: 'json',
                key: 'alpn',
            },
        },
        {
            key: 'fingerprint',
            label: i18n_1.i18n.fingerprint,
            ui: 'select-editable',
            value: ['', 'chrome', 'firefox', 'safari', 'ios', 'android', 'edge', '360', 'qq', 'random', 'randomized'],
            class: 'col-12 md:col-4',
            from: {
                from: 'json',
                key: 'fp',
            },
        },
        {
            key: 'mode',
            label: i18n_1.i18n.grpcMode,
            ui: 'select-editable',
            value: [
                // grpc
                '',
                'gun',
                'multi',
                // xhttp
                'auto',
                'packet-up',
                'stream-up',
                'stream-one',
            ],
            class: 'col-12 md:col-4',
            from: {
                from: 'json',
                key: 'type',
            },
        },
        // row
        {
            key: 'alterID',
            label: i18n_1.i18n.alterID,
            ui: 'number',
            class: 'col-12 md:col-4',
            from: {
                from: 'json',
                key: 'aid',
            },
        },
        //
        {
            key: 'extra',
            label: i18n_1.i18n.extra,
            ui: 'text',
            class: 'col-12',
            from: {
                from: 'query',
                key: 'extra',
            },
        },
    ],
};
