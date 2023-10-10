import { Directive } from '@angular/core';
import { AbstractControl, NG_VALIDATORS, ValidationErrors, ValidatorFn } from '@angular/forms';

@Directive({
  selector: '[appUrlValidator]',
  providers: [{ provide: NG_VALIDATORS, useExisting: UrlValidatorDirective, multi: true }]
})
export class UrlValidatorDirective {
  private matcher = URLValidator()
  validate(control: AbstractControl) {
    return this.matcher(control)
  }
}
export function URLValidator(): ValidatorFn {
  return (ctrl: AbstractControl): ValidationErrors | null => {
    const v = `${ctrl.value ?? ''}`.trim()
    if (!v.startsWith('http://') && !v.startsWith('https://')) {
      return {
        'url': {
          value: ctrl.value,
          msg: 'protocol fail'
        }
      }
    }
    try {
      const url = new URL(v)
      if (url.protocol != 'http:' && url.protocol != 'https:') {
        return {
          'url': {
            value: ctrl.value,
            msg: 'protocol fail'
          }
        }
      } else if (url.hostname == '') {
        return {
          'url': {
            value: ctrl.value,
            msg: 'hostname fail'
          }
        }
      }
    } catch (e) {
      return {
        'url': {
          value: ctrl.value,
          msg: `${e}`,
        }
      }
    }
    return null
  }
}