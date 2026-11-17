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

/** Response of POST /auth/impersonate/:userId. */
export interface ImpersonateResponse {
  token: string;
  user: UserDto;
  impersonating: true;
  expiresIn: string;
}

/** What the impersonation banner renders (persisted across refresh). */
export interface ImpersonationMeta {
  targetFullName: string;
  targetUsername: string;
  targetRole: string;
  startedAt: string;
}

interface JwtPayload {
  sub?: string;
  exp?: number; // unix seconds
  iat?: number;
  [key: string]: any;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly baseUrl = environment.apiUrl + '/auth';
  private readonly ME_URL = environment.apiUrl + '/users/me';
  private readonly TOKEN_KEY = 'auth_token';
  /** Admin's real token, stashed here while a "View As" session runs. */
  private readonly BACKUP_TOKEN_KEY = 'auth_token_backup';
  private readonly IMPERSONATION_KEY = 'impersonation_meta';

  /** Reactive flag — true once a token exists AND has not expired. */
  readonly isLoggedIn = signal<boolean>(this.hasValidToken());

  /**
   * True while an admin is viewing the app as another user. Derived from
   * localStorage so it survives a hard page refresh mid-impersonation.
   */
  readonly isImpersonating = signal<boolean>(!!localStorage.getItem(this.BACKUP_TOKEN_KEY));

  readonly impersonationMeta = signal<ImpersonationMeta | null>(this.readImpersonationMeta());

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
      tap((response) => {
        if (response.token && response.user) {
          localStorage.setItem(this.TOKEN_KEY, response.token);
          this.isLoggedIn.set(true);
          this.applySession(response.user);
        }
      }),
      catchError((error) => {
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
    // Ending a "View As" session must also report it to the backend so
    // the audit trail has a matching IMPERSONATE_END row.
    if (this.isImpersonating()) {
      this.endImpersonation({ navigate: true });
      return;
    }
    this.clearAuthState();
    this.router.navigate(['/login']);
  }

  // ───────────────────────────────────────────────────────────────────────
  // IMPERSONATION ("View As")
  // ───────────────────────────────────────────────────────────────────────

  /**
   * Starts an audited "View As" session as `userId`.
   * The admin's own token is stashed (auth_token_backup) so Exit can
   * restore it; the returned 15m token becomes the active one.
   */
  impersonate(userId: string): Observable<ImpersonateResponse> {
    return this.http.post<ImpersonateResponse>(`${this.baseUrl}/impersonate/${userId}`, {}).pipe(
      tap((res) => {
        if (!res.token || !res.user) return;

        // Stash the REAL session first — nothing else may overwrite it.
        const adminToken = this.getToken();
        if (adminToken) {
          localStorage.setItem(this.BACKUP_TOKEN_KEY, adminToken);
        }

        localStorage.setItem(this.TOKEN_KEY, res.token);
        this.isLoggedIn.set(true);

        const firstRole = res.user.roles?.[0];
        const meta: ImpersonationMeta = {
          targetFullName: res.user.fullName,
          targetUsername: res.user.username,
          targetRole: firstRole?.role ?? 'UNKNOWN',
          startedAt: new Date().toISOString(),
        };
        localStorage.setItem(this.IMPERSONATION_KEY, JSON.stringify(meta));

        this.isImpersonating.set(true);
        this.impersonationMeta.set(meta);

        // Session now describes the TARGET user (their roles/permissions
        // drive nav, directives and the x-role headers).
        this.applySession(res.user);
        // Force a fresh /me on the next guard activation.
        this.restoreSession$ = null;
      }),
    );
  }

  /**
   * Ends the "View As" session: reports it to the backend (audit
   * bookend), restores the stashed admin token and re-applies the real
   * session via /users/me.
   *
   * `navigate` is used by the logout path; the banner's Exit button
   * stays on the current page (permissions may differ, so the router
   * re-evaluates guards on the next navigation).
   */
  endImpersonation(opts: { navigate?: boolean } = {}): void {
    const impersonationToken = this.getToken();
    const backupToken = localStorage.getItem(this.BACKUP_TOKEN_KEY);

    // Best-effort audit bookend — never blocks the exit itself.
    if (impersonationToken) {
      this.http.post(`${this.baseUrl}/impersonate/end`, {}).subscribe({ error: () => {} });
    }

    // Drop the impersonating session state.
    localStorage.removeItem(this.IMPERSONATION_KEY);
    this.isImpersonating.set(false);
    this.impersonationMeta.set(null);
    this.restoreSession$ = null;

    if (backupToken) {
      localStorage.setItem(this.TOKEN_KEY, backupToken);
      localStorage.removeItem(this.BACKUP_TOKEN_KEY);
      this.isLoggedIn.set(true);
      // Drop the TARGET user's session so ensureSession() doesn't
      // short-circuit on the stale facade entry and actually re-fetch
      // /users/me with the restored admin token.
      this.userFacade.clearSession();
      this.restoreSession$ = null;
      // Re-populate the facade with the admin's real session.
      this.ensureSession().subscribe({
        next: (ok) => {
          if (!ok) this.clearAuthState();
          if (opts.navigate) this.router.navigate(['/login']);
        },
        error: () => {
          this.clearAuthState();
          if (opts.navigate) this.router.navigate(['/login']);
        },
      });
    } else {
      // Backup missing (e.g. storage cleared) — fall back to a clean logout.
      this.clearAuthState();
      this.router.navigate(['/login']);
    }
  }

  /**
   * Called by the error interceptor when an impersonation token is
   * rejected (15m expiry): silently unwinds back to the admin session
   * instead of stranding the user on a dead token.
   */
  handleImpersonationExpiry(): void {
    if (!this.isImpersonating()) return;
    this.endImpersonation();
  }

  private readImpersonationMeta(): ImpersonationMeta | null {
    try {
      const raw = localStorage.getItem(this.IMPERSONATION_KEY);
      return raw ? (JSON.parse(raw) as ImpersonationMeta) : null;
    } catch {
      return null;
    }
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
          .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
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
        map((user) => {
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
    const permissions =
      user.permissions
        .filter((p) => {
          return !p.expiresAt || new Date(p.expiresAt) > new Date();
        })
        .map((p) => p.permission) ?? [];

    const firstRole = user.roles?.[0];

    this.userFacade.setSession(
      user,
      {
        role: firstRole.role,
        scopeType: firstRole.scopeType,
        scopeId: firstRole.scopeId,
      },
      permissions,
    );
  }

  private clearAuthState() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.BACKUP_TOKEN_KEY);
    localStorage.removeItem(this.IMPERSONATION_KEY);
    this.isLoggedIn.set(false);
    this.isImpersonating.set(false);
    this.impersonationMeta.set(null);
    this.restoreSession$ = null;
    this.userFacade.clearSession();
  }
}
