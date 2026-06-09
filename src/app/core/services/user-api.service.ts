import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RoleType, UserDto, UserRoleDto } from '../models/biomed.interface';
import { ScopeType } from '../auth/permission.types';

@Injectable({
  providedIn: 'root'
})
export class UserApiService {

  private baseUrl = 'http://localhost:3000/api/users';

  constructor(private http: HttpClient) {}

  // ─────────────────────────────
  // READ
  // ─────────────────────────────

  getAllUsers(): Observable<UserDto[]> {
    return this.http.get<UserDto[]>(this.baseUrl);
  }

  getUserById(userId: string): Observable<UserDto> {
    return this.http.get<UserDto>(`${this.baseUrl}/${userId}`);
  }

  getCurrentUser(): Observable<UserDto> {
    return this.http.get<UserDto>(`${this.baseUrl}/me`);
  }

  // ─────────────────────────────
  // CREATE
  // ─────────────────────────────

  createUser(payload: {
    username: string;
    fullName: string;
    email?: string;
    password: string;
    institutionId?: string | null;
  }): Observable<UserDto> {
    return this.http.post<UserDto>(this.baseUrl, payload);
  }

  // ─────────────────────────────
  // UPDATE
  // ─────────────────────────────

  updateUser(userId: string, payload: Partial<UserDto>): Observable<UserDto> {
    return this.http.put<UserDto>(`${this.baseUrl}/${userId}`, payload);
  }

  updateUserStatus(userId: string, active: boolean): Observable<UserDto> {
    return this.http.patch<UserDto>(
      `${this.baseUrl}/${userId}/status`,
      { active }
    );
  }

  // ─────────────────────────────
  // DELETE
  // ─────────────────────────────

  deleteUser(userId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${userId}`);
  }

  // ─────────────────────────────
  // ROLES
  // ─────────────────────────────

  assignRole(payload: {
    userId: string;
    role: RoleType;
    scopeType: ScopeType;
    scopeId?: string | null;
  }): Observable<UserRoleDto> {
    return this.http.post<UserRoleDto>(
      `${this.baseUrl}/${payload.userId}/roles`,
      payload
    );
  }

  removeRole(userId: string, roleId: string): Observable<void> {
    return this.http.delete<void>(
      `${this.baseUrl}/${userId}/roles/${roleId}`
    );
  }
}