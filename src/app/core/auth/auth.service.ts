import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, tap, map, catchError, throwError, shareReplay } from 'rxjs';
import { Router } from '@angular/router';
import { UserFacadeService } from '../services/user-facade.service';
import { UserDto } from '../models/biomed.interface';
import { environment } from '../../../environments/environment';

export interface LoginResponse {
  token: string;
  user: UserDto;
}

interface JwtPayload {
  sub?: string;
  exp?: number;  // unix seconds
  iat?: number;
  [key: string]: any;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly baseUrl = environment.apiUrl +'/auth';
  private readonly ME_URL = environment.apiUrl+'/users/me';
  private readonly TOKEN_KEY = 'auth_token';

  /** Reactive flag — true once a token exists AND has not expired. */
  readonly isLoggedIn = signal<boolean>(this.hasValidToken());

  /**
   * Caches the in-flight/most recent /me restoration call so that
   * multiple guard activations (parent + child routes on the same
   * navigation) don't each fire their own request.
   */
  private restoreSession$: Observable<boolean> | null = null;

  constructor(
    private http: HttpClient,
    private router: Router,
    private userFacade: UserFacadeService,
  ) {}

  // ───────────────────────────────────────────────────────────────────────
  // LOGIN / LOGOUT
  // ───────────────────────────────────────────────────────────────────────

  login(username: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.baseUrl}/login`, { username, password }).pipe(
      tap(response => {
        if (response.token && response.user) {
          localStorage.setItem(this.TOKEN_KEY, response.token);
          this.isLoggedIn.set(true);
          this.applySession(response.user);
        }
      }),
      catchError(error => {
        console.error('Login failed', error);
        return throwError(() => error);
      }),
    );
  }

  /**
   * Clears auth state and navigates to /login. Call this from UI
   * actions (logout button). For "token rejected by backend" cases
   * during session restoration, use clearAuthState() instead — it
   * doesn't navigate, letting the route guard handle the redirect
   * (avoids double-navigation).
   */
  logout() {
    this.clearAuthState();
    this.router.navigate(['/login']);
  }

  // ───────────────────────────────────────────────────────────────────────
  // TOKEN ACCESS
  // ───────────────────────────────────────────────────────────────────────

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  hasToken(): boolean {
    return !!this.getToken();
  }

  // ───────────────────────────────────────────────────────────────────────
  // JWT VALIDATION (client-side, UX-only — backend remains source of truth)
  // ───────────────────────────────────────────────────────────────────────

  /**
   * Synchronous check used by route guards and template bindings:
   * does a token exist AND is it not past its `exp` claim?
   *
   * This does NOT verify the signature — only the backend can do that.
   * It exists purely to avoid sending requests we already know are dead
   * and to drive UI state instantly (no network round-trip).
   */
  isAuthenticated(): boolean {
    return this.hasValidToken();
  }

  hasValidToken(): boolean {
    const token = this.getToken();
    if (!token) return false;

    const payload = this.decodeToken(token);
    if (!payload?.exp) return true; // no exp claim — let backend decide

    return Date.now() < payload.exp * 1000;
  }

  /** Decodes a JWT payload (base64url) without verifying its signature. */
  decodeToken(token: string): JwtPayload | null {
    try {
      const payloadSegment = token.split('.')[1];
      if (!payloadSegment) return null;

      const base64 = payloadSegment.replace(/-/g, '+').replace(/_/g, '/');
      const json = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
          .join(''),
      );
      return JSON.parse(json);
    } catch {
      return null;
    }
  }

  /** Returns the token's expiry as a Date, or null if no exp claim / no token. */
  getTokenExpiry(): Date | null {
    const token = this.getToken();
    if (!token) return null;
    const payload = this.decodeToken(token);
    return payload?.exp ? new Date(payload.exp * 1000) : null;
  }

  // ───────────────────────────────────────────────────────────────────────
  // SESSION RESTORATION — used by authGuard
  // ───────────────────────────────────────────────────────────────────────

  /**
   * Ensures UserFacadeService has a populated session before a guarded
   * route activates. This is what makes the interceptor's
   * `x-role` / `x-scope-type` / `x-scope-id` headers reliable on the
   * VERY FIRST request after a hard page refresh — without this, the
   * guard would pass synchronously (token exists) but the session
   * wouldn't be populated yet, so those headers would be empty on
   * whatever request the freshly-loaded component fires in ngOnInit.
   *
   * Returns an Observable<boolean>:
   *  - true  → valid token AND session is populated (or was already)
   *  - false → no valid token, or backend rejected it (/me failed)
   *
   * Caches the in-flight observable via shareReplay so parent + child
   * route guards on the same navigation share a single /me call.
   */
  ensureSession(): Observable<boolean> {
    if (!this.hasValidToken()) {
      this.isLoggedIn.set(false);
      return of(false);
    }

    // Session already populated this app lifetime — nothing to do.
    if (this.userFacade.currentUser()) {
      this.isLoggedIn.set(true);
      return of(true);
    }

    if (!this.restoreSession$) {
      this.restoreSession$ = this.http.get<UserDto>(this.ME_URL).pipe(
        map(user => {
          this.applySession(user);
          this.isLoggedIn.set(true);
          return true;
        }),
        catchError(() => {
          // Token rejected by backend (expired/revoked) — clear state
          // but DON'T navigate here; let the guard redirect to /login
          // with a returnUrl.
          this.clearAuthState();
          return of(false);
        }),
        shareReplay(1),
      );
    }

    return this.restoreSession$;
  }

  // ───────────────────────────────────────────────────────────────────────
  // INTERNAL
  // ───────────────────────────────────────────────────────────────────────

  private applySession(user: UserDto) {
    const firstRole = user.roles?.[0];
    this.userFacade.setSession(
      user,
      {
        role: firstRole.role,
        scopeType: firstRole.scopeType,
        scopeId: firstRole.scopeId,
      },
      firstRole?.permission ?? [],
    );
  }

  private clearAuthState() {
    localStorage.removeItem(this.TOKEN_KEY);
    this.isLoggedIn.set(false);
    this.restoreSession$ = null;
    this.userFacade.clearSession();
  }
}
