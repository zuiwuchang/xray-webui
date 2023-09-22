import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { environment } from 'src/environments/environment';

export interface Lang {
  id: string
  name: string
}
@Injectable({
  providedIn: 'root'
})
export class LangService {
  readonly defaultLang: string
  readonly langs: Array<Lang> = [
    {
      id: 'zh-Hant',
      name: '🇹🇼 正體中文'
    },
    {
      id: 'zh-Hans',
      name: '🇨🇳 简体中文'
    },
    {
      id: 'en',
      name: '🇺🇸 English'
    },
  ]
  constructor(private translateService: TranslateService) {
    let lang = translateService.getBrowserCultureLang()?.toLowerCase() ?? 'en'
    if (lang == 'zh') {
      lang = 'zh-Hant'
    } else if (lang.startsWith('zh-')) {
      if (lang.indexOf('hans') != -1 || lang.indexOf('cn') != -1) {
        lang = 'zh-Hans'
      } else {
        lang = 'zh-Hant'
      }
    } else {
      lang = 'en'
    }
    this.defaultLang = lang
  }
  start() {
    if (!environment.production) {
      return
    }
    console.log('defaultLang', this.defaultLang)
    this.translateService.use(this.defaultLang)
  }
}
