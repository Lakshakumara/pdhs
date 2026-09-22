import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PagedResult, UserDto, UserRoleDto } from '../models/biomed.interface';
import { RoleType } from "../models/permission.types";
import { ScopeType } from '../models/permission.types';
import { environment } from '../../../environments/environment';
import { Permission } from '../constants/permissions';

@Injectable({
  providedIn: 'root'
})
export class UserApiService {
  

  private baseUrl = environment.apiUrl + '/users';

  constructor(private http: HttpClient) { }

  dev_getAllUsers(page?: number,
    size?: number,
  ): Observable<PagedResult<UserDto>> {
    let params = new HttpParams()
      .set('page', page ?? 1)
      .set('size', size ?? 20);
    return this.http.get<PagedResult<UserDto>>(environment.apiUrl + '/developer/users', { params });
  }

  getAllUsers(
    page: number = 1,
    size: number = 10,
    search?: string,
    role?: string,
    active?: string,          // 'true' | 'false' | undefined
  ): Observable<PagedResult<UserDto>> {
    let params = new HttpParams()
      .set('page', page)
      .set('size', size);
    if (search) params = params.set('search', search);
    if (role)   params = params.set('role', role);
    if (active !== undefined) params = params.set('active', active);
    return this.http.get<PagedResult<UserDto>>(this.baseUrl, { params });
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
      `${this.baseUrl}/${userId}/active`,
      { active }
    );
  }

  passwordReset(userId: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${userId}/reset-password`,{});
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

  assignRole(userId: string, payload: {
    role: RoleType;
    scopeType: ScopeType;
    scopeId?: string | null;
  }): Observable<UserRoleDto> {
    return this.http.post<UserRoleDto>(
      `${this.baseUrl}/${userId}/roles`,
      payload
    );
  }

  /*addPermission(userId: string,  permissions: Permission[]): Observable<Permission[]> {
     return this.http.put<Permission[]>(
      `${this.baseUrl}/${userId}/permissions`,
     {permissions}
    );
  }*/
  addPermission(userId: string,  permissions: string[]): Observable<Permission[]> {
     return this.http.put<Permission[]>(
      `${this.baseUrl}/${userId}/permissions`,
     {permissions}
    );
  }

/**
 * 
 * @param userId 
 * @param roleId 
 * @returns 
 */
  removeRole(userId: string, roleId: string): Observable<void> {
    return this.http.delete<void>(
      `${this.baseUrl}/${userId}/roles/${roleId}`
    );
  }
}