import { Component } from '@angular/core';
import { i18n } from 'src/app/i18n';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {
  i18n = i18n
}
