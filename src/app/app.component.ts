import { Component, OnInit, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BiomedStateService } from './core/services/biomed-state.service';
import { User, UserRole } from './core/models/biomed.interface';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class App implements OnInit {
  protected readonly title = signal('pdhs');
  
  public currentUser: User | null = null;
  public users: User[] = [];
  public selectedUserId = '';
  public isDarkMode = false;
  public isSidebarCollapsed = false;

  constructor(private stateService: BiomedStateService) {}

  ngOnInit() {
    this.stateService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.selectedUserId = user.id;
      }
    });

    this.stateService.users$.subscribe(list => {
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
    this.stateService.switchUser(userId);
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
    if (!this.currentUser) return false;
    
    const role = this.currentUser.role;
    
    switch (module) {
      case 'dashboard':
      case 'inventory':
        return true; // Everyone can view dashboard and inventory list
      
      case 'repairs':
        // Everyone except Procurement Officers can view/manage repairs
        return role !== 'Procurement Officer';
        
      case 'procurement':
        // Only Admin, Procurement Officers, and PDHS Viewers can access procurement
        return role === 'System Administrator' || role === 'Procurement Officer' || role === 'PDHS Viewer';
        
      case 'audit':
        // Only Admin can view full audit logs
        return role === 'System Administrator';
        
      default:
        return false;
    }
  }
}
