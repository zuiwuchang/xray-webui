"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.vless = void 0;
const i18n_1 = require("./i18n");
exports.vless = {
    protocol: 'vless',
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
            class: 'col-12 md:col-4',
            from: {
                from: 'host',
            },
        },
        {
            // 代理服務器端口
            key: 'port',
            label: i18n_1.i18n.port,
            ui: 'number',
            class: 'col-12 md:col-4',
            from: {
                from: 'port',
            },
        },
        {
            // 傳輸協議
            key: 'protocol',
            label: i18n_1.i18n.protocol,
            ui: 'select-editable',
            value: [
                'tcp', 'ws', 'quic', 'kcp', 'http',
            ],
            class: 'col-12 md:col-4',
            from: {
                from: 'query',
                key: 'type',
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
                from: 'query',
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
                from: 'query',
                key: 'path',
            },
        },
        {
            // 傳輸層加密
            key: 'security',
            label: i18n_1.i18n.security,
            ui: 'select-editable',
            value: [
                'none', 'tls', 'xtls',
            ],
            class: 'col-12 md:col-4',
            from: {
                from: 'query',
                key: 'security',
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
                from: 'username',
            },
        },
        {
            // 用戶 等級
            key: 'userLevel',
            label: i18n_1.i18n.userLevel,
            ui: 'number',
            class: 'col-12 md:col-4',
            from: {
                from: 'query',
                key: 'level',
            },
        },
        {
            // 流控
            key: 'flow',
            label: i18n_1.i18n.flow,
            ui: 'select-editable',
            class: 'col-12 md:col-4',
            value: [
                'xtls-rprx-vision', 'xtls-rprx-vision-udp443',
                'xtls-rprx-origin', 'xtls-rprx-origin-udp443',
                'xtls-rprx-direct', 'xtls-rprx-direct-udp443',
                'xtls-rprx-splice', 'xtls-rprx-splice-udp443',
            ],
            from: {
                from: 'query',
                key: 'flow',
            },
        },
    ],
};
