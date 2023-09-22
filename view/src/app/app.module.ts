import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

// import ngx-translate and the http loader
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { LocationStrategy } from '@angular/common';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './app/home/home.component';

import defaultLanguage from '../assets/i18n/zh-Hant.json';
import { BehaviorSubject } from 'rxjs';
class MyTranslateLoader extends TranslateHttpLoader {
  override getTranslation(lang: string) {
    if (lang == "default") {
      return new BehaviorSubject<Object>(defaultLanguage)
    }
    return super.getTranslation(lang)
  }
}
// 如果要支持 AOT 需要定義一個函數，而不能使用 內聯的匿名函數
export function HttpLoaderFactory(http: HttpClient, locationStrategy: LocationStrategy): TranslateHttpLoader {
  let url = locationStrategy.getBaseHref()
  if (url.endsWith("/")) {
    url += 'assets/i18n/'
  } else {
    url += '/assets/i18n/'
  }
  return new MyTranslateLoader(http, url, '.json')
}

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent
  ],
  imports: [
    BrowserModule,
    // ngx-translate and the loader module
    HttpClientModule,
    TranslateModule.forRoot({
      defaultLanguage: "default",// 指定默認語言
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory, // 使用 http 加載語言包
        deps: [HttpClient, LocationStrategy],
      },
    }),
    AppRoutingModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
