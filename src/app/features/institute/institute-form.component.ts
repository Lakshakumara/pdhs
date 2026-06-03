import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { BiomedStateService } from '../../core/services/biomed-state.service';
import { Institution } from '../../core/models/biomed.interface';

@Component({
  selector: 'app-institute-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="institute-form">
      <h2>{{ isEditMode ? 'Edit Institute' : 'Add Institute' }}</h2>
      <form (ngSubmit)="onSubmit()" #instituteForm="ngForm">
        <div class="mb-3">
          <label for="name" class="form-label">Name</label>
          <input
            type="text"
            class="form-control"
            id="name"
            [(ngModel)]="institute.name"
            name="name"
            required
          />
        </div>
        <div class="mb-3">
          <label for="address" class="form-label">Address</label>
          <input
            type="text"
            class="form-control"
            id="address"
            [(ngModel)]="institute.name"
            name="address"
          />
        </div>
        <button type="submit" class="btn btn-primary">{{ isEditMode ? 'Update' : 'Add' }}</button>
        <button type="button" class="btn btn-secondary" (click)="goBack()">Cancel</button>
      </form>
    </div>
  `,
  styleUrls: ['./institute-form.component.css']
})
export class InstituteFormComponent {
  institute = {
    id: 0,
    name: '',
  };
  isEditMode = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private biomedStateService: BiomedStateService
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.params['id'];
    /*if (id) {
      this.isEditMode = true;
      // Fetch the institute data by id
      this.biomedStateService.institutions$.subscribe(institutions => {
        const institute = institutions.find(i => i.id === +id);
        if (institute) {
          this.institute = { ...institute };
        }
      });
    }*/
  }

  onSubmit() {
    /*if (this.isEditMode) {
      this.biomedStateService.updateInstitution(this.institute as Institution).subscribe({
        next: () => {
          alert('Institute updated successfully');
          this.goBack();
        },
        error: (err) => {
          console.error('Error updating institute', err);
          alert('Failed to update institute');
        }
      });
    } else {
      this.biomedStateService.addInstitution(this.institute as Omit<Institution, 'id'>).subscribe({
        next: (newInstitute) => {
          alert('Institute added successfully');
          this.goBack();
        },
        error: (err) => {
          console.error('Error adding institute', err);
          alert('Failed to add institute');
        }
      });
    }*/
  }

  goBack() {
    this.router.navigate(['/institute']);
  }
}