import * as core from "xray/core";
export class BaseProvider {
    getFirewall(): string {
        let s: string
        if (core.os === `linux`) {
            const { output, error, code } = core.exec({
                name: 'iptables-save',
                safe: true,
            })
            if (error) {
                s = ` code : ${code}\nerror : ${error}\noutput: ${output}`
            } else {
                s = `${output}`
            }
        } else {
            s = `not support`
        }
        return `--- ${core.os} ${core.arch} ---

${s}
`
    }
}