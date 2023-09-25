import { Component, OnDestroy } from "@angular/core";
import { Observable, Subject, takeUntil } from 'rxjs';
export class ComponentClosedError extends Error { }

/**
 * 爲所有組件提供了一些 通用的功能
 */
@Component({
    template: '',
})
export class BaseComponent implements OnDestroy {
    constructor() {

    }
    private closed_ = false
    /**
     * 如果組件已關閉 返回 true
     */
    get isClosed() { return this.closed_ }
    /**
     * 如果組件沒有關閉 返回 true
     */
    get isNotClosed() { return !this.closed_ }
    /**
     * 如果組件已關閉 拋出異常
     */
    checkClosed() {
        if (this.closed_) {
            throw new ComponentClosedError(`${this.constructor.name} alreay closed`)
        }
    }

    private subjectClosed_?: Subject<number>
    /**
     * 在頁面關閉後發生信號
     */
    get observableClosed(): Observable<number> {
        this.checkClosed()

        let sub = this.subjectClosed_
        if (!sub) {
            sub = new Subject<number>()
            this.subjectClosed_ = sub
        }
        return sub
    }
    ngOnDestroy(): void {
        this.closed_ = true
        const sub = this.subjectClosed_
        if (sub) {
            sub.next(0)
        }
    }
    takeUntilClosed<T>() {
        return takeUntil<T>(this.observableClosed)
    }

    /** 
     * 頁面是否被禁用
     * @virtual
    */
    protected disabled_ = false
    /**
     * 如果頁面被禁用 返回 true
     * @virtual
     */
    get disabled(): boolean { return this.disabled_ }
    /**
     * 設置頁面禁用狀態
     * @virtual
     */
    set disabled(ok: boolean) { this.disabled_ = ok }

    /**
     * 如果頁面被禁用 返回 true
     */
    get isDisabled() { return this.disabled }
    /**
     * 如果頁面沒有被禁用 返回 true
     */
    get isEnabled() { return !this.disabled }
    /**
     * 禁用頁面
     */
    disable() { this.disabled = true }
    /**
     * 啓用頁面
     */
    enable() { this.disabled = false }
}

