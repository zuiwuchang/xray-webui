import { Directive } from '@angular/core';
import { AbstractControl, NG_VALIDATORS, ValidationErrors, ValidatorFn } from '@angular/forms';

@Directive({
  selector: '[appNameValidator]',
  providers: [{ provide: NG_VALIDATORS, useExisting: NameValidatorDirective, multi: true }]
})
export class NameValidatorDirective {
  private matcher = NameValidator()
  validate(control: AbstractControl) {
    return this.matcher(control)
  }
}
export function NameValidator(): ValidatorFn {
  return (ctrl: AbstractControl): ValidationErrors | null => {
    const v = `${ctrl.value ?? ''}`.trim()
    return v != '' ? null : {
      'name': {
        value: ctrl.value,
      }
    }
  }
}