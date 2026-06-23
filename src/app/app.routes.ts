import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { ShellComponent } from './layout/shell.component';

export const routes: Routes = [

  // ─────────────────────────────────────────────────────────────────────
  // PUBLIC: Login page
  // Rendered standalone — NO sidebar/header. This sits outside the
  // ShellComponent entirely, so it gets a clean full-screen layout
  // appropriate for a medical app's entry point.
  // ─────────────────────────────────────────────────────────────────────
  {
    path: 'login',
    loadComponent: () => import('./auth/login/login.component').then(m => m.LoginComponent),
  },

  // ─────────────────────────────────────────────────────────────────────
  // AUTHENTICATED APP SHELL
  // Every protected feature route is nested as a child here.
  // ShellComponent renders the sidebar + header + its own <router-outlet>,
  // into which these children are loaded.
  //
  // authGuard runs on this parent route and therefore protects ALL
  // children below. Ensure authGuard redirects unauthenticated users
  // to '/login' (e.g. `return router.createUrlTree(['/login']);`).
  // ─────────────────────────────────────────────────────────────────────
  {
    path: '',
    loadComponent: () => import('./layout/shell.component').then(m => m.ShellComponent),
    canActivate: [authGuard],
    children: [
      // Default landing page once inside the shell
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
      },
      {
        path: 'org',
        loadComponent: () => import('./layout/organization-chart/organization-chart.component').then(m => m.OrganizationChart),
      },
      {
        path: 'inventory',
        loadComponent: () => import('./features/inventory/inventory.component').then(m => m.InventoryComponent),
      },
      {
        path: 'equipment',
        loadComponent: () => import('./features/equipment/equipment.component').then(m => m.EquipmentComponent),
      },
      {
        path: 'repairs',
        loadComponent: () => import('./features/repairs/repairs.component').then(m => m.RepairsComponent),
      },
      {
        path: 'procurement',
        loadComponent: () => import('./features/procurement/procurement.component').then(m => m.ProcurementComponent),
      },
      {
        path: 'audit',
        loadComponent: () => import('./features/audit/audit.component').then(m => m.AuditComponent),
      },
      {
        path: 'institute',
        loadChildren: () => import('./features/institute/institute.routes').then(m => m.instituteRoutes),
      },
      {
        path: 'usermanagement',
        loadComponent: () => import('./features/users/users.component').then(m => m.UsersComponent),
      },
      {
        path: 'admin',
        loadComponent: () => import('./features/admin/admin.component').then(m => m.AdminComponent),
      },
      {
        path: 'admin/users',
        loadComponent: () => import('./features/users/users.component').then(m => m.UsersComponent),
      },
      {
        path: 'test',
        loadComponent: () => import('./features/test/test.component').then(m => m.Test),
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────
  // FALLBACK
  // Unknown paths fall back to the shell's dashboard. If the user isn't
  // authenticated, authGuard on the '' parent route above will catch
  // this and redirect to /login.
  // ─────────────────────────────────────────────────────────────────────
  { path: '**', redirectTo: 'dashboard' },
];
