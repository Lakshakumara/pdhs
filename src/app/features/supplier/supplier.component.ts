// supplier.component.ts
import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { forkJoin, finalize } from 'rxjs';
import { QueryService } from '../../core/services/query.service';
import { HasPermissionDirective } from '../../core/directives/permission-directive';
import { Permission } from '../../core/models/permission.types';
import { ButtonModule } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { InputText } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { RatingModule } from 'primeng/rating';
import { UpsertService } from '../../core/services/upsert.service';
import { InventoryItem, Supplier } from '../../core/models/biomed.interface';

@Component({
  selector: 'app-supplier',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule, TableModule, Dialog, 
    ButtonModule, InputText, RatingModule, HasPermissionDirective
  ],
  templateUrl: './supplier.component.html'
})
export class SupplierComponent implements OnInit {
onItemCheckboxChange(arg0: string,$event: Event) {
throw new Error('Method not implemented.');
}
  readonly permission = Permission;

  // App State Signals
  suppliers = signal<Supplier[]>([]);
  inventoryItems = signal<InventoryItem[]>([]); // To populate supply items multi-selector
  totalRecords = signal<number>(0);
  isLoading = signal<boolean>(false);
  isDialogVisible = signal<boolean>(false);
  isNewMode = signal<boolean>(true);
  editingId = signal<string | null>(null);

  // Filters (Option B Layout)
  selectedRating = signal<number | null>(null);
  searchQuery = signal<string>('');

  supplierForm: FormGroup;
  first = 0;
  rows = 10;
  ratingValue: number = 3;

  constructor(private fb: FormBuilder, private queryService: QueryService, private upsertService:UpsertService) {
    this.supplierForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      contactPerson: [''],
      email: ['', [Validators.email]],
      phone: ['', [Validators.pattern(/^(?:0|94|\+94)?(?:[1-9][0-9]{8})$/)]],
      rating: [null],
      performanceNotes: [''],
      remarks: [''],
      supplyItemIds: [[]] // Tracked intermediate array for multi-select
    });
  }

  ngOnInit() {
    this.loadInitialData();
  }

  loadInitialData() {
    this.isLoading.set(true);
    const page = Math.floor(this.first / this.rows) + 1;

    forkJoin({
      inventory: this.queryService.getInventorytem(page, this.rows), // Fetches master list of InventoryItem
      grid: this.queryService.getSuppliers(page, this.rows, this.selectedRating(), this.searchQuery())
    })
    .pipe(finalize(() => {this.isLoading.set(false)}))
    .subscribe({
      next: ({ inventory, grid }) => {
        this.inventoryItems.set(inventory.items);
        this.suppliers.set(grid.items);
        this.totalRecords.set(grid.total);
      }
    });
  }

  loadGridPage() {
    this.isLoading.set(true);
    const page = Math.floor(this.first / this.rows) + 1;

    this.queryService.getSuppliers(page, this.rows, this.selectedRating(), this.searchQuery())
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe(res => {
        this.suppliers.set(res.items);
        this.totalRecords.set(res.total);
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

  onPageChange(event: any) {
    this.first = event.first;
    this.rows = event.rows;
    this.loadGridPage();
  }

  openCreate() {
    this.isNewMode.set(true);
    this.editingId.set(null);
    this.supplierForm.reset({ supplyItemIds: [] });
    this.isDialogVisible.set(true);
  }

  openEdit(row: any) {
    this.isNewMode.set(false);
    this.editingId.set(row.id);

    // Map the stored JSON array [{id, name}] back to an primitive ID primitive array for the UI multi-select widget
    const currentItemIds = row.supplyItem ? row.supplyItem.map((item: any) => item.id) : [];

    this.supplierForm.patchValue({
      name: row.name,
      contactPerson: row.contactPerson,
      email: row.email,
      phone: row.phone,
      rating: row.rating,
      performanceNotes: row.performanceNotes,
      remarks: row.remarks,
      supplyItemIds: currentItemIds
    });
    this.isDialogVisible.set(true);
  }

  save() {
    if (this.supplierForm.invalid) {
      this.supplierForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    const formVal = this.supplierForm.value;

    // Map the raw IDs array back to structured JSON objects expected by schema: {id, name}
    const selectedObjects = this.inventoryItems()
      .filter(item => formVal.supplyItemIds?.includes(item.id))
      .map(item => ({ id: item.id, name: item.name }));

    const payload = {
      ...formVal,
      supplyItem: selectedObjects
    };
    delete payload.supplyItemIds; // Strip temporary selection array out

    const request$ = this.isNewMode()
      ? this.upsertService.createSupplier(payload)
      : this.upsertService.updateSupplier(this.editingId()!, payload);

    /*request$
    .pipe(finalize(() => {this.isLoading.set(false);}))
    .subscribe({
      next: () => {
        this.isDialogVisible.set(false);
        this.loadGridPage();
      }
    });*/
  }
}