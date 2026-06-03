import { Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  UrlTree,
  Router
} from '@angular/router';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { BiomedStateService } from '../services/biomed-state.service';
import { UserFacadeService } from '../services/user-facade.service';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
  constructor(private userFacade: UserFacadeService,
    private biomedStateService: BiomedStateService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
        if ( this.userFacade.hasAnyRole(['SUPER_ADMIN_PDHS'])) {//&& user.role === UserRole.Admin
          return true;
        } else {
          // Redirect to dashboard or login if not admin
          return this.router.createUrlTree(['/dashboard']);
        }
      }
}