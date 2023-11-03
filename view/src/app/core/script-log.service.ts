import { Injectable } from '@angular/core';
import { Completer } from '@king011/easyts/es/es2020/async';
import { Observable, ReplaySubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ScriptLogService {
  constructor() {
    this._serve()
  }

  private stream_ = new ReplaySubject<ArrayBuffer | undefined>(128)
  get stream(): Observable<ArrayBuffer | undefined> {
    return this.stream_
  }
  private async _serve() {
    const scheme = window.location.protocol == 'https:' ? 'wss' : 'ws'
    const url = `${scheme}://${window.location.host}/api/v1/scripts/listen`
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
      } catch (e) {
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
