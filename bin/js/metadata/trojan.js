"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.trojan = void 0;
const i18n_1 = require("./i18n");
exports.trojan = {
    protocol: 'trojan',
    fields: [
        {
            key: 'name',
            label: i18n_1.i18n.name,
            ui: 'text',
            class: 'col-12',
            from: {
                from: 'fragment',
            },
            onlyUI: true,
        },
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
            key: 'security',
            label: i18n_1.i18n.security,
            ui: 'select',
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
};
