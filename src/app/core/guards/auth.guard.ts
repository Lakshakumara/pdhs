import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from '../auth/auth.service';

/**
 * Guards the authenticated app shell ('' parent route in app.routes.ts).
 *
 * Unlike a plain `hasToken()` check, this calls `ensureSession()` which:
 *  1. Returns false immediately if no valid (non-expired) token exists.
 *  2. If a token exists but UserFacadeService has no session yet
 *     (e.g. hard page refresh on /equipment), fetches /api/users/me
 *     and populates the session BEFORE the route activates.
 *  3. If /me rejects the token, clears auth state and returns false.
 *
 * This ensures the x-role / x-scope-type / x-scope-id headers added by
 * userSessionInterceptor are populated correctly on the very first
 * request fired by the freshly-loaded component — not just on
 * subsequent requests after the session happens to load.
 */
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.ensureSession().pipe(
    map(isValid => {
      if (isValid) return true;

      return router.createUrlTree(['/login'], {
        queryParams: { returnUrl: state.url },
      });
    }),
  );
};
