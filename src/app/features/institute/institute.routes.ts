import { Routes } from '@angular/router';
import { InstituteComponent } from './institute.component';
import { InstituteListComponent } from './institute-list.component';
import { InstituteFormComponent } from './institute-form.component';
import { AdminGuard } from '../../core/guards/admin.guard';

export const instituteRoutes: Routes = [
  {
    path: '',
    component: InstituteComponent,
    canActivate: [AdminGuard],
    children: [
      { path: '', component: InstituteListComponent, canActivate: [AdminGuard] },
      { path: 'add', component: InstituteFormComponent, canActivate: [AdminGuard] },
      { path: 'edit/:id', component: InstituteFormComponent, canActivate: [AdminGuard] }
    ]
  }
];