import { Injectable } from '@angular/core';
import { RoleType } from '../models/biomed.interface';
import { UserFacadeService } from '../services/user-facade.service';

@Injectable({
  providedIn: 'root'
})
export class PermissionService {
  constructor(private authFacade: UserFacadeService) { }

  hasRole(...roles: RoleType[]): boolean {
    const activeRole =
      this.authFacade.activeRole();

    if (!activeRole) {
      return false;
    }
    return roles.includes(activeRole.role);
  }

  canViewStock(): boolean {
    return this.hasRole(
      'SUPER_ADMIN_PDHS',
      'ADMIN_PDHS',
      'VIEWER_PDHS',

      'SUPER_ADMIN_RDHS',
      'ADMIN_RDHS',
      'VIEWER_RDHS',

      'SUPER_ADMIN_INSTITUTE',
      'ADMIN_INSTITUTE',
      'VIEWER_INSTITUTE',

      'STORE_KEEPER',
      'BIOMEDICAL_TECHNICIAN',
      'PROCUREMENT_OFFICER',
      'INSTITUTION_USER'
    );
  }

  canEditStock(): boolean {

    return this.hasRole(
      'SUPER_ADMIN_PDHS',
      'ADMIN_PDHS',

      'STORE_KEEPER'
    );
  }
  canAssignStock(): boolean {

    return this.hasRole(
      'SUPER_ADMIN_PDHS',
      'ADMIN_PDHS',

      'SUPER_ADMIN_RDHS',
      'ADMIN_RDHS',

      'STORE_KEEPER'
    );
  }
}
