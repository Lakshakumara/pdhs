// institution.component.ts
import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
// Replace your old primeng imports with this clean single-line root import:
//import { Table, Dialog, Select, Button, InputText } from 'primeng';
import { forkJoin, finalize } from 'rxjs';
import { QueryService } from '../../core/services/query.service';
import { HasPermissionDirective } from '../../core/directives/permission-directive';
import { Permission } from '../../core/constants/permissions';

@Component({
  selector: 'app-institution',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, TableModule,
    DialogModule, SelectModule, ButtonModule, InputTextModule, HasPermissionDirective
  ],
  templateUrl: './institute.component.html'
})
export class InstituteComponent implements OnInit {
  readonly permission = Permission;

  // App Signals
  institutions = signal<any[]>([]);
  districts = signal<any[]>([]);
  totalRecords = signal<number>(0);
  isLoading = signal<boolean>(false);
  isDialogVisible = signal<boolean>(false);
  isNewMode = signal<boolean>(true);
  editingId = signal<string | null>(null);

  // Filter Chips Signals (Option B)
  selectedDistrictId = signal<string | null>(null);
  selectedType = signal<string | null>(null);

  // Built-In Predefined Institutional Type Options
  institutionTypes = [
    { label: 'Provincial General Hospital (PGH)', value: 'PGH' },
    { label: 'District General Hospital (DGH)', value: 'DGH' },
    { label: 'Base Hospital (BH)', value: 'BH' },
    { label: 'Divisional Hospital (DH)', value: 'DH' },
    { label: 'Primary Medical Care Unit (PMCU)', value: 'PMCU' }
  ];

  institutionForm: FormGroup;
  first = 0;
  rows = 10;

  constructor(private fb: FormBuilder, private queryService: QueryService) {
    this.institutionForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      type: ['', Validators.required],
      districtId: ['', Validators.required],
      email: ['', [Validators.email]],
      // Regex accepts Sri Lankan landline/mobile standards (e.g., 0452222222 or 0771234567)
      tp: ['', [Validators.pattern(/^(?:0|94|\+94)?(?:[1-9][0-9]{8})$/)]]
    });
  }

  ngOnInit() {
    this.loadMetadataAndGrid();
  }

  loadMetadataAndGrid() {
    this.isLoading.set(true);
    const page = Math.floor(this.first / this.rows) + 1;

    forkJoin({
      districts: this.queryService.getDistricts(), // Assume this returns District backend array
      grid: this.queryService.getInstitute
        (page, this.rows, this.selectedType()??'', this.selectedDistrictId()??'',)
    })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: ({ districts, grid }) => {
          this.districts.set(districts);
          this.institutions.set(grid.items);
          this.totalRecords.set(grid.total);
        }
      });
  }

  loadGridPage() {
    this.isLoading.set(true);
    const page = Math.floor(this.first / this.rows) + 1;

    this.queryService.getInstitute(page, this.rows, this.selectedType() ??'', this.selectedDistrictId()??'',)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe(res => {
        this.institutions.set(res.items);
        this.totalRecords.set(res.total);
      });
  }

  filterByDistrict(id: string | null) {
    this.selectedDistrictId.set(id);
    this.first = 0;
    this.loadGridPage();
  }

  filterByType(type: string | null) {
    this.selectedType.set(type);
    this.first = 0;
    this.loadGridPage();
  }

  onPageChange(event: any) {
    this.first = event.first;
    this.rows = event.rows;
    this.loadGridPage();
  }

  openCreate() {
    this.isNewMode.set(true);
    this.editingId.set(null);
    this.institutionForm.reset();
    this.isDialogVisible.set(true);
  }

  openEdit(row: any) {
    this.isNewMode.set(false);
    this.editingId.set(row.id);
    this.institutionForm.patchValue({
      name: row.name,
      type: row.type,
      districtId: row.districtId,
      email: row.email,
      tp: row.tp
    });
    this.isDialogVisible.set(true);
  }

  save() {
    if (this.institutionForm.invalid) {
      this.institutionForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    const payload = this.institutionForm.value;
    /*const request$ = this.isNewMode()
      ? this.queryService.createInstitution(payload)
      : this.queryService.updateInstitution(this.editingId()!, payload);

    request$.pipe(finalize(() => this.isLoading.set(false))).subscribe({
      next: () => {
        this.isDialogVisible.set(false);
        this.loadGridPage();
      }
    });*/
  }
}