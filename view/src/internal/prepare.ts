export interface Step<T> {
    data?: T
    err?: any
    do(): Promise<T>
}
// 用於在頁面開始前爲頁面準備好資源
export class Prepare {
    constructor(readonly steps: Array<Step<any>>) { }
    do(): Promise<void> {
        const steps = this.steps
        if (steps.length == 0) {
            return Promise.resolve()
        }
        return new Promise((resolve, reject) => {
            let err: any
            let hasErr = false
            let wait = 0
            for (const step of steps) {
                wait++
                step.do().then((data) => {
                    step.data = data
                }).catch((e) => {
                    hasErr = true
                    err = e
                    step.err = e
                }).finally(() => {
                    wait--
                    if (wait == 0) {
                        if (hasErr) {
                            reject(err)
                        } else {
                            resolve()
                        }
                    }
                })
            }
        })
    }
}