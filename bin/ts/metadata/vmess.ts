import { Metadata } from "xray/webui";
import { i18n } from "./i18n";

export const vmess: Metadata = {
    protocol: 'vmess',
    fields: [
        [
            {
                key: 'name',
                label: i18n.name,
                ui: 'text',
                class: '',
                from: {
                    from: 'json',
                    key: 'ps',
                },
                onlyUI: true,
            },
        ],
        [
            {
                key: 'address',
                label: i18n.addr,
                ui: 'text',
                class: '',
                from: {
                    from: 'json',
                    key: 'add',
                },
            },
            {
                key: 'port',
                label: i18n.port,
                ui: 'number',
                class: '',
                from: {
                    from: 'json',
                    key: 'port',
                },
            },
            {
                key: 'protocol',
                label: i18n.protocol,
                ui: 'select-editable',
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
                label: i18n.security,
                ui: 'select-editable',
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
}