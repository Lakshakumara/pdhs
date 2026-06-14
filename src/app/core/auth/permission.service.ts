import { computed, Injectable } from '@angular/core';
import { UserFacadeService } from '../services/user-facade.service';
import { Permission } from './permission.types';

@Injectable({
  providedIn: 'root'
})
export class PermissionService {

  constructor(private userFacade: UserFacadeService) { }

  has(permission: Permission): boolean {
    return this.userFacade.permissions()?.includes(permission) ?? false;
  }

  /*hasAnyPermission(...permissions: Permission[]): boolean {
    return permissions.some(p => this.permissions.has(p));
  }

  hasAllPermissions(...permissions: Permission[]): boolean {
    return permissions.every(p => this.permissions.has(p));
  }*/

  /*hasRole(...roles: RoleType[]): boolean {
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
  //remove later, we will use permissions instead of roles


  // new way with permissions
  private permissions = new Set<Permission>();

  initPermissions() {
    this.permissions = new Set(this.authFacade.currentSession()?.permission);;
  }*/
  /*setPermissions(permissions: Permission[]): void {
    this.permissions = new Set(permissions);
  }*/

  

  
}
