import { Component, OnInit } from '@angular/core';
import { LangService } from './core/lang.service';
import { MenuItem, PrimeNGConfig } from 'primeng/api';
import { SettingsService, Themes } from './core/settings.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { filter, first } from 'rxjs';
import { Delay } from 'src/internal/ui';
import { i18n } from 'src/app/i18n';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  constructor(
    private readonly langService: LangService,
    private readonly primengConfig: PrimeNGConfig,
    private readonly settingsService: SettingsService,
    private readonly sanitizer: DomSanitizer,) {

    this.theme = this.sanitizer.bypassSecurityTrustResourceUrl(`assets/themes/${settingsService.theme.value}/theme.css`)

    this._updateLangs(langService)
  }
  i18n = i18n
  ready = false
  ngOnInit(): void {
    this.primengConfig.ripple = true
    const dely = Delay.after(500)
    this.langService.ready.pipe(
      filter((v) => { return v }),
      first(),
    ).subscribe(() => {
      dely.do(() => {
        this.ready = true
      })
    })
  }
  langs: Array<MenuItem> = []
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

