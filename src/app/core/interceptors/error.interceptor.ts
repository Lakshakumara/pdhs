import {
    HttpErrorResponse,
    HttpInterceptorFn
} from '@angular/common/http';

import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { NotificationService } from '../services/notification.service';

export const errorInterceptor:
    HttpInterceptorFn = (req, next) => {

        const notify =
            inject(NotificationService);

        return next(req).pipe(

            catchError(
                (error: HttpErrorResponse) => {

                    switch (error.status) {

                        case 400:

                            notify.error(
                                'Validation Error',
                                error.error?.message ??
                                'Invalid request'
                            );

                            break;

                        case 401:

                            notify.error(
                                'Unauthorized',
                                'Please login again'
                            );

                            break;

                        case 403:

                            notify.error(
                                'Access Denied',
                                'You do not have permission'
                            );

                            break;

                        case 404:

                            notify.error(
                                'Not Found',
                                'Requested resource not found'
                            );

                            break;

                        case 500:

                            notify.error(
                                'Server Error',
                                'Internal server error'
                            );

                            break;

                        default:

                            notify.error(
                                'Error',
                                error.message
                            );
                    }

                    return throwError(
                        () => error
                    );
                }
            )
        );
    };