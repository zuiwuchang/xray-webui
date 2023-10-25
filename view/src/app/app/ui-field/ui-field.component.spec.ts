import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UiFieldComponent } from './ui-field.component';

describe('UiFieldComponent', () => {
  let component: UiFieldComponent;
  let fixture: ComponentFixture<UiFieldComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [UiFieldComponent]
    });
    fixture = TestBed.createComponent(UiFieldComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
