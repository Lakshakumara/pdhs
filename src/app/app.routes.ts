import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./features/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard]
  },
  {
    path: 'inventory',
    loadComponent: () => import('./features/inventory/inventory.component').then(m => m.InventoryComponent),
    canActivate: [authGuard]
  },
  {
    path: 'equipment',
    loadComponent: () => import('./features/equipment/equipment.component').then(m => m.EquipmentComponent),
    canActivate: [authGuard]
  },
  {
    path: 'repairs',
    loadComponent: () => import('./features/repairs/repairs.component').then(m => m.RepairsComponent),
    canActivate: [authGuard]
  },
  {
    path: 'procurement',
    loadComponent: () => import('./features/procurement/procurement.component').then(m => m.ProcurementComponent),
    canActivate: [authGuard]
  },
  {
    path: 'audit',
    loadComponent: () => import('./features/audit/audit.component').then(m => m.AuditComponent),
    canActivate: [authGuard]
  },
  {
    path: 'institute',
    loadChildren: () => import('./features/institute/institute.routes').then(m => m.instituteRoutes),
    canActivate: [authGuard]
  },
  {
    path: 'usermanagement',
    loadComponent: () => import('./features/users/users.component').then(m => m.UsersComponent),
    canActivate: [authGuard]
  },
  {
    path: 'admin',
    loadComponent: () => import('./features/admin/admin.component').then(m => m.AdminComponent),
    canActivate: [authGuard]
  },
  { path: '**', redirectTo: 'dashboard' }
];
