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
import { URL } from '@king011/easyts/lib/es6/net/url/url';
import { LangService } from 'src/app/core/lang.service';
import { ConfirmationService, MenuItem } from 'primeng/api';
import ClipboardJS from 'clipboard';
import { DialogService } from 'primeng/dynamicdialog';
import { QrComponent } from '../qr/qr.component';
import { PreviewComponent } from '../preview/preview.component';
import { FormControl, FormGroup } from '@angular/forms';
import { UIValue } from '../ui-field/ui-field.component';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  providers: [DialogService, ConfirmationService],
})
export class HomeComponent extends Closed implements AfterViewInit, OnDestroy {
  i18n = i18n
  private prepare_: Prepare
  constructor(private readonly httpClient: HttpClient,
    private readonly translateService: TranslateService,
    private readonly toastService: ToastService,
    private readonly langService: LangService,
    private readonly dialogService: DialogService,
    private readonly confirmationService: ConfirmationService,
  ) {
    super()
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
  }
  private _clipboard?: ClipboardJS
  @ViewChild("btnClipboard")
  private _btnClipboard?: ElementRef
  ngAfterViewInit(): void {
    this._clipboard = new ClipboardJS(this._btnClipboard!.nativeElement).on('success', () => {
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
    this._clipboard?.destroy()
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
  disabledClass(css = ''): string {
    return this.disabled ? (css == '' ? 'p-disabled' : css + ' p-disabled') : css
  }
  onClickSort(source: Source) {
    if (this.disabled) {
      return
    }
    console.log('sort', source)
    this.disabled = true
  }
  onClickTest(source: Source) {
    if (this.disabled) {
      return
    }
    console.log('test', source)
    this.disabled = true
  }
  onClickAdd(source: Source) {
    if (this.disabled) {
      return
    }
    this.dialog.add(source)
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

    this.httpClient.post<Array<ListElement>>(`/api/v1/settings/element/${source.id}`, undefined).pipe(this.takeUntil()).subscribe({
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
    console.log('play', ele)
    const dely = Delay.default()
    dely.do(() => {
      this.ele_ = ele

      this.disabled = false
      source.disabled = false
      ele.disabled = false
    })
  }
  onClickStop(source: Source, ele: Element) {
    if (this.disabled || source.disabled || ele.disabled) {
      return
    }
    this.disabled = true
    source.disabled = true
    ele.disabled = true
    console.log('stop', ele)
    const dely = Delay.default()
    dely.do(() => {
      this.ele_ = undefined

      this.disabled = false
      source.disabled = false
      ele.disabled = false
    })
  }
  isStarted(ele: Element) {
    return ele == this.ele_
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
          console.log('test', ele)
        },
      },
      {
        label: translateService.instant(i18n.proxy.view),
        icon: 'pi pi-sync',
        command: () => {
          this._preview(source, ele)
        },
      },
      qr, copy, { separator: true },
      {
        label: translateService.instant(i18n.proxy.firewall),
        icon: 'pi pi-send',
        command: () => {
          console.log('turn on', ele)
        },
      },
      {
        label: translateService.instant(i18n.proxy.closeFirewall),
        icon: 'pi pi-eraser',
        command: () => {
          console.log('turn off', ele)
        },
      },
      { separator: true },
      {
        label: translateService.instant(i18n.edit),
        icon: 'pi pi-file-edit',
        command: () => {
          this.dialog.edit(source, ele)
        },
      },
      {
        label: translateService.instant(i18n.delete),
        icon: 'pi pi-trash',
        command: (evt) => {
          this.onClickDelete(source, ele)
        },
      },
    ] : [qr, copy]
    ele.lang_ = lang
    ele.menus_ = menus
    return menus
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
  private _preview(source: Source, ele: Element) {
    if (this.disabled || source.disabled || ele.disabled) {
      return
    }
    this.disabled = true
    source.disabled = true
    ele.disabled = true
    const delay = Delay.default()
    this.httpClient.post(`/api/v1/proxy/preview`, {
      strategy: this.strategy,
      url: ele.rawURL,
    }, {
      responseType: "text",
    }).pipe(this.takeUntil()).subscribe({
      next: (s) => delay.do(() => {
        if (this.isNotClosed) {
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
        }
      }),
      error: (e) => delay.do(() => {
        if (this.isNotClosed) {
          this.disabled = false
          source.disabled = false
          ele.disabled = false

          this.toastService.add({ severity: 'error', summary: this.translateService.instant(i18n.action.error), detail: getErrorString(e) })
        }
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

        const delay = Delay.default()
        this.disabled = true
        source.disabled = true
        this.httpClient.delete(`/api/v1/settings/element/${source.id}/${ele.id}`).pipe(this.takeUntil()).subscribe({
          next: () => delay.do(() => {
            if (this.isNotClosed) {
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
            }
          }),
          error: (e) => delay.do(() => {
            if (this.isNotClosed) {
              this.toastService.add({ severity: 'error', summary: translateService.instant(i18n.action.error), detail: getErrorString(e) })

              this.disabled = false
              source.disabled = false
            }
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

        const delay = Delay.default()
        this.disabled = true
        source.disabled = true
        this.httpClient.delete(`/api/v1/settings/elements/${source.id}`).pipe(this.takeUntil()).subscribe({
          next: () => delay.do(() => {
            if (this.isNotClosed) {
              this.toastService.add({ severity: 'success', summary: translateService.instant(i18n.action.success), detail: translateService.instant(i18n.action.deleted) })
              source.data = []

              this.disabled = false
              source.disabled = false
            }
          }),
          error: (e) => delay.do(() => {
            if (this.isNotClosed) {
              this.toastService.add({ severity: 'error', summary: translateService.instant(i18n.action.error), detail: getErrorString(e) })

              this.disabled = false
              source.disabled = false
            }
          }),
        })

      },
      dismissableMask: true,
    });
  }
  dialog = new DialogOfElement(this)
}
class DialogOfElement {
  constructor(private readonly component: HomeComponent) { }
  visible = false
  disabled = false
  isAdd?: boolean
  metadatas: Array<Metadata> = []
  metadata?: Metadata
  private source_?: Source
  private ele_?: Element
  add(source: Source) {
    if (this.visible || this.disabled || source.disabled) {
      return
    }

    this.metadatas = source.provider.metadata
    this.metadata = undefined
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
    this._initForm(source.provider, ele)
    this.source_ = source
    this.ele_ = undefined
    this.isAdd = false
    this.visible = true
  }
  get isNotChanged(): boolean {
    return false
  }
  keys?: Map<string, UIValue>
  private _initForm(provider: MetadataProvider, ele?: Element) {
    const keys = new Map<string, UIValue>()
    for (const metadata of this.metadatas) {
      for (const field of metadata.fields) {
        keys.set(field.key, {})
      }
    }
    if (ele && ele.url && ele.metadata) {
      for (const field of ele.metadata.fields) {
        const value = provider.get(ele.url, field)
        keys.set(field.key, { value: value })
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
    this.disabled = true
    const u = this.source_.provider.getURL(this.metadata, this.keys)

    console.log(u)
  }
  onClickClose() {
    if (this.disabled) {
      return
    }
    this.visible = false
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
  get run(): boolean {
    return false
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
  constructor(readonly provider: MetadataProvider, readonly id: string, readonly rawURL: string) {
    try {
      let fragment = ''
      let i = rawURL.lastIndexOf('#')
      if (i > 0) {
        fragment = rawURL.substring(i + 1)
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
  private _updateView(url: URL, md: Metadata) {
    const provider = this.provider
    let field = provider.filed(md, 'name')
    this.name = field ? provider.get(url, field) : ''

    const describe: Array<string> = []
    field = provider.filed(md, 'protocol')
    if (field) {
      const s = provider.get(url, field)
      if (s != '') {
        describe.push(s)
      }
    }
    field = provider.filed(md, 'security')
    if (field) {
      const s = provider.get(url, field)
      if (s != '') {
        describe.push(s)
      }
    }

    let host = ''
    field = provider.filed(md, 'address')
    if (field) {
      host = provider.get(url, field)
    }
    field = provider.filed(md, 'port')
    if (field) {
      const port = provider.get(url, field)
      if (port !== '') {
        if (host == '') {
          host = provider.get(url, field)
        } else {
          host += `:${provider.get(url, field)}`
        }
      }
    }
    if (host != '') {
      describe.push(host)
    }
    this.describe = describe.join(' ')

    this.url = url
    this.metadata = md
  }
}