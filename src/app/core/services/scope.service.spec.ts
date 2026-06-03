import { TestBed } from '@angular/core/testing';

import { Scope } from './scope.service';

describe('Scope', () => {
  let service: Scope;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Scope);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
