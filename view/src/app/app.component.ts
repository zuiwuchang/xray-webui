import { Component, OnInit } from '@angular/core';
import { LangService } from './core/lang.service';
import { MenuItem, MessageService, PrimeNGConfig } from 'primeng/api';
import { SettingsService, Themes } from './core/settings.service';
import { DomSanitizer, SafeResourceUrl, Title } from '@angular/platform-browser';
import { filter, first } from 'rxjs';
import { Delay } from 'src/internal/ui';
import { i18n } from 'src/app/i18n';
import { TranslateService } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { Method, ToastService } from './core/toast.service';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  providers: [MessageService],
})
export class AppComponent implements OnInit {
  constructor(
    translateService: TranslateService,
    private readonly langService: LangService,
    private readonly primengConfig: PrimeNGConfig,
    private readonly settingsService: SettingsService,
    private readonly sanitizer: DomSanitizer,
    private readonly httpClient: HttpClient,
    private readonly title: Title,
    private readonly messageService: MessageService,
    private readonly toastService: ToastService,
  ) {

    this.theme = this.sanitizer.bypassSecurityTrustResourceUrl(`assets/themes/${settingsService.theme.value}/theme.css`)

    this._updateLangs(langService)
    translateService.onLangChange.subscribe(() => {
      this.apps = [
        {
          label: translateService.instant(i18n.menuSettings.general),
          icon: 'pi pi-wrench',
          routerLink: ['/settings/general'],
        },
        {
          label: translateService.instant(i18n.menuSettings.strategy),
          icon: 'pi pi-tags',
          routerLink: ['/settings/strategy'],
        },
        {
          label: translateService.instant(i18n.menuSettings.firewall),
          icon: 'pi pi-globe',
          routerLink: ['/settings/firewall'],
        },
      ]
    })
  }
  i18n = i18n
  ready = false
  ngOnInit(): void {
    this.primengConfig.ripple = true
    const dely = Delay.default()
    this.langService.ready.pipe(
      filter((v) => { return v }),
      first(),
    ).subscribe(() => {
      dely.do(() => {
        this.ready = true
      })
    })

    this.toastService.observable.subscribe({
      next: (evt) => {
        switch (evt.method) {
          case Method.add:
            this.messageService.add(evt.message!)
            break
          case Method.addAll:
            this.messageService.addAll(evt.messages!)
            break
          case Method.clear:
            this.messageService.clear(evt.key)
            break
        }

      }
    })

    this.httpClient.get<{ result: string }>('/api/v1/system/title').subscribe({
      next: (resp) => {
        if (typeof resp.result === "string" && resp.result != '') {
          this.title.setTitle(resp.result)
        }
      },
      error: (e) => {
        console.warn(e)
      },
    })
  }
  langs: Array<MenuItem> = []
  apps: Array<MenuItem> = []
  private _updateLangs(langService: LangService) {
    this.langs = langService.langs.map((lang) => {
      return {
        label: lang.name,
        icon: lang.id == langService.lang ? 'pi pi-check-circle' : 'pi pi-circle',
        command: () => {
          if (langService.use(lang.id)) {
            this._updateLangs(langService)
          }
        }
      }
    })
  }
  theme: SafeResourceUrl
  initSidebar = false // 主題側邊欄 是否被創建
  themeSidebar = false // 主題側邊欄 是否可見
  themes = Themes // 可選主題
  /**
  * 設置主題
  */
  onClickTheme(theme: string) {
    if (this.settingsService.theme.value != theme) {
      this.settingsService.theme.value = theme
      this.theme = this.sanitizer.bypassSecurityTrustResourceUrl(`assets/themes/${theme}/theme.css`)
    }
  }
  isTheme(theme: string) {
    return this.settingsService.theme.value == theme
  }
  toggleSidebar() {
    if (!this.initSidebar) {
      this.initSidebar = true
    }
    this.themeSidebar = !this.themeSidebar
  }
}

