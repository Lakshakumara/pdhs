import { Injectable } from '@angular/core';
import { UserFacadeService } from '../services/user-facade.service';
import { Permission } from '../models/permission.types';

@Injectable({
  providedIn: 'root'
})
export class PermissionService {

  constructor(private userFacade: UserFacadeService) { }

  has(permission: Permission): boolean {
    return this.userFacade.permissions()?.includes(permission) ?? false;
  }
}
