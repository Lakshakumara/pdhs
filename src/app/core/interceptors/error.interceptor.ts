import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';

import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { NotificationService } from '../services/notification.service';
import { AuthService } from '../auth/auth.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notify = inject(NotificationService);
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // A 401 while "View As" is running means the 15-minute
      // impersonation token expired — unwind back to the admin session
      // instead of stranding the user on a dead token.
      if (error.status === 401 && authService.isImpersonating()) {
        authService.handleImpersonationExpiry();
        return throwError(() => error);
      }

      switch (error.status) {
        case 400:
          notify.error('Validation Error', error.error?.message ?? 'Invalid request');

          break;

        case 401:
          notify.error('Unauthorized', 'Please login again');

          break;

        case 403:
          notify.error('Access Denied', 'You do not have permission');

          break;

        case 404:
          notify.error('Not Found', 'Requested resource not found');

          break;

        case 500:
          notify.error('Server Error', 'Internal server error');

          break;

        default:
          notify.error('Error', error.message);
      }

      return throwError(() => error);
    }),
  );
};
