import { Metadata } from "xray/webui";
import { i18n } from "./i18n";

export const trojan: Metadata = {
    label: {
        default: 'Trojan',
    },
    protocol: 'trojan',
    fields: [
        // row
        {
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
            key: 'address',
            label: i18n.addr,
            ui: 'text',
            class: 'col-12 md:col-4',
            from: {
                from: 'host',
            },
        },
        {
            key: 'port',
            label: i18n.port,
            ui: 'number',
            class: 'col-12 md:col-4',
            from: {
                from: 'port',
            },
        },
        {
            // 傳輸協議
            key: 'protocol',
            label: i18n.protocol,
            ui: 'select-editable',
            value: [
                'tcp', 'grpc',
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
            label: i18n.host,
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
            label: i18n.path,
            ui: 'text',
            class: 'col-12 md:col-4',
            from: {
                from: 'query',
                key: 'path',
            },
            alias: [
                {
                    key: 'protocol',
                    value: 'grpc',
                    from: {
                        from: 'query',
                        key: 'serviceName',
                    }
                }
            ],
        },
        {
            // 傳輸層加密
            key: 'security',
            label: i18n.security,
            ui: 'select-editable',
            value: [
                'tls', 'reality',
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
            label: i18n.userID,
            ui: 'text',
            class: 'col-12 md:col-4',
            from: {
                from: 'username',
            },
        },
        {
            // 流控
            key: 'flow',
            label: i18n.flow,
            ui: 'select-editable',
            class: 'col-12 md:col-4',
            value: [
                'none', 'xtls-rprx-vision', 'xtls-rprx-vision-udp443'
            ],
            from: {
                from: 'query',
                key: 'flow',
            },
        },
        {
            ui: 'placeholder',
            class: 'p-0 col-fixed md:col-4',
        },
        // row
        {
            key: 'alpn',
            label: i18n.alpn,
            ui: 'select-editable',
            value: ['', 'h3', 'h2', 'http/1.1', 'h3,h2,http/1.1', 'h3,h2', 'h2,http/1.1'],
            class: 'col-12 md:col-4',
            from: {
                from: 'query',
                key: 'alpn',
            },
        },
        {
            key: 'fingerprint',
            label: i18n.fingerprint,
            ui: 'select-editable',
            value: ['', 'chrome', 'firefox', 'safari', 'ios', 'android', 'edge', '360', 'qq', 'random', 'randomized'],
            class: 'col-12 md:col-4',
            from: {
                from: 'query',
                key: 'fp',
            },
        },
        {
            key: 'mode',
            label: i18n.grpcMode,
            ui: 'select',
            value: ['', 'gun', 'multi'],
            class: 'col-12 md:col-4',
            from: {
                from: 'query',
                key: 'mode',
            },
        },
    ],
}

export interface TrojanFileds {
    /**
     * 代理服務器地址
     */
    address?: string
    /**
     * 代理服務器端口
     */
    port?: string
    /**
     * 傳輸協議
     */
    protocol?: string
    /**
     * 主機名稱
     */
    host?: string
    /**
     * url path，只在 grpc 時有效
     */
    path?: string
    /**
     * 傳輸層加密
     */
    security?: string
    /**
     * 用戶 uuid
     */
    userID?: string
    /**
     * 流控制
     */
    flow?: string

    alpn?: string
    fingerprint?: string
    /**
     * grpc 模式
     */
    mode?: string
}