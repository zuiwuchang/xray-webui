import { Metadata } from "xray/webui";
import { i18n } from "./i18n";

export const trojan: Metadata = {
    protocol: 'trojan',
    fields: [
        [
            {
                key: 'name',
                label: i18n.name,
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
                label: i18n.addr,
                ui: 'text',
                class: '',
                from: {
                    from: 'host',
                },
            },
            {
                key: 'port',
                label: i18n.port,
                ui: 'number',
                class: '',
                from: {
                    from: 'port',
                },
            },
        ],
        [
            {
                key: 'security',
                label: i18n.security,
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
    ],
}