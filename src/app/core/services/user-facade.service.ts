import { computed, Injectable, signal } from "@angular/core";
import { UserDto, RoleType, ActiveRole, UserSession } from "../models/biomed.interface";
import { UserApiService } from "./user-api.service";

@Injectable({ providedIn: 'root' })
export class UserFacadeService {

  constructor(private userApi: UserApiService) { }

  getUsers() {
    return this.userApi.getAllUsers();
  }

  hasAnyRole(roles: RoleType[]): boolean {
    return this.currentUser()?.roles.some(r => roles.includes(r.role)) ?? false;
  }

  setSessionById(userId: string) {
    this.userApi.getUserById(userId).subscribe(user => {
      const firstRole = user.roles[0];
      this.setSession(
        user, {
        role: firstRole.role,
        scopeType: firstRole.scopeType,
        scopeId: firstRole.scopeId
      }
      );
    });;
  }
  readonly currentSession = signal<UserSession | null>(null);

  readonly currentUser = computed(() => this.currentSession()?.user ?? null);

  readonly activeRole = computed(() => this.currentSession()?.activeRole ?? null);

  setSession(user: UserDto, activeRole: ActiveRole): void {
    this.currentSession.set({
      user,
      activeRole
    });
  }

  clearSession(): void {
    this.currentSession.set(null);
  }

  switchRole(activeRole: ActiveRole): void {

    const session = this.currentSession();

    if (!session) {
      return;
    }

    this.currentSession.set({
      ...session,
      activeRole
    });
  }
  /*
  loadCurrentUser(userId: string): Promise<void> {
    return firstValueFrom(
      this.userApi.getUserById(userId)
    ).then(user => {
      this.currentUserOld.set(user);
    });
  }
  // Role Switcher API
  

  updateCurrentUser(user: UserDto): void {
    this.currentUserOld.set(user);
  }

  clearCurrentUser(): void {
    this.currentUserOld.set(null);
  }
  hasRole(user: UserDto, ...roles: RoleType[]): boolean {
    return user.roles.some(r => roles.includes(r.role));
  }
*/

}