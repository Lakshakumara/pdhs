import { inject, Injectable } from '@angular/core';
import { UserFacadeService } from '../services/user-facade.service';
import { Permission } from '../models/permission.types';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface PermissionMeta {
  groups: { group: string; icon: string; permissions: string[] }[];
  definitions: Record<string, { label: string; description: string; icon: string }>;
}

@Injectable({
  providedIn: 'root'
})
export class PermissionService {
  private http = inject(HttpClient)
  private userFacade = inject(UserFacadeService);
  private baseUrl = environment.apiUrl

  constructor() { }

  has(permission: Permission): boolean {
    return this.userFacade.permissions()?.includes(permission) ?? false;
  }

  getMeta() {
    return this.http.get<PermissionMeta>(`${this.baseUrl}/api/auth/permissions/meta`);
  }
}
