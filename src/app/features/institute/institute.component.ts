import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormsModule,
} from '@angular/forms';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { forkJoin, finalize } from 'rxjs';
import { QueryService } from '../../core/services/query.service';
import { UpsertService } from '../../core/services/upsert.service';
import { HasPermissionDirective } from '../../core/directives/permission-directive';
import { Permission } from '../../core/constants/permissions';
import { District, Institution } from '../../core/models/biomed.interface';

@Component({
  selector: 'app-institution',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    TableModule,
    DialogModule,
    SelectModule,
    ButtonModule,
    InputTextModule,
    HasPermissionDirective,
  ],
  templateUrl: './institute.component.html',
})
export class InstituteComponent implements OnInit {
  readonly permission = Permission;

  // App Signals
  institutions = signal<Institution[]>([]);
  districts = signal<District[]>([]);
  totalRecords = signal<number>(0);
  isLoading = signal<boolean>(false);
  isDialogVisible = signal<boolean>(false);
  isNewMode = signal<boolean>(true);
  editingId = signal<string | null>(null);

  // Filter Signals
  searchTerm = signal<string>('');
  selectedDistrictId = signal<string | null>(null);
  selectedType = signal<string | null>(null);

  // Predefined Institutional Types
  institutionTypes = [
    { label: 'Teaching Hospital (TH)', value: 'TH' },
    { label: 'District General Hospital (DGH)', value: 'DGH' },
    { label: 'Base Hospital (BH)', value: 'Base Hospital' },
    { label: 'Divisional Hospital (DH)', value: 'Divisional Hospital' },
    { label: 'Primary Medical Care Unit (PMCU)', value: 'PMCU' },
    { label: 'MOH Office', value: 'MOH Office' },
    { label: 'PDHS Office', value: 'PDHS Office' },
    { label: 'RDHS Office', value: 'RDHS Office' },
    { label: 'STD Clinic', value: 'STD Clinic' },
    { label: 'Other', value: 'OTHER' },
  ];

  institutionForm: FormGroup;
  first = 0;
  rows = 10;

  constructor(
    private fb: FormBuilder,
    private queryService: QueryService,
    private upsertService: UpsertService,
  ) {
    this.institutionForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      type: ['', Validators.required],
      districtId: [''],
      email: ['', [Validators.email]],
      tp: ['', [Validators.pattern(/^[+]?[\d\s-]{7,20}$/)]],
      active: [true],
    });
  }

  ngOnInit() {
    this.loadMetadataAndGrid();
  }

  loadMetadataAndGrid() {
    this.isLoading.set(true);
    const page = Math.floor(this.first / this.rows) + 1;

    forkJoin({
      districts: this.queryService.getDistricts(),
      grid: this.queryService.getInstitute(
        page,
        this.rows,
        this.searchTerm() || undefined,
        this.selectedDistrictId() || undefined,
        this.selectedType() || undefined,
      ),
    })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: ({ districts, grid }) => {
          this.districts.set(districts);
          this.institutions.set(grid.items);
          this.totalRecords.set(grid.total);
        },
        error: () => {},
      });
  }

  loadGridPage() {
    this.isLoading.set(true);
    const page = Math.floor(this.first / this.rows) + 1;

    this.queryService
      .getInstitute(
        page,
        this.rows,
        this.searchTerm() || undefined,
        this.selectedDistrictId() || undefined,
        this.selectedType() || undefined,
      )
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res) => {
          this.institutions.set(res.items);
          this.totalRecords.set(res.total);
        },
        error: () => {},
      });
  }

  onSearchInput(value: string) {
    this.searchTerm.set(value);
    this.first = 0;
    this.loadGridPage();
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

  clearFilters() {
    this.searchTerm.set('');
    this.selectedDistrictId.set(null);
    this.selectedType.set(null);
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
    this.institutionForm.reset({
      name: '',
      type: '',
      districtId: '',
      email: '',
      tp: '',
      active: true,
    });
    this.isDialogVisible.set(true);
  }

  openEdit(row: Institution) {
    this.isNewMode.set(false);
    this.editingId.set(row.id);
    this.institutionForm.patchValue({
      name: row.name,
      type: row.type,
      districtId: row.districtId || '',
      email: row.email || '',
      tp: row.tp || '',
      active: row.active ?? true,
    });
    this.isDialogVisible.set(true);
  }

  save() {
    if (this.institutionForm.invalid) {
      this.institutionForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    const formVal = this.institutionForm.value;
    const payload: Partial<Institution> = {
      name: formVal.name?.trim(),
      type: formVal.type?.trim(),
      districtId: formVal.districtId ? formVal.districtId : undefined,
      email: formVal.email?.trim() || undefined,
      tp: formVal.tp?.trim() || undefined,
      active: formVal.active ?? true,
    };

    const request$ = this.isNewMode()
      ? this.upsertService.createInstitution(payload)
      : this.upsertService.updateInstitution(this.editingId()!, payload);

    request$.pipe(finalize(() => this.isLoading.set(false))).subscribe({
      next: () => {
        this.isDialogVisible.set(false);
        this.loadGridPage();
      },
      error: () => {},
    });
  }

  deleteInstitution(inst: Institution) {
    if (!confirm(`Are you sure you want to deactivate/delete institution "${inst.name}"?`)) {
      return;
    }

    this.isLoading.set(true);
    this.upsertService
      .deleteInstitution(inst.id)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: () => {
          this.loadGridPage();
        },
        error: () => {},
      });
  }
}
