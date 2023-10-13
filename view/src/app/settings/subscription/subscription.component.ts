import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ConfirmationService } from 'primeng/api';
import { ToastService } from 'src/app/core/toast.service';
import { i18n } from 'src/app/i18n';
import { Closed, State } from 'src/internal/closed';
import { getErrorString } from 'src/internal/error';
import { Delay } from 'src/internal/ui';
import { AddResponse, ListResponse, Subscription, SubscriptionView } from './subscription';

@Component({
  selector: 'app-subscription',
  templateUrl: './subscription.component.html',
  styleUrls: ['./subscription.component.scss'],
  providers: [ConfirmationService],
})
export class SubscriptionComponent extends Closed implements OnInit {
  i18n = i18n
  constructor(private readonly httpClient: HttpClient,
    private readonly translateService: TranslateService,
    private readonly toastService: ToastService,
    private readonly confirmationService: ConfirmationService,
  ) {
    super()
    const data: Subscription = {
      id: '',
      name: '',
      url: '',
    }
    this.add = {
      data: data,
      backup: data,
      view: false,
      add: true,
    }
    this.data = [this.add]
  }
  state = State.none
  error = ''
  add: SubscriptionView
  data: Array<SubscriptionView>
  ngOnInit(): void {
    this.onClickRefresh()
  }
  onClickRefresh() {
    if (this.state == State.run) {
      return
    }
    this.state = State.run
    const dely = Delay.default()

    this.httpClient.get<ListResponse>('/api/v1/settings/subscription').pipe(this.takeUntil()).subscribe({
      next: (resp) => dely.do(() => {
        if (resp.data && resp.data.length > 0) {
          this.data.push(...resp.data.map<SubscriptionView>((v) => {
            return {
              data: {
                id: v.id,
                name: v.name,
                url: v.url,
              },
              backup: {
                id: v.id,
                name: v.name,
                url: v.url,
              },
              view: true
            }
          }))
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
  disabledClass(css = ''): string {
    return this.disabled ? (css == '' ? 'p-disabled' : css + ' p-disabled') : css
  }
  formClass(form: any, css = ''): string {
    return (this.disabled || form.invalid) ? (css == '' ? 'p-disabled' : css + ' p-disabled') : css
  }
  saveClass(form: any, node: SubscriptionView, css = ''): string {
    return (this.disabled || form.invalid || this.isNotChanged(node)) ? (css == '' ? 'p-disabled' : css + ' p-disabled') : css
  }
  onClickEdit(node: SubscriptionView) {
    if (!node.view) {
      return
    }
    const l = node.data
    const r = node.backup
    l.name = r.name
    l.url = r.url
    node.view = false
  }
  get canDeactivate(): boolean {
    return !this.disabled
  }
  notDeactivate() {
    this.toastService.add({
      severity: 'warn', summary: this.translateService.instant(i18n.action.warn), detail: this.translateService.instant(i18n.action.waitDataSave)
    })
  }
  onClickAdd(node: SubscriptionView, form: any) {
    if (this.disabled) {
      return
    }
    this.disabled = true
    node.run = true
    const dely = Delay.default()
    const name = node.data.name.trim()
    const url = node.data.url.trim()
    this.httpClient.post<AddResponse>('/api/v1/settings/subscription', {
      name: name,
      url: url,
    }).pipe(this.takeUntil()).subscribe({
      next: (resp) => dely.do(() => {
        this.data.push({
          data: {
            id: resp.id,
            name: name,
            url: url,
          },
          backup: {
            id: resp.id,
            name: name,
            url: url,
          },
          view: true,
        })
        this.toastService.add({ severity: 'success', summary: this.translateService.instant(i18n.action.success), detail: this.translateService.instant(i18n.action.updated) });
        this.disabled = false
        node.run = false
        form.reset()
      }),
      error: (e) => dely.do(() => {
        console.warn(e)
        this.toastService.add({ severity: 'error', summary: this.translateService.instant(i18n.action.error), detail: getErrorString(e) });
        this.disabled = false
        node.run = false
      }),
    })
  }
  isNotChanged(node: SubscriptionView): boolean {
    const l = node.data
    const r = node.backup
    return l.name.trim() == r.name.trim() && l.url.trim() == r.url.trim()
  }
  onClickSave(node: SubscriptionView) {
    if (this.disabled) {
      return
    }
    this.disabled = true
    node.run = true

    const dely = Delay.default()
    const name = node.data.name.trim()
    const url = node.data.url.trim()
    this.httpClient.put<AddResponse>(`/api/v1/settings/subscription/${node.data.id}`, {
      name: name,
      url: url,
    }).pipe(this.takeUntil()).subscribe({
      next: (_) => dely.do(() => {
        node.backup.name = node.data.name
        node.backup.url = node.data.url

        this.toastService.add({ severity: 'success', summary: this.translateService.instant(i18n.action.success), detail: this.translateService.instant(i18n.action.updated) });
        this.disabled = false
        node.run = false
        node.view = true
      }),
      error: (e) => dely.do(() => {
        console.warn(e)
        this.toastService.add({ severity: 'error', summary: this.translateService.instant(i18n.action.error), detail: getErrorString(e) });
        this.disabled = false
        node.run = false
      }),
    })
  }
  onClickDelete(event: Event, node: SubscriptionView) {
    if (this.disabled) {
      return
    }
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: this.translateService.instant(i18n.action.remove),
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this._remove(node)
      },
    });
  }
  private _remove(node: SubscriptionView) {
    if (this.disabled) {
      return
    }

    this.disabled = true
    node.run = true
    const dely = Delay.default()
    const id = node.data.id
    this.httpClient.delete(`/api/v1/settings/subscription/${id}`).pipe(this.takeUntil()).subscribe({
      next: (_) => dely.do(() => {
        const items = this.data
        for (let i = 1; i < items.length; i++) {
          if (items[i].data.id === id) {
            items.splice(i, 1)
            break
          }
        }
        this.toastService.add({ severity: 'success', summary: this.translateService.instant(i18n.action.success), detail: this.translateService.instant(i18n.action.removeSuccess) });
        this.disabled = false
        node.run = false
        node.view = true
      }),
      error: (e) => dely.do(() => {
        console.warn(e)
        this.toastService.add({ severity: 'error', summary: this.translateService.instant(i18n.action.error), detail: getErrorString(e) });
        this.disabled = false
        node.run = false
      }),
    })

  }
}

