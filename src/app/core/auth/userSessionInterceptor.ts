import { HttpInterceptorFn } from "@angular/common/http";
import { inject } from "@angular/core";
import { UserFacadeService } from "../services/user-facade.service";

export const userSessionInterceptor: HttpInterceptorFn = (req, next) => {

  const authFacade = inject(UserFacadeService);

  const session = authFacade.currentSession();
  if (!session) {
    return next(req);
  }
  //console.log('SESSION INTERCEPTOR', session);
 /* const activeRole = {
    'x-role': session.activeRole.role,
    'x-scope-type': session.activeRole.scopeType,
    'x-scope-id': session.activeRole.scopeId ?? ''
  }*/
  const modifiedReq = req.clone({
    setHeaders: {
      'x-role': session.activeRole.role,
      'x-scope-type': session.activeRole.scopeType,
      'x-scope-id': session.activeRole.scopeId ?? ''
    }
  });

  return next(modifiedReq);
};