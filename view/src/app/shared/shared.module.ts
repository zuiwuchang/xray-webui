import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NameValidatorDirective } from './name-validator.directive';
import { UrlValidatorDirective } from './url-validator.directive';



@NgModule({
  declarations: [
    NameValidatorDirective,
    UrlValidatorDirective,
  ],
  imports: [
    CommonModule
  ],
  exports: [
    NameValidatorDirective, UrlValidatorDirective,
  ]
})
export class SharedModule { }
