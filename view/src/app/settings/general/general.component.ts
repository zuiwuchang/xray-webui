import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { MessageService } from 'primeng/api';
import { Deactivate } from 'src/app/core/guard/save.guard';
import { ToastPosition, ToastService } from 'src/app/core/toast.service';
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
  data: General = {
    url: '',
    run: false,
    firewall: false,
    strategy: 1,
    userdata: '',
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
        this.state = State.none
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
  get canDeactivate(): boolean {
    return !this.disabled
  }
  notDeactivate() {
    this.toastService.add({
      severity: 'warn', summary: this.translateService.instant(i18n.action.warn), detail: this.translateService.instant(i18n.action.waitDataSave)
    })
  }
}
