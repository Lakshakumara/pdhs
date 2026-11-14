// supplier.component.ts
import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormsModule,
} from '@angular/forms';
import { forkJoin, finalize } from 'rxjs';
import { QueryService } from '../../core/services/query.service';
import { UpsertService } from '../../core/services/upsert.service';
import { NotificationService } from '../../core/services/notification.service';
import { HasPermissionDirective } from '../../core/directives/permission-directive';
import { InventoryItem, Supplier } from '../../core/models/biomed.interface';
import { Permission } from '../../core/constants/permissions';

import { TableModule, TableLazyLoadEvent } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { RatingModule } from 'primeng/rating';
import { TooltipModule } from 'primeng/tooltip';
import { TagModule } from 'primeng/tag';

// Phone regex allowing 7 to 20 digits with optional +
const PHONE_PATTERN = /^[+]?[\d\s-]{7,20}$/;

@Component({
  selector: 'app-supplier',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TableModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    RatingModule,
    TooltipModule,
    TagModule,
    HasPermissionDirective,
  ],
  templateUrl: './supplier.component.html',
})
export class SupplierComponent implements OnInit {
  readonly permission = Permission;

  // App State Signals
  suppliers = signal<Supplier[]>([]);
  inventoryItems = signal<InventoryItem[]>([]); // Master list of inventory items to link
  totalRecords = signal<number>(0);
  isLoading = signal<boolean>(false);
  isDialogVisible = signal<boolean>(false);
  isNewMode = signal<boolean>(true);
  editingId = signal<string | null>(null);

  // Filters
  selectedRating = signal<number | null>(null);
  searchQuery = signal<string>('');

  supplierForm: FormGroup;
  first = 0;
  rows = 10;

  constructor(
    private fb: FormBuilder,
    private queryService: QueryService,
    private upsertService: UpsertService,
    private notify: NotificationService,
  ) {
    this.supplierForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      phone: ['', [Validators.pattern(PHONE_PATTERN)]],
      email: ['', [Validators.email]],
      contactPerson: [''],
      contactPhone: ['', [Validators.pattern(PHONE_PATTERN)]],
      contactEmail: ['', [Validators.email]],
      whatsApp: ['', [Validators.pattern(PHONE_PATTERN)]],
      rating: [null],
      performanceNotes: [''],
      remarks: [''],
      supplyItemIds: [[]],
    });
  }

  ngOnInit() {
    this.loadInitialData();
  }

  loadInitialData() {
    this.isLoading.set(true);
    const page = Math.floor(this.first / this.rows) + 1;

    forkJoin({
      inventory: this.queryService.getInventoryItems(1, 100),
      grid: this.queryService.getSuppliers(
        page,
        this.rows,
        this.selectedRating(),
        this.searchQuery(),
      ),
    })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: ({ inventory, grid }) => {
          this.inventoryItems.set(inventory.items || []);
          this.suppliers.set(grid.items || []);
          this.totalRecords.set(grid.total || 0);
        },
        error: () => {},
      });
  }

  loadGridPage() {
    this.isLoading.set(true);
    const page = Math.floor(this.first / this.rows) + 1;

    this.queryService
      .getSuppliers(page, this.rows, this.selectedRating(), this.searchQuery())
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res) => {
          this.suppliers.set(res.items || []);
          this.totalRecords.set(res.total || 0);
        },
        error: () => {},
      });
  }

  filterByRating(rating: number | null) {
    this.selectedRating.set(rating);
    this.first = 0;
    this.loadGridPage();
  }

  onSearch(event: Event) {
    const val = (event.target as HTMLInputElement).value;
    this.searchQuery.set(val);
    this.first = 0;
    this.loadGridPage();
  }

  onLazyLoad(event: TableLazyLoadEvent) {
    this.first = event.first ?? 0;
    this.rows = event.rows ?? 10;
    this.loadGridPage();
  }

  openCreate() {
    this.isNewMode.set(true);
    this.editingId.set(null);
    this.supplierForm.reset({
      name: '',
      phone: '',
      email: '',
      contactPerson: '',
      contactPhone: '',
      contactEmail: '',
      whatsApp: '',
      rating: null,
      performanceNotes: '',
      remarks: '',
      supplyItemIds: [],
    });
    this.isDialogVisible.set(true);
  }

  openEdit(row: Supplier) {
    this.isNewMode.set(false);
    this.editingId.set(row.id);

    const currentItemIds = row.supplyItem ? row.supplyItem.map((item: any) => item.id) : [];

    this.supplierForm.patchValue({
      name: row.name,
      phone: row.phone || '',
      email: row.email || '',
      contactPerson: row.contactPerson || '',
      contactPhone: row.contactPhone || '',
      contactEmail: row.contactEmail || '',
      whatsApp: row.whatsApp || '',
      rating: row.rating ?? null,
      performanceNotes: row.performanceNotes || '',
      remarks: row.remarks || '',
      supplyItemIds: currentItemIds,
    });
    this.isDialogVisible.set(true);
  }

  onItemCheckboxChange(itemId: string, event: Event) {
    const isChecked = (event.target as HTMLInputElement).checked;
    const currentIds: string[] = this.supplierForm.get('supplyItemIds')?.value || [];

    if (isChecked) {
      if (!currentIds.includes(itemId)) {
        this.supplierForm.patchValue({ supplyItemIds: [...currentIds, itemId] });
      }
    } else {
      this.supplierForm.patchValue({
        supplyItemIds: currentIds.filter((id) => id !== itemId),
      });
    }
  }

  save() {
    if (this.supplierForm.invalid) {
      this.supplierForm.markAllAsTouched();
      this.notify.error('Validation error', 'Please check the entered values in the form.');
      return;
    }

    this.isLoading.set(true);
    const formVal = this.supplierForm.value;

    const selectedObjects = this.inventoryItems()
      .filter((item) => formVal.supplyItemIds?.includes(item.id))
      .map((item) => ({ id: item.id, name: item.name }));

    const payload: Partial<Supplier> = {
      name: formVal.name.trim(),
      phone: formVal.phone?.trim() || null,
      email: formVal.email?.trim() || null,
      contactPerson: formVal.contactPerson?.trim() || null,
      contactPhone: formVal.contactPhone?.trim() || null,
      contactEmail: formVal.contactEmail?.trim() || null,
      whatsApp: formVal.whatsApp?.trim() || null,
      rating: formVal.rating ? Number(formVal.rating) : null,
      performanceNotes: formVal.performanceNotes?.trim() || null,
      remarks: formVal.remarks?.trim() || null,
      supplyItem: selectedObjects,
    };

    const request$ = this.isNewMode()
      ? this.upsertService.createSupplier(payload)
      : this.upsertService.updateSupplier(this.editingId()!, payload);

    request$.pipe(finalize(() => this.isLoading.set(false))).subscribe({
      next: (saved) => {
        this.notify.success(
          this.isNewMode() ? 'Supplier registered' : 'Supplier updated',
          saved.name,
        );
        this.isDialogVisible.set(false);
        this.loadGridPage();
      },
      error: () => {},
    });
  }

  deleteSupplier(sup: Supplier) {
    if (!confirm(`Are you sure you want to deactivate/delete supplier "${sup.name}"?`)) {
      return;
    }

    this.isLoading.set(true);
    this.upsertService
      .deleteSupplier(sup.id)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: () => {
          this.notify.success('Supplier removed', `"${sup.name}" has been deactivated.`);
          this.loadGridPage();
        },
        error: () => {},
      });
  }
}
