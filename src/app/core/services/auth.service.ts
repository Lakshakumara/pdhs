import { Injectable } from '@angular/core';
import { RoleType, UserDto } from '../models/biomed.interface';

@Injectable({
  providedIn: 'root',
})
export class AuthService {

  private currentUser?: UserDto;

  hasRole(...roles: RoleType[]): boolean {
    return this.currentUser?.roles.some(
      r => roles.includes(r.role)
    ) ?? false;
  }

  hasAnyRole(roles: RoleType[]): boolean {
    return this.currentUser?.roles.some(
      r => roles.includes(r.role)
    ) ?? false;
  }
}