import { Injectable } from '@angular/core';
import { ScopeType } from '../models/biomed.interface';
import { UserFacadeService } from './user-facade.service';

@Injectable({
  providedIn: 'root'
})
export class ScopeService {

  constructor(
    private authFacade: UserFacadeService
  ) {}

  getScopeType(): ScopeType | null {

    return this.authFacade
      .activeRole()
      ?.scopeType ?? null;
  }

  getScopeId(): string | null {

    return this.authFacade
      .activeRole()
      ?.scopeId ?? null;
  }

  isPdhsScope(): boolean {

    return this.getScopeType() === 'PDHS';
  }

  isRdhsScope(): boolean {

    return this.getScopeType() === 'RDHS';
  }

  isInstitutionScope(): boolean {

    return this.getScopeType() === 'INSTITUTE';
  }
}
