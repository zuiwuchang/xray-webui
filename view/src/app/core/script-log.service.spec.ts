import { TestBed } from '@angular/core/testing';

import { ScriptLogService } from './script-log.service';

describe('ScriptLogService', () => {
  let service: ScriptLogService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ScriptLogService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
