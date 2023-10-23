"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.vless = void 0;
const i18n_1 = require("./i18n");
exports.vless = {
    protocol: 'vless',
    fields: [
        [
            {
                key: 'name',
                label: i18n_1.i18n.name,
                ui: 'text',
                class: '',
                from: {
                    from: 'fragment',
                    enc: 'escape',
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
                    from: 'host',
                },
            },
            {
                key: 'port',
                label: i18n_1.i18n.port,
                ui: 'number',
                class: '',
                from: {
                    from: 'port',
                },
            },
            {
                key: 'protocol',
                label: i18n_1.i18n.protocol,
                ui: 'select-editable',
                value: [
                    'tcp', 'ws', 'quic', 'kcp', 'http',
                ],
                class: '',
                from: {
                    from: 'query',
                    key: 'type',
                },
            },
        ],
        [
            {
                key: 'security',
                label: i18n_1.i18n.security,
                ui: 'select-editable',
                value: [
                    'none', 'tls', 'xtls',
                ],
                class: '',
                from: {
                    from: 'query',
                    key: 'security',
                },
            },
        ],
    ],
};
