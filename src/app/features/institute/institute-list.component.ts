import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { BiomedStateService } from '../../core/services/biomed-state.service';
import { Institution } from '../../core/models/biomed.interface';

@Component({
  selector: 'app-institute-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="institute-list">
      <h2>Institute List</h2>
      <button (click)="addInstitute()" class="btn btn-primary">Add New Institute</button>
      <table class="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let institute of institutions$ | async">
            <td>{{ institute.id }}</td>
            <td>{{ institute.name }}</td>
            <td>
              <button (click)="editInstitute(institute.id)" class="btn btn-sm btn-info">Edit</button>
              <button (click)="deleteInstitute(institute.id)" class="btn btn-sm btn-danger">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
  styleUrls: ['./institute-list.component.css']
})
export class InstituteListComponent {
  institutions$: any;

  constructor(private biomedStateService: BiomedStateService, private router: Router) {
    this.institutions$ = this.biomedStateService.institutions$;
  }

  addInstitute() {
    this.router.navigate(['/institute/add']);
  }

  editInstitute(id: string) {
    this.router.navigate(['/institute/edit', id]);
  }

  deleteInstitute(id: string) {
    if (confirm('Are you sure you want to delete this institute?')) {
      this.biomedStateService.deleteInstitution(id.toString()).subscribe({
        next: () => {
          // The service will refetch the list after deletion
          alert('Institute deleted successfully');
        },
        error: (err) => {
          console.error('Error deleting institute', err);
          alert('Failed to delete institute');
        }
      });
    }
  }
}