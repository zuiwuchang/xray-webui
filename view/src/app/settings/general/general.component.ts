import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { first, interval } from 'rxjs';
import { Deactivate } from 'src/app/core/guard/save.guard';
import { ToastService } from 'src/app/core/toast.service';
import { i18n } from 'src/app/i18n';
import { Closed, State } from 'src/internal/closed';
import { getErrorString } from 'src/internal/error';
import { Delay } from 'src/internal/ui';
import { General } from './general';
@Component({
  selector: 'app-general',
  templateUrl: './general.component.html',
  styleUrls: ['./general.component.scss'],
})
export class GeneralComponent extends Closed implements OnInit, Deactivate {
  i18n = i18n
  constructor(private readonly httpClient: HttpClient,
    private readonly translateService: TranslateService,
    private readonly toastService: ToastService,
  ) {
    super()
    translateService.onLangChange.pipe(this.takeUntil()).subscribe({
      next: () => {
        this._updateStrategys()
      },
    })
  }
  state = State.none
  error = ''
  private data_: General = {
    url: '',
    run: false,
    firewall: false,
    strategy: 1,
    userdata: '',
  }
  private default_?: General
  data: General = {
    url: '',
    run: false,
    firewall: false,
    strategy: 1,
    userdata: '',
  }
  ngOnInit(): void {
    this._updateStrategys()
    this.onClickRefresh()
  }
  onClickRefresh() {
    if (this.state == State.run) {
      return
    }
    this.state = State.run
    const dely = Delay.default()

    this.httpClient.get<General>('/api/v1/settings/general').pipe(this.takeUntil()).subscribe({
      next: (resp) => dely.do(() => {
        this.data = resp
        this.data_ = {
          url: resp.url,
          run: resp.run,
          firewall: resp.firewall,
          strategy: resp.strategy,
          userdata: resp.userdata,
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
  disabled = false
  get isNotChanged() {
    const l = this.data
    const r = this.data_
    return l.firewall == r.firewall && l.run == r.run &&
      l.strategy == r.strategy &&
      l.userdata == r.userdata
  }
  onClickSubmit() {
    if (this.disabled) {
      return
    }
    this.disabled = true
    const dely = Delay.default()
    const data = this.data
    this.httpClient.post('/api/v1/settings/general', data).pipe(this.takeUntil()).subscribe({
      next: (_) => dely.do(() => {
        const old = this.data_
        old.url = data.url
        old.run = data.run
        old.firewall = data.firewall
        old.strategy = data.strategy
        old.userdata = data.userdata
        this.toastService.add({
          severity: 'success', summary: this.translateService.instant(i18n.action.success), detail: this.translateService.instant(i18n.action.updated)
        })
        this.disabled = false
      }),
      error: (e) => dely.do(() => {
        console.warn(e)
        this.toastService.add({
          severity: 'error', summary: this.translateService.instant(i18n.action.error), detail: getErrorString(e),
        })
        this.disabled = false
      }),
    })
  }
  onClickReset() {
    if (this.disabled) {
      return
    }
    const val = this.default_
    if (!val) {
      return
    }
    const data = this.data
    data.firewall = val.firewall
    data.run = val.run
    data.strategy = val.strategy
    data.url = val.url
    data.userdata = val.userdata
  }
  get canReset(): boolean {
    if (this.disabled) {
      return false
    }
    const val = this.default_
    if (!val) {
      this._default()
      return false
    }
    const data = this.data
    return val.run != data.run || val.firewall != data.firewall || val.strategy != data.strategy || val.url != data.url || val.userdata != data.userdata
  }
  private _getDefault = false
  private _default() {
    if (this._getDefault) {
      return
    }
    this._getDefault = true
    this.httpClient.get<General>('/api/v1/settings/default').pipe(this.takeUntil()).subscribe({
      next: (v) => {
        this.default_ = v
        this._getDefault = false
      },
      error: (e) => {
        console.warn(e)
        interval(1000).pipe(this.takeUntil(), first()).subscribe(() => {
          this._getDefault = false
          this._default()
        })
      },
    })
  }
  get canDeactivate(): boolean {
    return !this.disabled
  }
  notDeactivate() {
    this.toastService.add({
      severity: 'warn', summary: this.translateService.instant(i18n.action.warn), detail: this.translateService.instant(i18n.action.waitDataSave)
    })
  }
  strategys: Array<{ name: string, value: number | string }> = []

  private _updateStrategys() {
    const translate = this.translateService
    this.strategys = [
      {
        name: translate.instant(i18n.strategy.default),
        value: 1,
      },
      {
        name: translate.instant(i18n.strategy.global),
        value: 2,
      },
      {
        name: translate.instant(i18n.strategy.public),
        value: 3,
      },
      {
        name: translate.instant(i18n.strategy.proxy),
        value: 4,
      },
      {
        name: translate.instant(i18n.strategy.korea),
        value: 5,
      },
      {
        name: translate.instant(i18n.strategy.direct),
        value: 6,
      },
    ]
  }
}
