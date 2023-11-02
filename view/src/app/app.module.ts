import { NgModule } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// import ngx-translate and the http loader
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { LocationStrategy } from '@angular/common';

// primeng
import { ToolbarModule } from 'primeng/toolbar';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { SidebarModule } from 'primeng/sidebar';
import { MessagesModule } from 'primeng/messages';
import { MessageModule } from 'primeng/message';
import { MenuModule } from 'primeng/menu';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { AccordionModule } from 'primeng/accordion';
import { ToastModule } from 'primeng/toast';
import { CardModule } from 'primeng/card';
import { ProgressBarModule } from 'primeng/progressbar';
import { DropdownModule } from 'primeng/dropdown';
import { RippleModule } from 'primeng/ripple';
import { DataViewModule } from 'primeng/dataview';
import { SplitButtonModule } from 'primeng/splitbutton';
import { DynamicDialogModule } from 'primeng/dynamicdialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { TerminalModule } from 'primeng/terminal';

import { RouterModule } from '@angular/router';
import { AppRoutingModule } from './app-routing.module';

import { AppComponent } from './app.component';
import { HomeComponent } from './app/home/home.component';
import { NotfoundComponent } from './app/notfound/notfound.component';
import { AboutComponent } from './app/about/about.component';
import { QrComponent } from './app/qr/qr.component';
import { PreviewComponent } from './app/preview/preview.component';
import { UiFieldComponent } from './app/ui-field/ui-field.component';
import { TerminalComponent } from './app/terminal/terminal.component';


// import defaultLanguage from '../assets/i18n/zh-Hant.json';
// import { BehaviorSubject } from 'rxjs';
// class MyTranslateLoader extends TranslateHttpLoader {
//   override getTranslation(lang: string) {
//     if (lang == "default") {
//       return new BehaviorSubject<Object>(defaultLanguage)
//     }
//     return super.getTranslation(lang)
//   }
// }

// 如果要支持 AOT 需要定義一個函數，而不能使用 內聯的匿名函數
export function HttpLoaderFactory(http: HttpClient, locationStrategy: LocationStrategy): TranslateHttpLoader {
  let url = locationStrategy.getBaseHref()
  if (url.endsWith("/")) {
    url += 'assets/i18n/'
  } else {
    url += '/assets/i18n/'
  }
  return new TranslateHttpLoader(http, url, '.json')
}

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    NotfoundComponent,
    AboutComponent,
    QrComponent,
    PreviewComponent,
    UiFieldComponent,
    TerminalComponent,
  ],
  imports: [
    BrowserModule, BrowserAnimationsModule,
    FormsModule, ReactiveFormsModule,
    // ngx-translate and the loader module
    HttpClientModule,
    TranslateModule.forRoot({
      // defaultLanguage: "default",// 指定默認語言
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory, // 使用 http 加載語言包
        deps: [HttpClient, LocationStrategy],
      },
    }),

    ToolbarModule, ButtonModule, TooltipModule, SidebarModule,
    MessagesModule, MessageModule, MenuModule, ProgressSpinnerModule,
    AccordionModule, ToastModule, CardModule, ProgressBarModule,
    DropdownModule, RippleModule, DataViewModule, SplitButtonModule,
    DynamicDialogModule, ConfirmDialogModule, DialogModule,
    InputTextModule, InputTextareaModule, TerminalModule,
    RouterModule, AppRoutingModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
