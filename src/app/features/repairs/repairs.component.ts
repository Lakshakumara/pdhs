import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BiomedStateService } from '../../core/services/biomed-state.service';

import { UserFacadeService } from '../../core/services/user-facade.service';
import { QueryService } from '../../core/services/query.service';
import { UpsertService } from '../../core/services/upsert.service';
import { NotificationService } from '../../core/services/notification.service';
import { RepairRequest, WorkOrder, Institution, Equipment, InventoryItem, RepairPriority, WorkOrderStatus, PartUsedDetail, InspectedSparePart } from '../../core/models/biomed.interface';
import { RoleType } from "../../core/models/permission.types";
import { HasPermissionDirective } from '../../core/directives/permission-directive';
import { Permission } from '../../core/models/permission.types';

import { AutoCompleteCompleteEvent, AutoCompleteModule } from 'primeng/autocomplete';
import { TableModule, TableLazyLoadEvent } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TextareaModule } from 'primeng/textarea';
import { InputNumberModule } from 'primeng/inputnumber';
import { CheckboxModule } from 'primeng/checkbox';
import { ToolbarModule } from 'primeng/toolbar';
import { SkeletonModule } from 'primeng/skeleton';

@Component({
  selector: 'app-repairs',
  imports: [
    CommonModule, FormsModule, HasPermissionDirective, AutoCompleteModule,
    TableModule, DialogModule, TagModule, ButtonModule, InputTextModule,
    SelectModule, IconFieldModule, InputIconModule, TextareaModule,
    InputNumberModule, CheckboxModule, ToolbarModule, SkeletonModule
  ],
  templateUrl: './repairs.component.html',
  styleUrl: './repairs.component.css'
})
export class RepairsComponent implements OnInit {

  readonly permission = Permission;

  readonly workOrders = signal<WorkOrder[]>([]);
  readonly repairRequests = signal<RepairRequest[]>([]);
  readonly loading = signal(true);

  public institutions: Institution[] = [];
  readonly equipments = signal<Equipment[]>([]);
  readonly inventoryItems = signal<InventoryItem[]>([]);

  // Pagination / lazy-load state (driven entirely by p-table now)
  readonly total = signal(0);
  readonly currentPage = signal(1);
  readonly pageSize = signal(10);
  public sortField = '';
  public sortOrder = 1;

  // Filter properties bound to the table's header filter row
  public searchTerm = '';
  public selectedPriority = '';
  public selectedStatus = '';
  public selectedCategory = '';
  public selectedInstitutionId = '';

  public readonly priorityOptions = [
    { label: 'Emergency', value: 'Emergency' },
    { label: 'Urgent', value: 'Urgent' },
    { label: 'Routine', value: 'Routine' }
  ];

  public readonly statusOptions = [
    { label: 'Submitted (Pending)', value: 'Submitted' },
    { label: 'Acknowledged', value: 'Acknowledged' },
    { label: 'Diagnosed', value: 'Diagnosed' },
    { label: 'In Repair', value: 'In Repair' },
    { label: 'Completed (Ready)', value: 'Completed' },
    { label: 'Verified & Closed', value: 'Verified & Closed' }
  ];

  // Modals
  public showDetailModal = false;
  public showRequestModal = false;
  public showTechnicianModal = false;

  // Selected state
  readonly selectedReq = signal<RepairRequest | null>(null);
  readonly selectedWO = signal<WorkOrder | null>(null);

  // Submit Request Form State
  public reqEqId = '';
  public reqCompId = '';
  public reqFaultDesc = '';
  public reqPriority: RepairPriority = 'Routine';
  public selectedEqSparePartList: any[] = [];

  // Technician Form Action State
  public diagnosisNotes = '';
  public techInspectedSpareParts: InspectedSparePart[] = [];
  public techPartsUsed: PartUsedDetail[] = [];
  public tempItem!: InventoryItem | null;
  public tempPartQty = 1;

  public readonly lifecycleSteps: WorkOrderStatus[] =
    ['Submitted', 'Acknowledged', 'Diagnosed', 'In Repair', 'Completed', 'Verified & Closed'];

  constructor(
    private queryService: QueryService,
    private upsertService: UpsertService,
    private notify: NotificationService,
    private userFacade: UserFacadeService,) { }

  ngOnInit() {
    this.getEquipment();
    this.getInventoryItem();
    // Initial repair-request load happens via the table's first onLazyLoad emission.
  }

  // ---------------------------------------------------------------------
  // p-table lazy load: ONE handler drives pagination + sorting + filtering
  // ---------------------------------------------------------------------
  public onLazyLoad(event: TableLazyLoadEvent) {
    this.loading.set(true);

    const rows = event.rows ?? this.pageSize();
    const first = event.first ?? 0;
    const page = Math.floor(first / rows) + 1;

    this.currentPage.set(page);
    this.pageSize.set(rows);
    this.sortField = (event.sortField as string) || '';
    this.sortOrder = event.sortOrder ?? 1;

    this.queryService.getRepairRequest(
      page,
      rows,
      this.searchTerm,
      this.selectedCategory,
      this.selectedStatus,
    ).subscribe({
      next: result => {
        this.repairRequests.set(result.items);
        this.total.set(result.total);
        // this.getWorkOrders(); // keep work-order join in sync with current page
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  // Called from the header filter inputs (search box, priority/status dropdowns)
  public onFilterChange() {
    this.currentPage.set(1);
    this.onLazyLoad({ first: 0, rows: this.pageSize(), sortField: this.sortField, sortOrder: this.sortOrder });
  }

  public filterItems(event: AutoCompleteCompleteEvent) {
    this.queryService.getInventorytem(
      this.currentPage(), this.pageSize(), event.query, this.selectedCategory, this.selectedStatus,
    ).subscribe(result => {
      this.inventoryItems.set(result.items);
      this.total.set(result.total);
    });
  }

  getInventoryItem() {
    if (this.userFacade.currentSession() == null) return;
    this.queryService.getInventorytem(
      this.currentPage(), this.pageSize(), this.searchTerm, this.selectedCategory, this.selectedStatus,
    ).subscribe(result => this.inventoryItems.set(result.items));
  }

  getEquipment() {
    if (this.userFacade.currentSession() == null) return;
    this.queryService.getEquipment(
      this.currentPage(), this.pageSize(), this.searchTerm, this.selectedCategory,
      this.selectedStatus, this.selectedInstitutionId
    ).subscribe(result => this.equipments.set(result.items));
  }

  getWorkOrder(repairRequestId: string) {
    this.queryService.getWorkOrder(repairRequestId)
      .subscribe(result => this.selectedWO.set(result));
  }

  /*public getWO(repairRequestId: string): WorkOrder | undefined {
    console.log('repair request id', repairRequestId)
     this.queryService.getWorkOrders(
       this.currentPage(), this.pageSize(), this.searchTerm, this.selectedCategory, this.selectedStatus,
     ).subscribe(result => {return result.items});
  
    return this.workOrders().find(o => o.repairRequestId === repairRequestId);
  }*/

  // Lifecycle helper for the p-dialog timeline — replaces the long chained
  // *ngClass boolean expressions with one lookup
  public isStepComplete(step: WorkOrderStatus, current: WorkOrderStatus): boolean {
    return this.lifecycleSteps.indexOf(step) <= this.lifecycleSteps.indexOf(current);
  }

  public onEqChange() {
    this.reqCompId = '';
    const eq = this.equipments().find(e => e.id === this.reqEqId);
    this.selectedEqSparePartList = eq ? eq.spareParts : [];
  }

  // Details Dialog
  public openDetails(req: RepairRequest) {
    this.selectedReq.set(req);
    //this.selectedWO.set(this.getWO(req.id) ?? null);
    this.showDetailModal = true;
  }

  public closeDetails() {
    this.showDetailModal = false;
    this.selectedReq.set(null);
    this.selectedWO.set(null);
  }
/*
  private syncSelectedWO() {
    const req = this.selectedReq();
    // if (req) this.selectedWO.set(this.getWO(req.id) ?? null);
  }*/

  // New Request Submission
  public openRequestModal() {
    this.showRequestModal = true;
    this.reqEqId = '';
    this.reqCompId = '';
    this.reqFaultDesc = '';
    this.reqPriority = 'Routine';
    this.selectedEqSparePartList = [];
  }

  public closeRequestModal() {
    this.showRequestModal = false;
  }

  public submitRequest() {
    if (!this.reqEqId || !this.reqFaultDesc.trim()) {
      this.notify.error('Please select an equipment and describe the fault.', '');
      return;
    }

    const eq = this.equipments().find(e => e.id === this.reqEqId);
    if (eq?.assignedInstitutionId == null) {
      this.notify.error('Equipment not assigned to any institution', 'Please select an equipment that is assigned to an institution.');
      return;
    }
    const submittedByUserId = this.userFacade.currentUser()?.id;
    if (!submittedByUserId) {
      this.notify.error('User Session Expired', 'Try Logging again');
      return;
    }

    this.upsertService.submitRepairRequest(this.reqEqId, this.reqCompId || undefined,
      this.reqFaultDesc, this.reqPriority, submittedByUserId)
      .subscribe({
        next: result => {
          this.getEquipment();
          this.onFilterChange(); // refresh table from page 1
          this.showRequestModal = false;
          this.notify.success('Repair request submitted successfully!', `Your repair request for ${result.repairRequest.equipmentName} has been submitted.`);
        },
        error: err => {
          this.notify.error('Failed to submit repair request', err.message || 'An error occurred while submitting your request. Please try again.');
        }
      });
  }

  // Technician Actions Dialog
  public openTechnicianModal(req: any) {
    console.log('openTechnicianModal', req)
    this.selectedReq.set(req);
    this.getWorkOrder(req.repairRequestId)

    const wo = this.selectedWO();
    console.log('WO', wo)
    if (!wo) return;

    this.diagnosisNotes = wo.diagnosisNotes || '';

    if (wo.inspectedSpareParts && wo.inspectedSpareParts.length > 0) {
      this.techInspectedSpareParts = [...wo.inspectedSpareParts];
    } else {
      this.techInspectedSpareParts = (req.equipment?.spareParts ?? []).map((c: any) =>
        ({ sparePartId: c.id, sparePartName: c.name, inspected: false, conditionNotes: '' }));
    }

    this.techPartsUsed = [...(wo.partsUsed || [])];
    this.tempItem = null;
    this.tempPartQty = 1;
    this.showTechnicianModal = true;
  }

  public closeTechnicianModal() {
    this.showTechnicianModal = false;
    this.selectedReq.set(null);
    this.selectedWO.set(null);
  }

  public addPartToBuffer() {
    if (this.tempItem === null) return;

    if (this.tempItem.currentStock < this.tempPartQty) {
      this.notify.error(`Insufficient stock!`, `Available in PDHS store: ${this.tempItem.currentStock} units`);
      return;
    }

    const existing = this.techPartsUsed.find(p => p.inventoryItemId === this.tempItem?.id);
    if (existing) {
      existing.quantityUsed += this.tempPartQty;
    } else {
      this.techPartsUsed.push({
        inventoryItemId: this.tempItem.id,
        inventoryItemName: this.tempItem.name,
        quantityUsed: this.tempPartQty,
        unitCost: this.tempItem.costPerUnit
      });
    }

    this.tempItem = null;
    this.tempPartQty = 1;
  }

  public removePartFromBuffer(idx: number) {
    this.techPartsUsed.splice(idx, 1);
  }

  // Technician Workflow transitions
  public runWorkOrderStep(step: 'Acknowledge' | 'Diagnose' | 'StartRepair' | 'Complete') {
    const wo = this.selectedWO();
    if (!wo) return;

    let nextStatus: WorkOrderStatus = wo.status;
    const payload: Partial<WorkOrder> = {};

    payload.assignedTechnicianId = this.userFacade.currentUser()?.id;
    payload.assignedTechnicianName = this.userFacade.currentUser()?.fullName;

    switch (step) {
      case 'Acknowledge':
        nextStatus = 'Acknowledged';
        break;
      case 'Diagnose':
        if (!this.diagnosisNotes.trim()) {
          this.notify.error('Please input your diagnostic findings first.', '');
          return;
        }
        nextStatus = 'Diagnosed';
        payload.diagnosisNotes = this.diagnosisNotes;
        payload.inspectedSpareParts = this.techInspectedSpareParts;
        break;
      case 'StartRepair':
        nextStatus = 'In Repair';
        break;
      case 'Complete':
        nextStatus = 'Completed';
        payload.diagnosisNotes = this.diagnosisNotes;
        payload.inspectedSpareParts = this.techInspectedSpareParts;
        payload.partsUsed = this.techPartsUsed;
        break;
    }

    this.upsertService.updateWorkOrderStatus(wo.id, nextStatus, payload)
      .subscribe(result => {
        this.onFilterChange();
        this.notify.success('Status Updated', result.status);
        this.closeTechnicianModal();
      });
  }

  // Supervisor Verify and Close
  public verifyAndCloseWorkOrder(woId: string) {
    if (confirm('Are you sure you have verified this repair work and want to close the work order? This will permanently archive the ticket.')) {
      this.upsertService.updateWorkOrderStatus(woId, 'Verified & Closed', {})
        .subscribe(() => {
          this.onFilterChange();
          this.closeDetails();
        });
    }
  }

  // Role permission helpers
  public isTechnician(): boolean {
    if (!this.userFacade.currentUser()) return false;
    return this.userFacade.hasAnyRole([RoleType.BIOMEDICAL_TECHNICIAN, RoleType.SUPER_ADMIN_PDHS]);
  }

  public isSupervisor(): boolean {
    if (!this.userFacade.currentUser()) return false;
    return this.userFacade.hasAnyRole([RoleType.ADMIN_PDHS, RoleType.SUPER_ADMIN_PDHS]);
  }

  // PrimeNG p-tag severity mapping — replaces hand-written class strings
  public getStatusSeverity(status: WorkOrderStatus): 'warn' | 'info' | 'secondary' | 'contrast' | 'success' {
    switch (status) {
      case 'Submitted': return 'warn';
      case 'Acknowledged': return 'info';
      case 'Diagnosed': return 'contrast';
      case 'In Repair': return 'info';
      case 'Completed': return 'success';
      case 'Verified & Closed': return 'secondary';
      default: return 'secondary';
    }
  }

  public getPrioritySeverity(p: RepairPriority): 'danger' | 'warn' | 'secondary' {
    switch (p) {
      case 'Emergency': return 'danger';
      case 'Urgent': return 'warn';
      case 'Routine': return 'secondary';
      default: return 'secondary';
    }
  }

  public getInstitutionName(id: string): string {
    return this.institutions.find(i => i.id === id)?.name || id;
  }
}