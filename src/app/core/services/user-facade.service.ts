import { computed, Injectable, signal } from "@angular/core";
import { UserDto, RoleType, ActiveRole, UserSession } from "../models/biomed.interface";
import { UserApiService } from "./user-api.service";
import { firstValueFrom } from "rxjs";

@Injectable({ providedIn: 'root' })
export class UserFacadeService {

  readonly currentUserOld = signal<UserDto | null>(null);

  constructor(private userApi: UserApiService) { }

  getUsers() {
    return this.userApi.getAllUsers();
  }

  loadCurrentUser(userId: string): Promise<void> {
    return firstValueFrom(
      this.userApi.getUserById(userId)
    ).then(user => {
      this.currentUserOld.set(user);
    });
  }
  // Role Switcher API
  public switchUser(userId: string): void {
    this.loadCurrentUser(userId);
  }

  updateCurrentUser(user: UserDto): void {
    this.currentUserOld.set(user);
  }

  clearCurrentUser(): void {
    this.currentUserOld.set(null);
  }
  hasRole(user: UserDto, ...roles: RoleType[]): boolean {
    return user.roles.some(r => roles.includes(r.role));
  }

  hasAnyRole(roles: RoleType[]): boolean {
    return this.currentUserOld()?.roles.some(r => roles.includes(r.role)) ?? false;
  }


  getUserById(userId: string){
    return this.userApi.getUserById(userId);
  }
   readonly currentSession =
    signal<UserSession | null>(null);

  readonly currentUser = computed(
    () => this.currentSession()?.user ?? null
  );

  readonly activeRole = computed(
    () => this.currentSession()?.activeRole ?? null
  );

  setSession(
    user: UserDto,
    activeRole: ActiveRole
  ): void {

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
}