import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ToastService } from 'src/app/core/toast.service';
import { i18n } from 'src/app/i18n';
import { Closed, State } from 'src/internal/closed';
import { getErrorString } from 'src/internal/error';
import { Prepare } from 'src/internal/prepare';
import { Delay } from 'src/internal/ui';
import { GeneralStep, General, ListGroup, ListStep } from './steps';


@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent extends Closed {
  i18n = i18n
  private prepare_: Prepare
  constructor(private readonly httpClient: HttpClient,
    private readonly translateService: TranslateService,
    private readonly toastService: ToastService,
  ) {
    super()
    this.prepare_ = new Prepare([
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
  onClickRefresh() {
    if (this.state == State.run) {
      return
    }
    this.state = State.run
    const dely = Delay.default()
    this.prepare_.do().then(() => {
      if (this.isNotClosed) {
        dely.do(() => {
          const resp = this.prepare_.steps[0].data as Array<ListGroup>
          if (Array.isArray(resp) && resp.length > 0) {
            this.items = resp.map((val) => new Source(val))
          }
          const general = this.prepare_.steps[1].data as General
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
    console.log('add', source)
    this.disabled = true
  }
  onClickClear(source: Source) {
    if (this.disabled) {
      return
    }
    console.log('clear', source)
    this.disabled = true
  }
  onClickQR(source: Source) {
    if (this.disabled) {
      return
    }
    console.log('qr', source)
    this.disabled = true
  }
  onClickCopy(source: Source) {
    if (this.disabled) {
      return
    }
    console.log('copy', source)
    this.disabled = true
  }
  onClickUpdate(source: Source) {
    if (this.disabled) {
      return
    }
    console.log('copy', source)
    this.disabled = true
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
class Source {
  readonly id: string
  readonly name: string
  readonly url: string
  readonly data = new Array<Element>()
  constructor(data: ListGroup) {
    this.id = data.id
    this.name = data.name
    this.url = data.url
  }
  get run(): boolean {
    return false
  }
}
class Element { }