"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.vmess = void 0;
const i18n_1 = require("./i18n");
exports.vmess = {
    protocol: 'vmess',
    fields: [
        [
            {
                key: 'name',
                label: i18n_1.i18n.name,
                ui: 'text',
                class: '',
                from: {
                    from: 'json',
                    key: 'ps',
                },
            },
        ],
        [
            {
                key: 'address',
                label: i18n_1.i18n.addr,
                ui: 'text',
                class: '',
                from: {
                    from: 'json',
                    key: 'add',
                },
            },
            {
                key: 'port',
                label: i18n_1.i18n.port,
                ui: 'number',
                class: '',
                from: {
                    from: 'json',
                    key: 'port',
                },
            },
            {
                key: 'protocol',
                label: i18n_1.i18n.protocol,
                ui: 'select',
                value: [
                    'tcp', 'ws', 'quic', 'kcp', 'http',
                ],
                class: '',
                from: {
                    from: 'json',
                    key: 'net',
                },
            },
        ],
        [
            {
                key: 'security',
                label: i18n_1.i18n.security,
                ui: 'select',
                value: [
                    'none', 'tls', 'xtls',
                ],
                class: '',
                from: {
                    from: 'json',
                    key: 'tls',
                },
            },
        ],
    ],
};
