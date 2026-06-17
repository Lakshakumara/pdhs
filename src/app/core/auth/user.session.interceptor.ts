import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { UserFacadeService } from '../services/user-facade.service';
import { AuthService } from './auth.service';

/**
 * Attaches auth + access-scope context to every outgoing request:
 *
 *  - Authorization: Bearer <jwt>
 *  - x-role:        the user's currently active role (e.g. ADMIN_RDHS)
 *  - x-scope-type:  PDHS | RDHS | INSTITUTE
 *  - x-scope-id:    districtId / institutionId, or '' for PDHS scope
 *
 * The backend uses x-role + x-scope-type + x-scope-id (alongside the
 * verified JWT) to enforce row-level access — e.g. an ADMIN_RDHS user
 * scoped to district "dist_rat" should only see/modify institutions
 * within that district.
 *
 * NOTE: these headers are only meaningful once UserFacadeService has a
 * populated session. authGuard's ensureSession() guarantees this is
 * the case before any guarded route's component can fire a request —
 * see auth.guard.ts.
 */
export const userSessionInterceptor: HttpInterceptorFn = (req, next) => {
  const userFacade = inject(UserFacadeService);
  const authService = inject(AuthService);

  const session = userFacade.currentSession();
  const token = authService.getToken();

  const headers: Record<string, string> = {};

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  /*if (session?.activeRole) {
    headers['x-role'] = session.activeRole.role;
    headers['x-scope-type'] = session.activeRole.scopeType;
    headers['x-scope-id'] = session.activeRole.scopeId ?? '';
  }*/

  // Nothing to add (e.g. unauthenticated request to /auth/login) —
  // pass through untouched.
  if (Object.keys(headers).length === 0) {
    return next(req);
  }
  console.log('Request headers', req);
  console.log('Headers', headers);
  return next(req.clone({ setHeaders: headers }));
};
