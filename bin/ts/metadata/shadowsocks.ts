import { Metadata } from "xray/webui";
import { i18n } from "./i18n";

export const shadowsocks: Metadata = {
    label: {
        default: 'Shadowsocks',
    },
    protocol: 'ss',
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
            key: 'password',
            label: i18n.password,
            ui: 'text',
            class: 'col-12 md:col-6',
            from: {
                from: 'base64-password',
            },
        },
        {
            key: 'encryption',
            label: i18n.encryption,
            ui: 'select-editable',
            value: [
                '2022-blake3-aes-128-gcm', '2022-blake3-aes-256-gcm', '2022-blake3-chacha20-poly1305',
                'aes-256-gcm', 'aes-128-gcm',
                'chacha20-poly1305', 'chacha20-ietf-poly1305',
                'xchacha20-poly1305', 'xchacha20-ietf-poly1305',
                'none', 'plain',
            ],
            class: 'col-12 md:col-6',
            from: {
                from: 'base64-username',
            },
        },
    ],
}