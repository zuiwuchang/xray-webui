/**
 * 提供了各種功能函數供 腳本調用
 */
declare module 'xray/core' {
    /**
     * 返回 GOOS
     */
    export const os: string
    /**
     * 返回 GOARCH
     */
    export const arch: string
    /**
     * 返回 xray-webui 版號
     */
    export const version: string

}
declare module 'xray/webui' {
    /**
     * 爲網頁 ui 提供了各種功能的具體實現
     */
    export interface Provider {

    }
}