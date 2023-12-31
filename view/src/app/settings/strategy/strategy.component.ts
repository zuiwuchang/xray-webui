import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ToastService } from 'src/app/core/toast.service';
import { i18n } from 'src/app/i18n';
import { Closed, State } from 'src/internal/closed';
import { getErrorString } from 'src/internal/error';
import { Delay } from 'src/internal/ui';
import { Strategy } from './strategy';
@Component({
  selector: 'app-strategy',
  templateUrl: './strategy.component.html',
  styleUrls: ['./strategy.component.scss'],
})
export class StrategyComponent extends Closed implements OnInit {
  i18n = i18n
  constructor(private readonly httpClient: HttpClient,
    private readonly translateService: TranslateService,
    private readonly toastService: ToastService,
  ) {
    super()
  }
  state = State.none
  error = ''
  data: Array<Strategy> = []
  private current_: Strategy = {
    id: 0,
    host: '',
    proxyIP: '',
    proxyDomain: '',
    directIP: '',
    directDomain: '',
    blockIP: '',
    blockDomain: '',
  }
  current: Strategy = {
    id: 0,
    host: '',
    proxyIP: '',
    proxyDomain: '',
    directIP: '',
    directDomain: '',
    blockIP: '',
    blockDomain: '',
  }
  ngOnInit(): void {
    this.onClickRefresh()
  }
  onClickRefresh() {
    if (this.state == State.run) {
      return
    }
    this.state = State.run
    const dely = Delay.default()

    this.httpClient.get<Array<Strategy>>('/api/v1/strategy').pipe(this.takeUntil()).subscribe({
      next: (resp) => dely.do(() => {
        if (Array.isArray(resp)) {
          this.data = resp
        }
        this.state = State.ok
      }),
      error: (e) => dely.do(() => {
        console.warn(e)
        this.error = getErrorString(e)
        this.state = State.error
      }),
    })
  }
  name(i: number): string {
    switch (i) {
      case 1:
        return i18n.strategy.default
      case 2:
        return i18n.strategy.global
      case 3:
        return i18n.strategy.public
      case 4:
        return i18n.strategy.proxy
      case 5:
        return i18n.strategy.korea
      case 6:
        return i18n.strategy.direct
      default:
        return 'unknow '
    }
  }
  onClickEdit(data: Strategy) {
    this.current = {
      id: data.id,
      host: data.host,
      proxyIP: data.proxyIP,
      proxyDomain: data.proxyDomain,
      directIP: data.directIP,
      directDomain: data.directDomain,
      blockIP: data.blockIP,
      blockDomain: data.blockDomain,
    }
    this.current_ = data
    this.visible = true
  }
  disabled = false
  visible = false
  get isNotChanged(): boolean {
    const l = this.current
    const r = this.current_
    return l.id == r.id && l.host == r.host &&
      l.proxyIP == r.proxyIP && l.proxyDomain == r.proxyDomain &&
      l.directIP == r.directIP && l.directDomain == r.directDomain &&
      l.blockIP == r.blockIP && l.blockDomain == r.blockDomain
  }
  onClickSubmit() {
    if (this.disabled) {
      return
    }
    this.disabled = true
    const dely = Delay.default()
    const data = this.current
    const node = this.current_
    this.httpClient.post(`/api/v1/strategy/${data.id}`, {
      host: data.host,
      proxyIP: data.proxyIP,
      proxyDomain: data.proxyDomain,
      directIP: data.directIP,
      directDomain: data.directDomain,
      blockIP: data.blockIP,
      blockDomain: data.blockDomain,
    }).pipe(this.takeUntil()).subscribe({
      next: (_) => dely.do(() => {
        node.host = data.host
        node.proxyIP = data.proxyIP
        node.proxyDomain = data.proxyDomain
        node.directIP = data.directIP
        node.directDomain = data.directDomain
        node.blockIP = data.blockIP
        node.blockDomain = data.blockDomain
        this.toastService.add({ severity: 'success', summary: this.translateService.instant(i18n.action.success), detail: this.translateService.instant(i18n.action.updated) });
        this.disabled = false
      }),
      error: (e) => dely.do(() => {
        console.warn(e)

        this.toastService.add({ severity: 'error', summary: this.translateService.instant(i18n.action.error), detail: getErrorString(e) });
        this.disabled = false
      }),
    })
  }
  onClickClose() {
    if (this.disabled) {
      return
    }
    this.visible = false
  }
}
