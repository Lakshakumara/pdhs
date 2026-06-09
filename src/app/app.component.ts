import { Component, effect, OnInit, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BiomedStateService } from './core/services/biomed-state.service';
import { UserDto, } from './core/models/biomed.interface';
import { UserFacadeService } from './core/services/user-facade.service';
import { QueryService } from './core/services/query.service';
import { ToastModule } from 'primeng/toast';
import { BrowserModule } from '@angular/platform-browser';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, FormsModule, ToastModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class App implements OnInit {
  protected readonly title = signal('pdhs');

  public users: UserDto[] = [];
  public selectedUserId?: string;
  public isDarkMode = false;
  public isSidebarCollapsed = false;

  constructor(public userFacade: UserFacadeService,
    private stateService: BiomedStateService,
    public apiService: QueryService) {

    this.userFacade.setSessionById('usr_admin');

  }
  ngOnInit() {
    this.stateService.usersDto$.subscribe(list => {
      this.users = list;
    });

    // Check system preference for dark mode
    if (localStorage.getItem('theme') === 'dark' ||
      (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      this.isDarkMode = true;
      document.documentElement.classList.add('dark');
    } else {
      this.isDarkMode = false;
      document.documentElement.classList.remove('dark');
    }
  }

  public switchRole(userId: string) {
    this.userFacade.setSessionById(userId)
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

  // Permission checks for UI modules
  public hasAccess(module: string): boolean {
    if (!this.userFacade.currentUser()) return false;

    switch (module) {
      case 'dashboard':
      case 'inventory':
        return true; // Everyone can view dashboard and inventory list

      case 'repairs':
        // Everyone except Procurement Officers can view/manage repairs
        return !this.userFacade.hasAnyRole(['PROCUREMENT_OFFICER']);

      case 'procurement':
        // Only Admin, Procurement Officers, and PDHS Viewers can access procurement
        return this.userFacade.hasAnyRole(['SUPER_ADMIN_PDHS', 'PROCUREMENT_OFFICER', 'VIEWER_PDHS']);//

      case 'audit':
        // Only Admin can view full audit logs
        return this.userFacade.hasAnyRole(['SUPER_ADMIN_PDHS']);

      default:
        return false;
    }
  }

}
