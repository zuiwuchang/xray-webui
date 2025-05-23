import { HttpClient } from '@angular/common/http';
import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ToastService } from 'src/app/core/toast.service';
import { i18n } from 'src/app/i18n';
import { Closed, State } from 'src/internal/closed';
import { getErrorString } from 'src/internal/error';
import { Prepare } from 'src/internal/prepare';
import { Delay } from 'src/internal/ui';
import { GeneralStep, General, ListGroup, ListStep, MetadataStep, Metadata, MetadataProvider, ListElement } from './steps';
import { URL } from "@king011/easyts/es/es2020/net/url/url"
import { LangService } from 'src/app/core/lang.service';
import { ConfirmationService, MenuItem } from 'primeng/api';
import ClipboardJS from 'clipboard';
import { DialogService } from 'primeng/dynamicdialog';
import { QrComponent } from '../qr/qr.component';
import { PreviewComponent } from '../preview/preview.component';
import { UIValue } from '../ui-field/ui-field.component';
import { Last, ListenerService } from 'src/app/core/listener.service';
import { getItem, setItem } from 'src/internal/local-storage';
import { SettingsService } from 'src/app/core/settings.service';
import { TerminalComponent } from '../terminal/terminal.component';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  providers: [DialogService, ConfirmationService],
})
export class HomeComponent extends Closed implements AfterViewInit, OnDestroy {
  i18n = i18n
  private prepare_: Prepare
  get activeIndex() {
    return this.settingsService.activeIndex
  }
  activeIndexChange(v: any) {
    this.settingsService.activeIndex = v
  }
  constructor(private readonly httpClient: HttpClient,
    private readonly translateService: TranslateService,
    private readonly toastService: ToastService,
    private readonly langService: LangService,
    private readonly dialogService: DialogService,
    private readonly confirmationService: ConfirmationService,
    private readonly listenerService: ListenerService,
    private readonly settingsService: SettingsService,
  ) {
    super()
    this.dialog = new DialogOfElement(httpClient, translateService, toastService)
    this.dialogImport = new DialogOfImport(httpClient, translateService, toastService)
    this.prepare_ = new Prepare([
      new MetadataStep(this, httpClient),
      new ListStep(this, httpClient),
      new GeneralStep(this, httpClient),
    ])
    translateService.onLangChange.pipe(this.takeUntil()).subscribe({
      next: () => {
        this._updateStrategys()
      },
    })
  }
  state = State.none
  error = ''
  items: Array<Source> = []
  strategy = 1
  strategys: Array<{ name: string, value: number | string }> = []
  provider?: MetadataProvider
  strategyNmae() {
    switch (this.last?.strategy ?? 0) {
      case 1:
        return this.translateService.instant(i18n.strategy.default)
      case 2:
        return this.translateService.instant(i18n.strategy.global)
      case 3:
        return this.translateService.instant(i18n.strategy.public)
      case 4:
        return this.translateService.instant(i18n.strategy.proxy)
      case 5:
        return this.translateService.instant(i18n.strategy.korea)
      case 6:
        return this.translateService.instant(i18n.strategy.direct)
    }
    return ``
  }
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
  ngOnInit(): void {
    this._updateStrategys()
    this.onClickRefresh()
    this.listenerService.last.pipe(this.takeUntil()).subscribe({
      next: (last) => {
        this.last = last
      },
    })
  }
  last?: Last
  get storeLast(): Last | undefined {
    return this.listenerService.storeLast
  }
  private clipboard_?: ClipboardJS
  @ViewChild("btnClipboard")
  private _btnClipboard?: ElementRef
  ngAfterViewInit(): void {
    this.clipboard_ = new ClipboardJS(this._btnClipboard!.nativeElement).on('success', () => {
      this.toastService.add({
        severity: 'success',
        summary: this.translateService.instant(i18n.action.success),
        detail: this.translateService.instant(i18n.action.copied),
      })
    }).on('error', (evt) => {
      console.error('Action:', evt.action)
      console.error('Trigger:', evt.trigger)
    })
  }
  override ngOnDestroy(): void {
    this.clipboard_?.destroy()
    const ws = this.ws_
    if (ws) {
      this.ws_ = undefined
      ws.close()
    }
    super.ngOnDestroy()
  }
  onClickRefresh() {
    if (this.state == State.run) {
      return
    }
    this.state = State.run
    const dely = Delay.default()
    this.prepare_.do().then(() => {
      if (this.isNotClosed) {
        dely.do(() => {
          const md = this.prepare_.steps[0].data as Array<Metadata>
          const provider = new MetadataProvider(Array.isArray(md) ? md : [])
          this.provider = provider
          const items = this.prepare_.steps[1].data as Array<ListGroup>
          if (Array.isArray(items) && items.length > 0) {
            this.items = items.map((val) => new Source(provider, val))
          }
          const general = this.prepare_.steps[2].data as General
          switch (general.strategy) {
            case 1:
            case 2:
            case 3:
            case 4:
            case 5:
            case 6:
              this.strategy = general.strategy
              break
          }

          this.state = State.ok
        })
      }
    }).catch((e) => {
      if (this.isNotClosed) {
        dely.do(() => {
          console.warn(e)
          this.error = getErrorString(e)
          this.state = State.error
        })
      }
    })
  }
  trackById(_: number, data: Source): string {
    return data.id
  }
  disabled = false
  addDisabledClass(css = '', add?: boolean | any) {
    return add ? (css == '' ? 'p-disabled' : css + ' p-disabled') : css
  }
  disabledClass(css = '', source?: Source): string {
    return this.disabled || source?.disabled ? (css == '' ? 'p-disabled' : css + ' p-disabled') : css
  }
  onClickSort(source: Source) {
    if (this.disabled || source.disabled) {
      return
    }

    source.sort()
  }
  private ws_?: WebSocket
  onClickTest(source: Source) {
    if (this.disabled || source.disabled || source.data.length == 0) {
      return
    }
    source.disabled = true
    const scheme = window.location.protocol == 'https:' ? 'wss' : 'ws'
    const url = `${scheme}://${window.location.host}/api/v1/proxy/test`
    try {
      const ws = new WebSocket(url)
      this.ws_ = ws
      let timer: any = setInterval(() => {
        ws.send('{"what":-1}')
      }, 1000 * 40)
      const onclose = () => {
        if (timer) {
          clearInterval(timer)
          timer = undefined
        }
        ws.close()
        if (ws != this.ws_) {
          return
        }
        this.ws_ = undefined

        for (const data of source.data) {
          data.disabled = false
        }
        source.disabled = false
        this.toastService.add({
          severity: 'error',
          summary: this.translateService.instant(i18n.action.error),
          detail: `WebSocket EOF`,
        })
      }
      ws.onclose = () => onclose()
      ws.onerror = () => onclose()

      ws.onopen = () => {
        if (ws != this.ws_) {
          ws.close()
          return
        }
        let i = source.data.length
        ws.onmessage = (data) => {
          if (ws != this.ws_) {
            ws.close()
            return
          }
          if (typeof data.data != "string") {
            return
          }
          const resp: { code: number, error?: string, id?: string, duration?: number } = JSON.parse(data.data)
          if (resp.code == 200) {
            const id = resp.id!
            for (const data of source.data) {
              if (data.id == id) {
                data.disabled = false
                const err = resp.error
                if (err) {
                  data.error = err
                } else {
                  data.millisecond = resp.duration
                }
                break
              }
            }
            if (i > 0) {
              i--
              if (!i) {
                this.ws_ = undefined
                for (const data of source.data) {
                  data.disabled = false
                }
                source.disabled = false
                ws.close()
              }
            }
          } else {
            if (this.isNotClosed) {
              this.toastService.add({
                severity: 'error',
                summary: this.translateService.instant(i18n.action.error),
                detail: resp.error!,
              })
            }
            this.ws_ = undefined
            for (const data of source.data) {
              data.disabled = false
            }
            source.disabled = false
            ws.close()
          }
        }
        for (const data of source.data) {
          data.disabled = true
          data.error = undefined
          data.millisecond = undefined
        }
        for (const data of source.data) {
          ws.send(JSON.stringify({
            what: 1,
            id: `${data.id}`,
            url: data.rawURL,
          }))
        }
      }
    } catch (e) {
      this.disabled = false
      source.disabled = false
      this.toastService.add({
        severity: 'error',
        summary: this.translateService.instant(i18n.action.error),
        detail: `${e}`,
      })
    }
  }
  onClickTestTCP(source: Source) {
    if (this.disabled || source.disabled || source.data.length == 0) {
      return
    }
    source.disabled = true
    const scheme = window.location.protocol == 'https:' ? 'wss' : 'ws'
    const url = `${scheme}://${window.location.host}/api/v1/proxy/test_tcp`
    try {
      const ws = new WebSocket(url)
      this.ws_ = ws
      let timer: any = setInterval(() => {
        ws.send('{"what":-1}')
      }, 1000 * 40)
      const onclose = () => {
        if (timer) {
          clearInterval(timer)
          timer = undefined
        }
        ws.close()
        if (ws != this.ws_) {
          return
        }
        this.ws_ = undefined

        for (const data of source.data) {
          data.disabled = false
        }
        source.disabled = false
        this.toastService.add({
          severity: 'error',
          summary: this.translateService.instant(i18n.action.error),
          detail: `WebSocket EOF`,
        })
      }
      ws.onclose = () => onclose()
      ws.onerror = () => onclose()

      ws.onopen = () => {
        if (ws != this.ws_) {
          ws.close()
          return
        }
        let i = source.data.length
        ws.onmessage = (data) => {
          if (ws != this.ws_) {
            ws.close()
            return
          }
          if (typeof data.data != "string") {
            return
          }
          const resp: { code: number, error?: string, id?: string, duration?: number } = JSON.parse(data.data)
          if (resp.code == 200) {
            const id = resp.id!
            for (const data of source.data) {
              if (data.id == id) {
                data.disabled = false
                const err = resp.error
                if (err) {
                  data.error = err
                } else {
                  data.millisecond = resp.duration
                }
                break
              }
            }
            if (i > 0) {
              i--
              if (!i) {
                this.ws_ = undefined
                for (const data of source.data) {
                  data.disabled = false
                }
                source.disabled = false
                ws.close()
              }
            }
          } else {
            if (this.isNotClosed) {
              this.toastService.add({
                severity: 'error',
                summary: this.translateService.instant(i18n.action.error),
                detail: resp.error!,
              })
            }
            this.ws_ = undefined
            for (const data of source.data) {
              data.disabled = false
            }
            source.disabled = false
            ws.close()
          }
        }
        for (const data of source.data) {
          data.disabled = true
          data.error = undefined
          data.millisecond = undefined
        }
        for (const data of source.data) {
          ws.send(JSON.stringify({
            what: 1,
            id: `${data.id}`,
            remote: data.remote,
          }))
        }
      }
    } catch (e) {
      this.disabled = false
      source.disabled = false
      this.toastService.add({
        severity: 'error',
        summary: this.translateService.instant(i18n.action.error),
        detail: `${e}`,
      })
    }
  }
  onClickAdd(source: Source) {
    if (this.disabled) {
      return
    }
    this.dialog.add(source)
  }
  onClickImport(source: Source) {
    if (this.disabled || source.disabled) {
      return
    }
    this.dialogImport.show(source)
  }
  onClickQR(source: Source) {
    if (this.disabled) {
      return
    }
    const s = source.data.map((ele) => { return ele.rawURL }).join("\n")
    this._showQR(s)
  }
  onClickCopy(source: Source) {
    if (this.disabled || source.disabled) {
      return
    }
    const s = source.data.map((ele) => { return ele.rawURL }).join("\n")
    this._copyToClipboard(s)
  }
  onClickUpdate(source: Source) {
    if (this.disabled || source.disabled) {
      return
    }
    this.disabled = true
    source.disabled = true

    this.httpClient.post<Array<ListElement>>(`/api/v1/settings/element/${source.id}`, undefined)
      .pipe(this.takeUntil())
      .subscribe({
        next: (resp) => {
          for (const item of this.items) {
            if (item.id == source.id) {
              try {
                if (Array.isArray(resp) && resp.length > 0) {
                  source.data = resp.map((v) => {
                    return new Element(this.provider!, v.id, v.url)
                  })
                } else {
                  source.data = []
                }
              } catch (e) {
                console.warn(e)
                this.toastService.add({
                  severity: 'error',
                  summary: this.translateService.instant(i18n.action.error),
                  detail: `${e}`,
                })
              }
              break
            }
          }
          console.log(resp)
          // if (Array.isArray(resp) && resp.length > 0) {
          //   this.items = resp.map((val) => new Source(this.provider!, val))
          // }
          this.disabled = false
          source.disabled = false
        },
        error: (e) => {
          console.warn(e)
          this.toastService.add({
            severity: 'error',
            summary: this.translateService.instant(i18n.action.error),
            detail: getErrorString(e),
          })
          this.disabled = false
          source.disabled = false
        },
      })
  }
  get canDeactivate(): boolean {
    return !this.disabled
  }
  notDeactivate() {
    this.toastService.add({
      severity: 'warn',
      summary: this.translateService.instant(i18n.action.warn),
      detail: this.translateService.instant(i18n.action.waitDataSave),
    })
  }
  getLabel(label: undefined | Record<string, string>, def?: string): string {
    if (!label) {
      return def ?? ''
    }
    const key = this.langService.lang
    const val = label[key]
    return val ?? label['default'] ?? def ?? ''
  }
  ele_?: Element
  onClickPlay(source: Source, ele: Element) {
    if (this.disabled || source.disabled || ele.disabled) {
      return
    }
    this.disabled = true
    source.disabled = true
    ele.disabled = true
    const dely = Delay.default(this)
    this.httpClient.post(`/api/v1/proxy/start/${source.id}/${ele.id}`, {
      url: ele.rawURL,
      strategy: this.strategy,
      name: ele.name,
    }).pipe(this.takeUntil()).subscribe({
      next: () => dely.do(() => {
        this.toastService.add({
          severity: 'success',
          summary: this.translateService.instant(i18n.action.success),
          detail: this.translateService.instant(i18n.proxy.started),
        })
        this.disabled = false
        source.disabled = false
        ele.disabled = false
      }),
      error: (e) => dely.do(() => {
        this.toastService.add({
          severity: 'error',
          summary: this.translateService.instant(i18n.action.error),
          detail: getErrorString(e),
        })
        this.disabled = false
        source.disabled = false
        ele.disabled = false
      }),
    })
  }
  onClickStoreLast() {
    const last = this.storeLast
    if (this.disabled || !last) {
      return
    }
    this.disabled = true
    const dely = Delay.default(this)
    this.httpClient.post(`/api/v1/proxy/start/${last.subscription}/${last.id}`, {
      url: last.url,
      strategy: this.strategy,
      name: last.name,
    }).pipe(this.takeUntil()).subscribe({
      next: () => dely.do(() => {
        this.toastService.add({
          severity: 'success',
          summary: this.translateService.instant(i18n.action.success),
          detail: this.translateService.instant(i18n.proxy.started),
        })
        this.disabled = false
      }),
      error: (e) => dely.do(() => {
        this.toastService.add({
          severity: 'error',
          summary: this.translateService.instant(i18n.action.error),
          detail: getErrorString(e),
        })
        this.disabled = false
      }),
    })
  }
  onClickLast() {
    const last = this.last
    if (this.disabled || !last) {
      return
    }
    this.onClickStop()
  }
  onClickStop(source?: Source, ele?: Element) {
    if (this.disabled || source?.disabled || ele?.disabled) {
      return
    }
    this.disabled = true
    if (source) {
      source.disabled = true
    }
    if (ele) {
      ele.disabled = true
    }
    const dely = Delay.default(this)
    this.httpClient.delete('/api/v1/proxy').pipe(this.takeUntil()).subscribe({
      next: () => dely.do(() => {
        this.toastService.add({
          severity: 'success',
          summary: this.translateService.instant(i18n.action.success),
          detail: this.translateService.instant(i18n.proxy.stopped),
        })
        this.disabled = false
        if (source) {
          source.disabled = false
        }
        if (ele) {
          ele.disabled = false
        }
      }),
      error: (e) => dely.do(() => {
        this.toastService.add({
          severity: 'error',
          summary: this.translateService.instant(i18n.action.error),
          detail: getErrorString(e),
        })
        this.disabled = false
        if (source) {
          source.disabled = false
        }
        if (ele) {
          ele.disabled = false
        }
      }),
    })
  }
  isRun(source: Source) {
    return source.id == this?.last?.subscription
  }
  isStarted(source: Source, ele: Element) {
    const last = this.last
    if (last) {
      return source.id == last.subscription && ele.id == last.id && ele.rawURL == last.url
    }
    return false
  }
  createMenus(source: Source, ele: Element): Array<MenuItem> {
    const lang = this.langService.lang
    if (ele.lang_ === lang && ele.menus_) {
      return ele.menus_
    }
    const translateService = this.translateService
    const qr: MenuItem = {
      label: translateService.instant(i18n.proxy.qr),
      icon: 'pi pi-qrcode',
      command: () => {
        this._showQR(ele.rawURL)
      },
    }
    const copy: MenuItem = {
      label: translateService.instant(i18n.proxy.copy),
      icon: 'pi pi-copy',
      command: () => {
        this._copyToClipboard(ele.rawURL)
      },
    }

    const menus: Array<MenuItem> = ele.url ? [
      {
        label: translateService.instant(i18n.proxy.test),
        icon: 'pi pi-bolt',
        command: () => {
          if (!this.disabled && !source.disabled && !ele.disabled) {
            this._testOnce(source, ele)
          }
        },
      },
      {
        label: 'TCP Ping',
        icon: 'pi pi-directions',
        command: () => {
          if (!this.disabled && !source.disabled && !ele.disabled) {
            this._testTCPOnce(source, ele)
          }
        },
      },
      { separator: true },
      {
        label: translateService.instant(i18n.proxy.view),
        icon: 'pi pi-sync',
        command: () => {
          if (!this.disabled && !source.disabled && !ele.disabled) {
            this._preview(source, ele)
          }
        },
      },
      qr, copy, { separator: true },
      {
        label: translateService.instant(i18n.proxy.firewall),
        icon: 'pi pi-send',
        command: () => {
          if (!this.disabled && !source.disabled && !ele.disabled) {
            this._turnOn(ele.rawURL, source, ele)
          }
        },
      },
      {
        label: translateService.instant(i18n.proxy.closeFirewall),
        icon: 'pi pi-eraser',
        command: () => {
          if (!this.disabled && !source.disabled && !ele.disabled) {
            this._turnOff(ele.rawURL, source, ele)
          }
        },
      },
      { separator: true },
      {
        label: translateService.instant(i18n.edit),
        icon: 'pi pi-file-edit',
        command: () => {
          if (!this.disabled && !source.disabled && !ele.disabled) {
            this.dialog.edit(source, ele)
          }
        },
      },
      {
        label: translateService.instant(i18n.delete),
        icon: 'pi pi-trash',
        command: () => {
          if (!this.disabled && !source.disabled && !ele.disabled) {
            this.onClickDelete(source, ele)
          }
        },
      },
    ] : [qr, copy]
    ele.lang_ = lang
    ele.menus_ = menus
    return menus
  }
  onClickTurnOn() {
    const last = this.last
    if (this.disabled || !last) {
      return
    }
    this._turnOn(last.url)
  }
  onClickTurnOff() {
    const last = this.last ?? this.storeLast
    if (this.disabled || !last) {
      return
    }
    this._turnOff(last.url)
  }
  private _turnOn(rawURL: string, source?: Source, ele?: Element) {
    this.disabled = true
    if (source) {
      source.disabled = true
    }
    if (ele) {
      ele.disabled = true
    }

    const delay = Delay.default(this)
    this.httpClient.post('/api/v1/firewall/on', {
      url: rawURL,
    }).pipe(this.takeUntil()).subscribe({
      next: () => delay.do(() => {
        if (ele) {
          ele.disabled = false
        }
        if (source) {
          source.disabled = false
        }
        this.disabled = false

        this.toastService.add({ severity: 'success', summary: this.translateService.instant(i18n.action.success), detail: this.translateService.instant(i18n.proxy.firewallOn) })
      }),
      error: (e) => delay.do(() => {
        if (ele) {
          ele.disabled = false
        }
        if (source) {
          source.disabled = false
        }
        this.disabled = false

        const err = getErrorString(e)
        this.toastService.add({ severity: 'error', summary: this.translateService.instant(i18n.action.error), detail: err })
      })
    })

  }
  private _turnOff(rawURL: string, source?: Source, ele?: Element) {
    this.disabled = true
    if (source) {
      source.disabled = true
    }
    if (ele) {
      ele.disabled = true
    }

    const delay = Delay.default(this)
    this.httpClient.post('/api/v1/firewall/off', {
      url: rawURL,
    }).pipe(this.takeUntil()).subscribe({
      next: () => delay.do(() => {
        if (ele) {
          ele.disabled = false
        }
        if (source) {
          source.disabled = false
        }
        this.disabled = false

        this.toastService.add({ severity: 'success', summary: this.translateService.instant(i18n.action.success), detail: this.translateService.instant(i18n.proxy.firewallOff) })
      }),
      error: (e) => delay.do(() => {
        if (ele) {
          ele.disabled = false
        }
        if (source) {
          source.disabled = false
        }
        this.disabled = false

        const err = getErrorString(e)
        this.toastService.add({ severity: 'error', summary: this.translateService.instant(i18n.action.error), detail: err })
      })
    })

  }
  @ViewChild(TerminalComponent)
  private terminal_?: TerminalComponent
  onClickClearLog() {
    this.terminal_?.clearLog()
  }
  private _copyToClipboard(s: string) {
    try {
      const btn = this._btnClipboard!.nativeElement
      btn.setAttribute("data-clipboard-text", s)
      btn.click()
    } catch (e) {
      console.warn(e)
    }
  }
  private _showQR(s: string) {
    this.dialogService.open(QrComponent, {
      data: s,
      showHeader: false,
      dismissableMask: true,
    })
  }
  private _testTCPOnce(source: Source, ele: Element) {
    source.disabled = true
    ele.disabled = true
    ele.error = undefined
    ele.millisecond = undefined
    const delay = Delay.default(this)
    console.log(ele)
    this.httpClient.post<{ result: number }>(`/api/v1/proxy/test_tcp_once`, {
      remote: ele.remote,
    }).pipe(this.takeUntil()).subscribe({
      next: (resp) => delay.do(() => {
        ele.millisecond = resp.result
        source.disabled = false
        ele.disabled = false
      }),
      error: (e) => delay.do(() => {
        source.disabled = false
        ele.disabled = false
        const err = getErrorString(e)
        this.toastService.add({ severity: 'error', summary: this.translateService.instant(i18n.action.error), detail: err })
        ele.error = err
      }),
    })
  }
  private _testOnce(source: Source, ele: Element) {
    source.disabled = true
    ele.disabled = true
    ele.error = undefined
    ele.millisecond = undefined
    const delay = Delay.default(this)
    console.log(ele)
    this.httpClient.post<{ result: number }>(`/api/v1/proxy/test_once`, {
      url: ele.rawURL,
    }).pipe(this.takeUntil()).subscribe({
      next: (resp) => delay.do(() => {
        ele.millisecond = resp.result
        source.disabled = false
        ele.disabled = false
      }),
      error: (e) => delay.do(() => {
        source.disabled = false
        ele.disabled = false
        const err = getErrorString(e)
        this.toastService.add({ severity: 'error', summary: this.translateService.instant(i18n.action.error), detail: err })
        ele.error = err
      }),
    })
  }
  private _preview(source: Source, ele: Element) {
    this.disabled = true
    source.disabled = true
    ele.disabled = true
    const delay = Delay.default(this)
    this.httpClient.post(`/api/v1/proxy/preview`, {
      strategy: this.strategy,
      url: ele.rawURL,
    }, {
      responseType: "text",
    }).pipe(this.takeUntil()).subscribe({
      next: (s) => delay.do(() => {
        this.disabled = false
        source.disabled = false
        ele.disabled = false
        this.dialogService.open(PreviewComponent, {
          header: this.translateService.instant(i18n.proxy.view),
          data: s,
          dismissableMask: true,
          maximizable: true,
          width: '80vw',
        })
      }),
      error: (e) => delay.do(() => {
        this.disabled = false
        source.disabled = false
        ele.disabled = false

        this.toastService.add({ severity: 'error', summary: this.translateService.instant(i18n.action.error), detail: getErrorString(e) })
      }),
    })

  }
  onClickDelete(source: Source, ele: Element) {
    if (this.disabled || source.disabled || ele.disabled) {
      return
    }
    const translateService = this.translateService
    this.confirmationService.confirm({
      message: translateService.instant(i18n.action.sureDelete),
      header: translateService.instant(i18n.action.deleteElement),
      icon: 'pi pi-info-circle',
      accept: () => {
        if (this.isClosed) {
          return
        }

        const delay = Delay.default(this)
        this.disabled = true
        source.disabled = true
        this.httpClient.delete(`/api/v1/settings/element/${source.id}/${ele.id}`).pipe(this.takeUntil()).subscribe({
          next: () => delay.do(() => {
            this.toastService.add({ severity: 'success', summary: translateService.instant(i18n.action.success), detail: translateService.instant(i18n.action.deleted) })
            const data = source.data
            for (let i = 0; i < data.length; i++) {
              if (data[i].id == ele.id) {
                data.splice(i, 1)
                break
              }
            }
            this.disabled = false
            source.disabled = false
          }),
          error: (e) => delay.do(() => {
            this.toastService.add({ severity: 'error', summary: translateService.instant(i18n.action.error), detail: getErrorString(e) })

            this.disabled = false
            source.disabled = false
          }),
        })
      },
      dismissableMask: true,
    })
  }
  onClickClear(source: Source) {
    if (this.disabled || source.disabled) {
      return
    }
    const translateService = this.translateService
    this.confirmationService.confirm({
      message: translateService.instant(i18n.action.sureDelete),
      header: translateService.instant(i18n.action.clearElement),
      icon: 'pi pi-info-circle',
      accept: () => {
        if (this.isClosed) {
          return
        }

        const delay = Delay.default(this)
        this.disabled = true
        source.disabled = true
        this.httpClient.delete(`/api/v1/settings/elements/${source.id}`).pipe(this.takeUntil()).subscribe({
          next: () => delay.do(() => {
            this.toastService.add({ severity: 'success', summary: translateService.instant(i18n.action.success), detail: translateService.instant(i18n.action.deleted) })
            source.data = []

            this.disabled = false
            source.disabled = false
          }),
          error: (e) => delay.do(() => {
            this.toastService.add({ severity: 'error', summary: translateService.instant(i18n.action.error), detail: getErrorString(e) })

            this.disabled = false
            source.disabled = false
          }),
        })

      },
      dismissableMask: true,
    });
  }
  dialog: DialogOfElement
  dialogImport: DialogOfImport
}
class DialogOfImport {
  constructor(private readonly httpClient: HttpClient,
    private readonly translateService: TranslateService,
    private readonly toastService: ToastService,) { }
  source?: Source
  value = ''
  visible = false
  disabled = false
  show(source: Source) {
    if (this.disabled || this.visible || source.disabled) {
      return
    }
    this.source = source
    this.visible = true
  }
  _close() {
    this.visible = false
    this.source = undefined
    this.value = ''
    this.disabled = false
  }
  get isNotChanged(): boolean {
    const strs = this.value.trim().split('\n')
    let num = 0
    for (let s of strs) {
      s = s.trim()
      if (s == '') {
        continue
      }
      try {
        URL.parseRequestURI(s)
        num++
      } catch (_) { }
    }
    return num == 0
  }
  onClickSubmit() {
    if (this.disabled || !this.source) {
      return
    }
    const source = this.source
    const rawURL = new Array<string>()
    const strs = this.value.trim().split('\n')
    for (let s of strs) {
      s = s.trim()
      if (s == '') {
        continue
      }
      try {
        URL.parseRequestURI(s)
        rawURL.push(s)
      } catch (e) {
        this.toastService.add({ severity: 'error', summary: this.translateService.instant(i18n.action.error), detail: `${e}` })
        return
      }
    }
    this.disabled = true
    const delay = Delay.default()
    this.httpClient.post<{ ids: Array<string> }>(`/api/v1/settings/element_import/${source.id}`, {
      urls: rawURL,
    }).subscribe({
      next: (resp) => delay.do(() => {
        const items = new Array<Element>()
        for (let i = 0; i < rawURL.length; i++) {
          items.push(new Element(source.provider, resp.ids[i], rawURL[i]))
        }
        source.data.push(...items)

        this.toastService.add({ severity: 'success', summary: this.translateService.instant(i18n.action.success), detail: this.translateService.instant(i18n.proxy.importSuccess) })
        this.disabled = false
        this._close()
      }),
      error: (e) => delay.do(() => {
        this.disabled = false
        this.toastService.add({ severity: 'error', summary: this.translateService.instant(i18n.action.error), detail: getErrorString(e) })
      }),
    })

  }
  onClickClose() {
    if (this.disabled) {
      return
    }
    this._close()
  }
}
class DialogOfElement {
  constructor(private readonly httpClient: HttpClient,
    private readonly translateService: TranslateService,
    private readonly toastService: ToastService,) { }
  importStr = ''
  visible = false
  disabled = false
  isAdd?: boolean
  metadatas: Array<Metadata> = []
  private lang_ = ''
  getMetadata(): Array<Metadata> {
    const lang = this.translateService.currentLang
    if (lang != this.lang_) {
      for (const md of this.metadatas) {
        if (md.label) {
          md.name = md.label[lang] ?? md.label['default'] ?? md.protocol
        } else {
          md.name = md.protocol
        }
      }
      this.lang_ = lang
    }
    return this.metadatas
  }
  metadata?: Metadata
  private source_?: Source
  private ele_?: Element
  private old_?: {
    metadata?: Metadata
    values?: Map<string, string>
  }
  add(source: Source) {
    if (this.visible || this.disabled || source.disabled) {
      return
    }

    this.metadatas = source.provider.metadata
    this.metadata = undefined
    this.old_ = {}
    this._initForm(source.provider)
    this.source_ = source
    this.ele_ = undefined
    this.isAdd = true
    this.visible = true
  }
  edit(source: Source, ele: Element) {
    if (this.visible || this.disabled || source.disabled || ele.disabled) {
      return
    }
    this.metadatas = source.provider.metadata
    this.metadata = ele.metadata
    const values = new Map<string, string>()
    this.old_ = {
      metadata: this.metadata,
      values: values,
    }
    this._initForm(source.provider, ele, values)
    this.source_ = source
    this.ele_ = ele
    this.isAdd = false
    this.visible = true
  }
  get isNotChanged(): boolean {
    const metadata = this.metadata
    const old = this.old_
    if (metadata != old?.metadata) {
      return false
    }
    const keys = this.keys
    const values = old?.values
    if (metadata && keys && values) {
      for (const field of metadata.fields) {
        if ((keys.get(field.key)?.value ?? '') != (values.get(field.key) ?? '')) {
          return false
        }
      }
    }
    return true
  }
  keys?: Map<string, UIValue>

  private _initForm(provider: MetadataProvider, ele?: Element, values?: Map<string, string>) {
    const keys = new Map<string, UIValue>()
    for (const metadata of this.metadatas) {
      for (const field of metadata.fields) {
        keys.set(field.key, {})
      }
    }
    if (ele && ele.url && ele.metadata) {
      const m = provider.fileds(ele.metadata, ele.url)
      for (const [key, value] of m) {
        keys.set(key, { value: value })
        values!.set(key, value)
      }
    }
    this.keys = keys
  }
  value(key?: string): UIValue | undefined {
    return key ? this.keys?.get(key) : undefined
  }
  onClickSubmit() {
    if (this.disabled || !this.metadata || !this.source_ || !this.keys) {
      return
    }
    const source = this.source_
    const ele = this.ele_
    const u = this.source_.provider.getURL(this.metadata, this.keys).toString()
    console.log(u)
    const delay = Delay.default()
    this.disabled = true
    this.httpClient.post<{ id?: string }>(ele ? `/api/v1/settings/element_set/${source.id}/${ele.id}` : `/api/v1/settings/element_add/${source.id}`, {
      url: u,
    }).subscribe({
      next: (resp) => delay.do(() => {
        if (ele) {
          try {
            ele.reload(u)
            this.toastService.add({ severity: 'success', summary: this.translateService.instant(i18n.action.success), detail: this.translateService.instant(i18n.proxy.setOK) })
          } catch (e) {
            console.warn(e)
            this.toastService.add({ severity: 'error', summary: this.translateService.instant(i18n.action.error), detail: `${e}` })
            this.disabled = false
            return
          }
        } else {
          try {
            const newele = new Element(source.provider, resp.id!, u)
            source.data.push(newele)
            this.toastService.add({ severity: 'success', summary: this.translateService.instant(i18n.action.success), detail: this.translateService.instant(i18n.proxy.addOK) })
          } catch (e) {
            console.warn(e)
            this.toastService.add({ severity: 'error', summary: this.translateService.instant(i18n.action.error), detail: `${e}` })
            this.disabled = false
            return
          }
        }
        this.disabled = false
        this._close()

      }),
      error: (e) => delay.do(() => {
        console.warn(e)
        this.toastService.add({ severity: 'error', summary: this.translateService.instant(i18n.action.error), detail: getErrorString(e) })
        this.disabled = false
      }),
    })

  }
  onClickClose() {
    if (this.disabled) {
      return
    }
    this._close()
  }
  private _close() {
    this.visible = false
    this.source_ = undefined
    this.ele_ = undefined
    this.old_ = undefined
    this.metadata = undefined
    this.metadatas = []
    this.keys = undefined
    this.importStr = ''
  }
  onClickImport() {
    if (this.disabled || !this.source_) {
      return
    }
    this.disabled = true
    try {
      const rawURL = this.importStr.trim()
      let fragment = ''
      let i = rawURL.lastIndexOf('#')
      if (i > 0) {
        fragment = decodeURIComponent(rawURL.substring(i + 1))
      }
      const url = URL.parseRequestURI(i > 0 ? rawURL.substring(0, i) : rawURL)
      url.fragment = fragment

      const provider = this.source_.provider
      let metadata: undefined | Metadata
      for (const md of provider.metadata) {
        if (md.protocol != url.scheme) {
          continue
        }
        metadata = md
        break
      }
      if (!metadata) {
        throw new Error(`unknow scheme: ${url.scheme}`)
      }

      const keys = new Map<string, UIValue>()
      for (const metadata of this.metadatas) {
        for (const field of metadata.fields) {
          keys.set(field.key, {})
        }
      }
      const fields = provider.fileds(metadata, url)
      for (const [key, value] of fields) {
        keys.set(key, { value: value })
      }
      // alias

      this.keys = keys
      this.metadata = metadata
    } catch (e) {
      this.toastService.add({ severity: 'error', summary: this.translateService.instant(i18n.action.error), detail: `${e}` })
    } finally {
      this.disabled = false
    }
  }
}
class Source {
  readonly id: string
  readonly name: string
  readonly url: string
  data: Array<Element>
  disabled = false
  constructor(readonly provider: MetadataProvider, data: ListGroup) {
    this.id = data.id
    this.name = data.name
    this.url = data.url
    if (Array.isArray(data.data) && data.data.length > 0) {
      this.data = data.data.map((v) => {
        return new Element(provider, v.id, v.url)
      })
    } else {
      this.data = []
    }
  }
  sort() {
    if (this.data.length > 1) {
      this.data.sort((l, r) => {
        const lv = l.millisecond
        const rv = r.millisecond
        if (lv === rv) {
          return 0
        } else if (lv === undefined) {
          return 1
        } else if (rv === undefined) {
          return -1
        }
        return lv > rv ? 1 : -1
      })
      this.data = [...this.data]
    }
  }
}
class Element {
  menus_?: Array<MenuItem>
  lang_?: string

  url?: URL
  metadata?: Metadata

  name?: string
  describe?: string
  disabled = false

  /**
   * 遠程地址
   */
  remote?: string
  /**
   * 測試速度
   */
  millisecond?: number
  /**
   * 錯誤
   */
  error?: any
  constructor(readonly provider: MetadataProvider, readonly id: string, public rawURL: string) {
    try {
      let fragment = ''
      let i = rawURL.lastIndexOf('#')
      if (i > 0) {
        fragment = decodeURIComponent(rawURL.substring(i + 1))
      }
      const url = URL.parseRequestURI(i > 0 ? rawURL.substring(0, i) : rawURL)
      url.fragment = fragment

      for (const md of provider.metadata) {
        if (md.protocol != url.scheme) {
          continue
        }
        this._updateView(url, md)
        break
      }
    } catch (e) {
      console.warn(e)
    }
  }
  reload(rawURL: string) {
    const o = new Element(this.provider, this.id, rawURL)

    this.rawURL = rawURL
    this.menus_ = undefined
    this.lang_ = undefined

    this.metadata = o.metadata
    this.url = o.url

    this.name = o.name
    this.describe = o.describe
  }
  private _updateView(url: URL, md: Metadata) {
    const provider = this.provider
    const fields = provider.fileds(md, url)
    this.name = fields.get('name') ?? ''

    const describe: Array<string> = []
    let s = fields.get('protocol') ?? ''
    if (s != '') {
      describe.push(s)
    }
    s = fields.get('security') ?? ''
    if (s != '') {
      describe.push(s)
    }


    let remote = fields.get('address') ?? ''
    const port = fields.get('port') ?? ''
    if (remote.includes(':')) {
      remote = `[${remote}]:${port}`
    } else {
      remote = `${remote}:${port}`
    }
    this.remote = remote
    describe.push(remote)

    this.describe = describe.join(' ')

    this.url = url
    this.metadata = md
  }

}