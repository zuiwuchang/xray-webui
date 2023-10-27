import { Metadata } from "xray/webui";
import { i18n } from "./i18n";

export const socks: Metadata = {
    label: {
        default: 'Socks',
    },
    protocol: 'socks',
    fields: [
        // row
        {
            // 節點名稱
            key: 'name',
            label: i18n.name,
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
            label: i18n.addr,
            ui: 'text',
            class: 'col-12 md:col-6',
            from: {
                from: 'host',
            },
        },
        {
            // 代理服務器端口
            key: 'port',
            label: i18n.port,
            ui: 'number',
            class: 'col-12 md:col-6',
            from: {
                from: 'port',
            },
        },
        // row
        {
            key: 'username',
            label: i18n.username,
            ui: 'text',
            class: 'col-12 md:col-6',
            from: {
                from: 'base64-username',
            },
        },
        {
            key: 'password',
            label: i18n.password,
            ui: 'text',
            class: 'col-12 md:col-6',
            from: {
                from: 'base64-password',
            },
        },
    ],
}