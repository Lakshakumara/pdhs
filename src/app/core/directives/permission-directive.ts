import { Directive, Input, TemplateRef, ViewContainerRef, effect, signal } from '@angular/core';
import { UserFacadeService } from '../services/user-facade.service';
import { Permission } from '../constants/permissions';

export type AuthStrategy = 'ANY' | 'ALL';

@Directive({
  selector: '[appHasPermission]',
  standalone: true
})
/**
 * Usage:
 * <button *appHasPermission="permission.USER_UPDATE"/>

<button *appHasPermission="[permission.USER_CREATE, permission.USER_UPDATE]"/>

<div *appHasPermission="[permission.USER_CREATE, permission.USER_UPDATE]; match: 'ALL'"/>
 */
export class HasPermissionDirective {
  // Track inputs as signals for clean reactive evaluation
  private requiredPermissions = signal<Permission[]>([]);
  private strategy = signal<AuthStrategy>('ANY');

  // Captures: *appHasPermission="permission.USER_UPDATE" or [permission.A, permission.B]
  @Input({ required: true }) set appHasPermission(value: Permission | Permission[]) {
    this.requiredPermissions.set(Array.isArray(value) ? value : [value]);
  }

  // Captures the optional: match: 'ALL' or match: 'ANY'
  @Input() set appHasPermissionMatch(strategy: AuthStrategy) {
    this.strategy.set(strategy);
  }

  constructor(
    private tpl: TemplateRef<any>,
    private vcr: ViewContainerRef,
    private userFacade: UserFacadeService
  ) {
    effect(() => {
      this.vcr.clear();

      const userPermissions = this.userFacade.permissions() ?? [];
      const required = this.requiredPermissions();
      const currentStrategy = this.strategy();

      if (required.length === 0) return;

      const hasAccess = currentStrategy === 'ALL'
        ? required.every(p => userPermissions.includes(p))
        : required.some(p => userPermissions.includes(p));

      if (hasAccess) {
        this.vcr.createEmbeddedView(this.tpl);
      }
    });
  }
}