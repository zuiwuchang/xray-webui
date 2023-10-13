
export interface Strategy {
    // 供腳本參考的 策略值 ，腳本應該依據此值生成 xray 的配置
    //
    // * 1 默認的代理規則
    // * 2 全域代理
    // * 3 略過區域網路的代理(僅對公網ip使用代理)
    // * 4 略過區域網路和西朝鮮的代理
    // * 5 直連優先 (僅對非西朝鮮公網使用代理)
    // * 6 直接連接
    id: number

    // 靜態 ip 列表
    // baidu.com 127.0.0.1
    // dns.google 8.8.8.8 8.8.4.4
    host: string

    // 這些 ip 使用代理
    proxyIP: string
    // 這些 域名 使用代理
    proxyDomain: string

    // 這些 ip 直連
    directIP: string
    // 這些 域名 直連
    directDomain: string

    // 這些 ip 阻止訪問
    blockIP: string
    // 這些 域名 阻止訪問
    blockDomain: string
}