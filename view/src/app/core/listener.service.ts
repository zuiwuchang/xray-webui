import { Injectable } from '@angular/core';
import { Completer } from '@king011/easyts/es/es2020/async';
import { BehaviorSubject, Observable, ReplaySubject } from 'rxjs';
interface Message {
  what: number
  data?: Last
}
export interface Last {
  id: string
  name: string
  strategy: number
  subscription: string
  url: string
}
@Injectable({
  providedIn: 'root'
})
export class ListenerService {
  constructor() {
    this._serve()
  }
  private last_ = new BehaviorSubject<Last | undefined>(undefined)
  get last(): Observable<Last | undefined> {
    return this.last_
  }
  storeLast?: Last
  private stream_ = new ReplaySubject<ArrayBuffer | undefined>(128)
  get stream(): Observable<ArrayBuffer | undefined> {
    return this.stream_
  }
  private async _serve() {
    const scheme = window.location.protocol == 'https:' ? 'wss' : 'ws'
    const url = `${scheme}://${window.location.host}/api/v1/proxy/listen`
    let tick = 0
    setInterval(() => {
      tick++
      if (tick >= 4) {
        tick = 0
        const ws = this.ws_
        if (ws) {
          ws.send('{"what":-1}')
        }
      }
    }, 1000 * 10)
    while (true) {
      try {
        const closed = await this._connect(url, (data) => {
          tick = 0
          if (typeof data === "string") {
            console.log('listener recv:', data)
            const o: Message = JSON.parse(data)
            switch (o.what) {
              case 1:
                if (o.data) {
                  this.storeLast = o.data
                }
                this.last_.next(o.data)
                break
              case 2:
                if (o.data) {
                  this.storeLast = o.data
                }
                break
              default:
                console.warn('unknow message', data)
                break
            }
          } else {
            const view = new DataView(data)
            const id = view.getBigUint64(0, true)
            const flag = view.getBigUint64(8, true)
            if (this.flag_ == flag) {
              const o = this.id_
              if (o && id <= o) {
                return
              }
            } else {
              this.flag_ = flag
            }
            this.id_ = id
            this.stream_.next(data)
          }
        })
        tick = 0
        await closed.promise
        this.last_.next(undefined)
      } catch (e) {
        this.last_.next(undefined)
        console.warn('connect listener fail', e)
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
    }
  }
  private flag_?: bigint
  private id_?: bigint

  private ws_?: WebSocket
  private _connect(url: string, onmessage: (data: string | ArrayBuffer) => void): Promise<Completer<void>> {
    const ws = new WebSocket(url)
    ws.binaryType = "arraybuffer"
    this.ws_ = ws
    return new Promise<Completer<void>>((resolve, reject) => {
      let closed: Completer<void> | undefined
      ws.onclose = () => {
        ws.close()
        if (ws == this.ws_) {
          this.ws_ = undefined
          if (closed) {
            closed.resolve()
          } else {
            reject(new Error('websocket closed'))
          }
        }
      }
      ws.onerror = () => {
        ws.close()
        if (ws == this.ws_) {
          this.ws_ = undefined
          if (closed) {
            closed.resolve()
          } else {
            reject(new Error('websocket closed'))
          }
        }
      }
      ws.onopen = () => {
        try {
          closed = new Completer<void>()
          ws.onmessage = (data) => {
            if (ws == this.ws_) {
              onmessage(data.data)
            }
          }
        } catch (e) {
          reject(e)
          return
        }
        resolve(closed)
      }
    })
  }
  clearLog() {
    for (let i = 0; i < 128; i++) {
      this.stream_.next(undefined)
    }

  }
}
