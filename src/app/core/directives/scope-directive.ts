import {
  Directive,
  Input,
  TemplateRef,
  ViewContainerRef,
  effect,
} from '@angular/core';
import { UserFacadeService } from '../services/user-facade.service';
import { ScopeType } from '../models/permission.types';

@Directive({
  selector: '[appHasScope]',
  standalone: true,
})
export class HasScopeDirective {

  private scopes: ScopeType[] = [];

  constructor(
    private tpl: TemplateRef<any>,
    private vcr: ViewContainerRef,
    private userFacade: UserFacadeService
  ) {
    effect(() => this.updateView());
  }

  @Input()
  set appHasScope(value: ScopeType | ScopeType[]) {
    this.scopes = Array.isArray(value) ? value : [value];
    this.updateView();
  }

  private updateView(): void {
    this.vcr.clear();

    const currentScope =
      this.userFacade.currentSession()?.activeRole.scopeType;

    if (!currentScope) {
      return;
    }

    if (this.scopes.includes(currentScope)) {
      this.vcr.createEmbeddedView(this.tpl);
    }
  }
}