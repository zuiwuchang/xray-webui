import { HttpClient } from '@angular/common/http';
import { Component, VERSION, OnInit } from '@angular/core';
import { interval, timer } from 'rxjs';
import { i18n } from 'src/app/i18n';
import { Closed } from 'src/internal/closed';

interface VersionResponse {
  // 服務平臺
  platform: string
  // 程式版本
  version: string
  // git 提交號
  commit: string
  // 編譯日期 unix
  date: string
  // 數據庫版本
  db: number
}
interface StartAtResponse {
  result: string
}

@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss']
})
export class AboutComponent extends Closed implements OnInit {
  i18n = i18n
  readonly angular = VERSION.full
  version?: VersionResponse
  LICENSE = ''
  rdpartylicenses = ''
  started?: string
  startat?: string
  constructor(private readonly httpClient: HttpClient) {
    super()
  }
  ngOnInit(): void {
    const httpClient = this.httpClient

    httpClient.get<VersionResponse>('/api/v1/system/version').pipe(this.takeUntil()).subscribe({
      next: (resp) => {
        this.version = resp
      },
      error: (e) => {
        console.warn(e)
      },
    })
    httpClient.get<StartAtResponse>('/api/v1/system/start_at').pipe(this.takeUntil()).subscribe({
      next: (resp) => {
        const startAt = parseInt(resp.result)
        if (Number.isSafeInteger(startAt)) {
          this.startat = new Date(startAt * 1000).toLocaleString()
          timer(0, 1000).pipe(this.takeUntil()).subscribe({
            next: () => {
              let used = Math.floor(Date.now() / 1000)
              if (used > startAt) {
                used -= startAt
              } else {
                used = 0
              }
              const strs: Array<string> = []
              if (used >= 86400) {
                strs.push(`${Math.floor(used / 86400)} days`)
                used %= 86400
              }
              if (used >= 3600) {
                strs.push(`${Math.floor(used / 3600)} hours`)
                used %= 3600
              }
              if (used >= 60) {
                strs.push(`${Math.floor(used / 60)} minutes`)
                used %= 60
              }
              if (used >= 0) {
                strs.push(`${used} seconds`)
              }
              this.started = strs.join(' ')
            },
          })
        }
      },
      error: (e) => {
        console.warn(e)
      },
    })
    httpClient.get('/LICENSE', {
      responseType: 'arraybuffer',
    }).pipe(this.takeUntil()).subscribe({
      next: (b) => {
        this.LICENSE = new TextDecoder().decode(b)
      },
      error: (e) => {
        console.warn(e)
      }
    })
    httpClient.get('/3rdpartylicenses.txt', {
      responseType: 'arraybuffer',
    }).pipe(this.takeUntil()).subscribe({
      next: (b) => {
        this.rdpartylicenses = new TextDecoder().decode(b)
      },
      error: (e) => {
        console.warn(e)
      }
    })
  }
}
