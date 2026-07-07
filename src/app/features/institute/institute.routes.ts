import { Routes } from '@angular/router';
import { InstituteComponent } from './institute.component';
import { AdminGuard } from '../../core/guards/admin.guard';

export const instituteRoutes: Routes = [
  {
    path: '',
    component: InstituteComponent,
    canActivate: [AdminGuard],
    children: [
      { path: '', component: InstituteComponent,canActivate: [AdminGuard] },
      { path: 'add', component: InstituteComponent, canActivate: [AdminGuard] },
      { path: 'edit/:id', component: InstituteComponent, canActivate: [AdminGuard] }
    ]
  }
];