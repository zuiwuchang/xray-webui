import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { getItem, setItem } from 'src/internal/local-storage';

export interface Lang {
  id: string
  name: string
}
@Injectable({
  providedIn: 'root'
})
export class LangService {
  private ready_ = new BehaviorSubject<boolean>(false)
  get ready(): Observable<boolean> {
    return this.ready_
  }
  private lang_: string
  get lang() {
    return this.lang_
  }
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
  constructor(private readonly translateService: TranslateService) {
    let lang = getItem('lang')
    if (lang) {
      for (const node of this.langs) {
        if (node.id == lang) {
          this.lang_ = lang
          this._use(lang)
          return
        }
      }
    }

    lang = translateService.getBrowserCultureLang()?.toLowerCase() ?? 'en'
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
    this.lang_ = lang
    this._use(lang)
  }
  private _use(lang: string) {
    this.translateService.use(lang).subscribe((v) => {
      this.ready_.next(true)
    })
  }
  use(lang: string): boolean {
    if (lang == this.lang_) {
      return false
    }

    for (const node of this.langs) {
      if (node.id == lang) {
        this.lang_ = node.id
        this.translateService.use(lang)
        setItem('lang', lang)
        return true
      }
    }
    return false
  }
}
