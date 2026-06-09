import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'inventory',
    loadComponent: () => import('./features/inventory/inventory.component').then(m => m.InventoryComponent)
  },
  {
    path: 'equipment',
    loadComponent: () => import('./features/equipment/equipment.component').then(m => m.EquipmentComponent)
  },
  {
    path: 'repairs',
    loadComponent: () => import('./features/repairs/repairs.component').then(m => m.RepairsComponent)
  },
  {
    path: 'procurement',
    loadComponent: () => import('./features/procurement/procurement.component').then(m => m.ProcurementComponent)
  },
  {
    path: 'audit',
    loadComponent: () => import('./features/audit/audit.component').then(m => m.AuditComponent)
  },
  {
    path: 'institute',
    loadChildren: () => import('./features/institute/institute.routes').then(m => m.instituteRoutes)
  },
   {
    path: 'usermanagement',
    loadComponent: () => import('./features/users/users.component').then(m => m.UsersComponent)
  },
  { path: '**', redirectTo: 'dashboard' }
];
