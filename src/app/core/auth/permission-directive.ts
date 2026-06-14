import { Directive, TemplateRef, ViewContainerRef, effect, Input } from "@angular/core";
import { UserFacadeService } from "../services/user-facade.service";
import { Permission } from "./permission.types";
@Directive({
  selector: '[appHasPermission]',
  standalone: true
})
export class HasPermissionDirective {

  constructor(
    private tpl: TemplateRef<any>,
    private vcr: ViewContainerRef,
    private userFacade: UserFacadeService
  ) {

    effect(() => {
      this.vcr.clear();

      const has = this.userFacade.permissions()?.includes(this.appHasPermission);

      if (has) {
        this.vcr.createEmbeddedView(this.tpl);
      }
    });
  }

  @Input() appHasPermission!: Permission;
}