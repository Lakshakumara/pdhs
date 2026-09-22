import { Component, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { UserFacadeService } from '../core/services/user-facade.service';
import { AuthService } from '../core/auth/auth.service';
import { HasPermissionDirective } from '../core/directives/permission-directive';
import { RoleType } from "../core/models/permission.types";
import { Permission } from '../core/constants/permissions';

/**
 * ShellComponent — the authenticated application layout.
 *
 * Contains the sidebar navigation, top header (theme toggle), and a
 * <router-outlet> for all protected feature routes (dashboard,
 * equipment, repairs, etc).
 *
 * Mounted only for routes nested under the guarded '' parent route
 * in app.routes.ts. The /login route sits OUTSIDE this shell, so it
 * renders full-screen without any sidebar/header chrome.
 *
 * NOTE: the dev "switch role" picker that used to live here has moved
 * to LoginComponent's "Dev Quick Login" panel (gated by
 * environment.production). That panel performs a REAL login via
 * AuthService, so the session set by authGuard.ensureSession() is no
 * longer overwritten by a mock `switchRole('usr_admin')` call on every
 * shell load — which was silently breaking the x-role/x-scope-*
 * interceptor headers for real authenticated users.
 */
@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    HasPermissionDirective,
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
  ],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.css',
})
export class ShellComponent implements OnInit {
  public permission = Permission;
  public isDarkMode = false;
  public isSidebarCollapsed = false;

  constructor(
    public userFacade: UserFacadeService,
    private authService: AuthService,
  ) { }

  ngOnInit() {
    if (
      localStorage.getItem('theme') === 'dark' ||
      (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)
    ) {
      this.isDarkMode = true;
      document.documentElement.classList.add('dark');
    } else {
      this.isDarkMode = false;
      document.documentElement.classList.remove('dark');
    }
  }

  public logout() {
    this.authService.logout();
  }

  public toggleDarkMode() {
    this.isDarkMode = !this.isDarkMode;
    if (this.isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }

  public toggleSidebar() {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  public hasAccess(module: string): boolean {
    if (!this.userFacade.currentUser()) return false;

    switch (module) {
      
      case 'audit':
      case 'admin':
        return this.userFacade.hasAnyRole([RoleType.SUPER_ADMIN_PDHS, RoleType.ADMIN_PDHS]);

      default:
        return false;
    }
  }
}
