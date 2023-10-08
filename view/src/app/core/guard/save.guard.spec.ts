import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { saveGuard } from './save.guard';

describe('saveGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => saveGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
