import { Component } from "@angular/core";
import { BehaviorSubject, filter, MonoTypeOperatorFunction, Observable, takeUntil } from "rxjs";

export enum State {
    none = 'none',
    error = 'error',
    run = 'run',
    ok = 'ok',
}
@Component({
    selector: 'app-closed',
    template: '',
})
export class Closed {
    private closed_ = new BehaviorSubject<boolean>(false)
    protected get closed(): Observable<boolean> {
        return this.closed_.pipe(filter((v) => v))
    }
    takeUntil<T>(): MonoTypeOperatorFunction<T> {
        return takeUntil(this.closed_.pipe(filter((v) => v)))
    }
    get isClosed(): boolean {
        return this.closed_.value
    }
    get isNotClosed(): boolean {
        return !this.closed_.value
    }
    ngOnDestroy(): void {
        this.closed_.next(true)
    }

}