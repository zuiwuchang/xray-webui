"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.socks = void 0;
const i18n_1 = require("./i18n");
exports.socks = {
    label: {
        default: 'Socks',
    },
    protocol: 'socks',
    fields: [
        // row
        {
            // 節點名稱
            key: 'name',
            label: i18n_1.i18n.name,
            ui: 'text',
            class: 'col-12',
            from: {
                from: 'fragment',
            },
            onlyUI: true,
        },
        // row
        {
            // 代理服務器地址
            key: 'address',
            label: i18n_1.i18n.addr,
            ui: 'text',
            class: 'col-12 md:col-6',
            from: {
                from: 'host',
            },
        },
        {
            // 代理服務器端口
            key: 'port',
            label: i18n_1.i18n.port,
            ui: 'number',
            class: 'col-12 md:col-6',
            from: {
                from: 'port',
            },
        },
        // row
        {
            key: 'username',
            label: i18n_1.i18n.username,
            ui: 'text',
            class: 'col-12 md:col-6',
            from: {
                from: 'base64-username',
            },
        },
        {
            key: 'password',
            label: i18n_1.i18n.password,
            ui: 'text',
            class: 'col-12 md:col-6',
            from: {
                from: 'base64-password',
            },
        },
    ],
};
