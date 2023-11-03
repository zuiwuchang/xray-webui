import { Component, Input } from '@angular/core';
import { LangService } from 'src/app/core/lang.service';
import { Filed } from '../home/steps';
export interface UIValue {
  value?: any
}
@Component({
  selector: 'app-ui-field',
  templateUrl: './ui-field.component.html',
  styleUrls: ['./ui-field.component.scss']
})
export class UiFieldComponent {
  constructor(private readonly langService: LangService) { }
  @Input()
  field?: Filed
  @Input()
  value: UIValue = {}
  @Input()
  disabled = false

  getLabel(label: undefined | Record<string, string>, def?: string): string {
    if (!label) {
      return def ?? ''
    }
    const key = this.langService.lang
    const val = label[key]
    return val ?? label['default'] ?? def ?? ''
  }
  get autofocus(): boolean {
    return this.field?.key == 'name'
  }
}
