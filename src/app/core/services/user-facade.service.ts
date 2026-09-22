import { computed, Injectable, signal } from "@angular/core";
import { UserDto, ActiveRole, UserSession } from "../models/biomed.interface";
import { RoleType } from "../models/permission.types";
import { UserApiService } from "./user-api.service";
import { Permission } from "../constants/permissions";

@Injectable({ providedIn: 'root' })
export class UserFacadeService {

  constructor(private userApi: UserApiService) { }

  getUsers() {
    return this.userApi.getAllUsers();
  }

  readonly currentSession = signal<UserSession | null>(null);

  readonly currentUser = computed(() => this.currentSession()?.user ?? null);

  readonly activeRole = computed(() => this.currentSession()?.activeRole ?? null);

  private _permissions = signal<Permission[] | null>([]);

  permissions = this._permissions.asReadonly();

  setPermissions(perms: Permission[] | null) {
    this._permissions.set(perms);
  }

  clear() {
    this._permissions.set([]);
  }

  setSession(user: UserDto, activeRole: ActiveRole, permission: Permission[] | null): void {
    this.currentSession.set({
      user,
      activeRole,
      permission: permission
    });
    this.setPermissions(permission)
  }
/*
  setSessionById(userId: string) {
    this.userApi.getUserById(userId).subscribe(user => {
      const firstRole = user.roles[0];
      this.setSession(
        user, {
        role: firstRole.role,
        scopeType: firstRole.scopeType,
        scopeId: firstRole.scopeId
      }, firstRole.permission
      );
    });

  }
  */
  clearSession(): void {
    this.currentSession.set(null);
  }

  hasAnyRole(roles: RoleType[]): boolean {
    return this.currentUser()?.roles.some(r => roles.includes(r.role)) ?? false;
  }
}