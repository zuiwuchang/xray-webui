import { Component } from '@angular/core';
import { LangService } from './core/lang.service';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  constructor(langService: LangService) {
    langService.start()
  }
}
