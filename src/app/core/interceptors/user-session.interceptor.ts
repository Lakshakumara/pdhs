import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { UserFacadeService } from '../services/user-facade.service';

/**
 * Attaches the caller's identity to every request:
 *  - Authorization: Bearer <token>
 *  - x-role / x-scope-type / x-scope-id — the ACTIVE role selection,
 *    validated server-side by ActiveRoleGuard against the roles[] claims
 *    embedded in the JWT (no DB round-trip).
 *
 * Without the role headers ActiveRoleGuard silently falls back to
 * roles[0], so a user who switched scope in the UI would still be
 * treated as their first role.
 */
export const userSessionInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const userFacade = inject(UserFacadeService);

  const token = authService.getToken();

  const headers: Record<string, string> = {};

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const activeRole = userFacade.activeRole();
  if (token && activeRole) {
    headers['x-role'] = activeRole.role;
    headers['x-scope-type'] = activeRole.scopeType;
    if (activeRole.scopeId) {
      headers['x-scope-id'] = activeRole.scopeId;
    }
  }

  if (Object.keys(headers).length === 0) {
    return next(req);
  }
  return next(req.clone({ setHeaders: headers }));
};
