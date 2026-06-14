import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { UserFacadeService } from '../services/user-facade.service';
import { UserDto } from '../models/biomed.interface';

export interface LoginResponse {
  token: string;
  user: UserDto;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly baseUrl = 'http://localhost:3000/api/auth';
  private readonly TOKEN_KEY = 'auth_token';

  // We can track auth state explicitly
  readonly isLoggedIn = signal<boolean>(this.hasToken());

  constructor(
    private http: HttpClient,
    private router: Router,
    private userFacade: UserFacadeService
  ) {
    this.restoreSession();
  }

  login(username: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.baseUrl}/login`, { username, password }).pipe(
      tap(response => {
        if (response.token && response.user) {
          localStorage.setItem(this.TOKEN_KEY, response.token);
          this.isLoggedIn.set(true);
          
          const firstRole = response.user.roles[0];
          this.userFacade.setSession(response.user, {
            role: firstRole?.role ?? 'VIEWER_PDHS',
            scopeType: firstRole?.scopeType ?? 'PDHS',
            scopeId: firstRole?.scopeId
          }, firstRole.permission);
        }
      }),
      catchError(error => {
        console.error('Login failed', error);
        return throwError(() => error);
      })
    );
  }

  logout() {
    localStorage.removeItem(this.TOKEN_KEY);
    this.isLoggedIn.set(false);
    this.userFacade.clearSession();
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  hasToken(): boolean {
    return !!this.getToken();
  }

  private restoreSession() {
    if (this.hasToken()) {
      // Typically we'd fetch /api/users/me here, but for simplicity,
      // if token exists we can verify it by fetching current user
      this.http.get<UserDto>('http://localhost:3000/api/users/me').subscribe({
        next: (user) => {
          const firstRole = user.roles[0];
          this.userFacade.setSession(user, {
            role: firstRole?.role ?? 'VIEWER_PDHS',
            scopeType: firstRole?.scopeType ?? 'PDHS',
            scopeId: firstRole?.scopeId
          }, firstRole.permission);
          this.isLoggedIn.set(true);
        },
        error: () => {
          this.logout(); // Token invalid or expired
        }
      });
    }
  }
}
