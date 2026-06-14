import { HttpInterceptorFn } from "@angular/common/http";
import { inject } from "@angular/core";
import { UserFacadeService } from "../services/user-facade.service";

export const userSessionInterceptor: HttpInterceptorFn = (req, next) => {

  const authFacade = inject(UserFacadeService);
  const token = localStorage.getItem('auth_token');

  const session = authFacade.currentSession();
  
  const headers: any = {};
  
  if (session?.activeRole) {
    headers['x-role'] = session.activeRole.role;
    headers['x-scope-type'] = session.activeRole.scopeType;
    headers['x-scope-id'] = session.activeRole.scopeId ?? '';
  }
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const modifiedReq = req.clone({
    setHeaders: headers
  });

  return next(modifiedReq);
};