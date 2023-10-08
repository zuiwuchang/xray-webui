
import { environment } from 'src/environments/environment';
/**
 * 一些 ui 狀態切換太快會導致動畫效果很差，Delay用於解決此類問題，它用於延後修改 ui 狀態以保證 ui 能夠有足夠的動畫運行時間
 */
export class Delay {
    /**
     * 
     * @param ms 延遲毫秒
     * @returns 
     */
    static after(ms: number): Delay {
        return new Delay(Date.now() + ms)
    }
    /**
     * 創建一個默認的延遲器
     */
    static default(): Delay {
        // return new Delay(Date.now() + 500)
        return new Delay(Date.now() + (environment.production ? 500 : 0))
    }
    constructor(readonly deadline: number) { }
    /**
     * 確保時間到達 deadline 或 deadline 之後調用函數 f 
     * @param f 
     * @returns 
     */
    async do<T>(f: () => T | Promise<T>): Promise<T> {
        const used = this.deadline - Date.now()
        if (used > 0) {
            await new Promise<void>((resolve) => setTimeout(resolve, used))
            return f()
        } else {
            return f()
        }
    }
}