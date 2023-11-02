import { TestBed } from '@angular/core/testing';

import { ListenerService } from './listener.service';

describe('ListenerService', () => {
  let service: ListenerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ListenerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
