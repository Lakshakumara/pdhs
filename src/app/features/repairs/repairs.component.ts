import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { UserFacadeService } from '../../core/services/user-facade.service';
import { QueryService } from '../../core/services/query.service';
import { UpsertService } from '../../core/services/upsert.service';
import { NotificationService } from '../../core/services/notification.service';
import {
  RepairRequest, WorkOrder, Equipment, InventoryItem,
  RepairPriority, WorkOrderStatus, PartUsedDetail, InspectedSparePart
} from '../../core/models/biomed.interface';
import { RoleType } from '../../core/models/permission.types';
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
import { DatePickerModule } from 'primeng/datepicker';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { TooltipModule } from 'primeng/tooltip';
import { DividerModule } from 'primeng/divider';

// ─────────────────────────────────────────────────────────────────────
// Internal track statuses — shown in step-through stepper
// Vendor track statuses — shown as a single badge only
// ─────────────────────────────────────────────────────────────────────
const INTERNAL_STEPS: WorkOrderStatus[] = [
  'SUBMITTED', 'ACKNOWLEDGED', 'DIAGNOSED',
  'AWAITING_PARTS', 'IN_REPAIR', 'COMPLETED', 'VERIFIED_CLOSED'
];

@Component({
  selector: 'app-repairs',
  imports: [
    CommonModule, FormsModule, HasPermissionDirective, AutoCompleteModule,
    TableModule, DialogModule, TagModule, ButtonModule, InputTextModule,
    SelectModule, IconFieldModule, InputIconModule, TextareaModule,
    InputNumberModule, CheckboxModule, ToolbarModule, SkeletonModule,
    DatePickerModule, ToggleSwitchModule, TooltipModule, DividerModule
  ],
  templateUrl: './repairs.component.html',
  styleUrl: './repairs.component.css'
})
export class RepairsComponent implements OnInit {

  readonly permission = Permission;

  readonly repairRequests = signal<RepairRequest[]>([]);
  readonly workOrder = signal<WorkOrder | null>(null);
  readonly loading = signal(true);

  readonly equipments = signal<Equipment[]>([]);
  readonly inventoryItems = signal<InventoryItem[]>([]);

  // Pagination
  readonly total = signal(0);
  readonly currentPage = signal(1);
  readonly pageSize = signal(10);
  public sortField = '';
  public sortOrder = 1;

  // Filters
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
    // Shared statuses
    { label: 'Submitted (Pending)', value: 'SUBMITTED' },
    { label: 'Acknowledged', value: 'ACKNOWLEDGED' },
    { label: 'Diagnosed', value: 'DIAGNOSED' },
    { label: 'Completed', value: 'COMPLETED' },
    { label: 'Verified & Closed', value: 'VERIFIED_CLOSED' },
    // Internal track
    { label: 'Awaiting Parts', value: 'AWAITING_PARTS' },
    { label: 'In Repair', value: 'IN_REPAIR' },
    // Company track
    { label: 'Escalated to Company', value: 'ESCALATED_TO_VENDOR' },
    { label: 'Company In Progress', value: 'VENDOR_IN_PROGRESS' },
    { label: 'Company Completed', value: 'VENDOR_COMPLETED' },
  ];

  public readonly internalSteps = INTERNAL_STEPS;

  // ── Modal visibility ────────────────────────────────────────────────
  public showDetailModal = false;
  public showRequestModal = false;
  public showTechnicianModal = false;
  public showReviewModal = false;        // Officer review + triage decision

  // ── Selected state ──────────────────────────────────────────────────
  readonly selectedReq = signal<RepairRequest | null>(null);

  // ── Submit Request form ─────────────────────────────────────────────
  public reqEqId = '';
  public reqCompId = '';
  public reqFaultDesc = '';
  public reqPriority: RepairPriority = 'Routine';
  public selectedEqSparePartList: any[] = [];

  // ── Technician workbench state ──────────────────────────────────────
  public diagnosisNotes = '';
  public techInspectedSpareParts: InspectedSparePart[] = [];
  public techPartsUsed: PartUsedDetail[] = [];
  public tempItem!: InventoryItem | null;
  public tempPartQty = 1;

  // ── Officer review — triage decision state ──────────────────────────
  // 'PENDING' = officer hasn't decided yet (initial view)
  // 'INTERNAL' = assign to PDHS biomedical team
  // 'COMPANY'  = send to external company/vendor
  public triageDecision: 'PENDING' | 'INTERNAL' | 'COMPANY' = 'PENDING';

  // Company repair form (minimal)
  public vendorName = '';
  public vendorContact = '';
  public repairBasis: 'WARRANTY' | 'PAID' = 'WARRANTY';
  public handoverType: 'FIELD_VISIT' | 'EQUIPMENT_SENT' = 'FIELD_VISIT';
  public scheduledDate: Date | null = null;
  public dispatchDate: Date | null = null;
  public courierRef = '';

  public readonly repairBasisOptions = [
    { label: 'Warranty Claim (Supplier Obligated)', value: 'WARRANTY' },
    { label: 'Paid Repair (Third-Party)', value: 'PAID' }
  ];

  public readonly handoverTypeOptions = [
    { label: 'Field Visit (Vendor comes on-site)', value: 'FIELD_VISIT' },
    { label: 'Equipment Sent to Workshop', value: 'EQUIPMENT_SENT' }
  ];

  constructor(
    private queryService: QueryService,
    private upsertService: UpsertService,
    private notify: NotificationService,
    private userFacade: UserFacadeService) { }

  ngOnInit() {
    this.getEquipment();
    this.getInventoryItem();
  }

  // ── p-table lazy load ───────────────────────────────────────────────
  public onLazyLoad(event: TableLazyLoadEvent) {
    this.loading.set(true);
    const rows = event.rows ?? this.pageSize();
    const first = event.first ?? 0;
    const page = Math.floor(first / rows) + 1;

    this.currentPage.set(page);
    this.pageSize.set(rows);
    this.sortField = (event.sortField as string) || '';
    this.sortOrder = event.sortOrder ?? 1;

    this.queryService.getRepairRequest(page, rows, this.searchTerm, this.selectedCategory, this.selectedStatus)
      .subscribe({
        next: result => {
          console.log('result', result)
          this.repairRequests.set(result.items);
          this.total.set(result.total);
          this.loading.set(false);
        },
        error: () => this.loading.set(false)
      });
  }

  public onFilterChange() {
    this.currentPage.set(1);
    this.onLazyLoad({ first: 0, rows: this.pageSize(), sortField: this.sortField, sortOrder: this.sortOrder });
  }

  public filterItems(event: AutoCompleteCompleteEvent) {
    this.queryService.getInventorytem(this.currentPage(), this.pageSize(), event.query, '', '')
      .subscribe(result => this.inventoryItems.set(result.items));
  }

  getInventoryItem() {
    if (!this.userFacade.currentSession()) return;
    this.queryService.getInventorytem(1, 20, '', '', '')
      .subscribe(result => this.inventoryItems.set(result.items));
  }

  getEquipment() {
    if (!this.userFacade.currentSession()) return;
    this.queryService.getEquipment(1, 100, '', '', '', '')
      .subscribe(result => this.equipments.set(result.items));
  }

  // ── Status helpers ──────────────────────────────────────────────────
  public isVendorTrack(status: string): boolean {
    return ['ESCALATED_TO_VENDOR', 'VENDOR_IN_PROGRESS', 'VENDOR_COMPLETED'].includes(status);
  }

  public isStepComplete(step: WorkOrderStatus, current: WorkOrderStatus): boolean {
    return INTERNAL_STEPS.indexOf(step) <= INTERNAL_STEPS.indexOf(current);
  }

  // Returns true when the "Review & Decide" button should be shown.
  // Emergency requests bypass review — technician can self-assign directly.
  public needsOfficerReview(req: RepairRequest): boolean {
    const status = req.workOrder?.status;
    return equalsIgnoreCase(status, 'SUBMITTED') && req.priority !== 'Emergency';
  }

  // Emergency requests: technician can directly acknowledge without officer review
  public canSelfAcknowledge(req: RepairRequest): boolean {
    return equalsIgnoreCase(req.workOrder?.status, 'SUBMITTED') && req.priority === 'Emergency';
  }

  public getStatusSeverity(status: string): 'warn' | 'info' | 'secondary' | 'contrast' | 'success' | 'danger' {
    switch (status) {
      case 'SUBMITTED':           return 'warn';
      case 'ACKNOWLEDGED':        return 'info';
      case 'DIAGNOSED':           return 'contrast';
      case 'AWAITING_PARTS':      return 'warn';
      case 'IN_REPAIR':           return 'info';
      case 'ESCALATED_TO_VENDOR': return 'contrast';
      case 'VENDOR_IN_PROGRESS':  return 'info';
      case 'VENDOR_COMPLETED':    return 'success';
      case 'COMPLETED':           return 'success';
      case 'VERIFIED_CLOSED':     return 'secondary';
      default:                    return 'secondary';
    }
  }

  public getStatusLabel(status: string): string {
    const found = this.statusOptions.find(o => o.value === status);
    return found?.label ?? status;
  }

  public getPrioritySeverity(p: RepairPriority): 'danger' | 'warn' | 'secondary' {
    switch (p) {
      case 'Emergency': return 'danger';
      case 'Urgent':    return 'warn';
      default:          return 'secondary';
    }
  }

  // ── Details modal (timeline + info) ────────────────────────────────
  public openDetails(req: RepairRequest) {
    this.selectedReq.set(req);
    this.showDetailModal = true;
  }

  public closeDetails() {
    this.showDetailModal = false;
    this.selectedReq.set(null);
  }

  // ── Submit Request modal ────────────────────────────────────────────
  public openRequestModal() {
    this.showRequestModal = true;
    this.reqEqId = '';
    this.reqCompId = '';
    this.reqFaultDesc = '';
    this.reqPriority = 'Routine';
    this.selectedEqSparePartList = [];
  }

  public closeRequestModal() { this.showRequestModal = false; }

  public onEqChange() {
    this.reqCompId = '';
    const eq = this.equipments().find(e => e.id === this.reqEqId);
    this.selectedEqSparePartList = eq?.spareParts ?? [];
  }

  public submitRequest() {
    if (!this.reqEqId || !this.reqFaultDesc.trim()) {
      this.notify.error('Please select an equipment and describe the fault.', '');
      return;
    }
    const eq = this.equipments().find(e => e.id === this.reqEqId);
    if (!eq?.assignedInstitutionId) {
      this.notify.error('Equipment not assigned to any institution', '');
      return;
    }
    const userId = this.userFacade.currentUser()?.id;
    if (!userId) { this.notify.error('Session expired', ''); return; }

    this.upsertService.submitRepairRequest(this.reqEqId, this.reqCompId || undefined,
      this.reqFaultDesc, this.reqPriority, userId)
      .subscribe({
        next: result => {
          this.onFilterChange();
          this.showRequestModal = false;
          this.notify.success('Repair request submitted', result.repairRequest.equipmentName);
        },
        error: err => this.notify.error('Failed to submit', err.message)
      });
  }

  // ── Officer Review & Triage modal ──────────────────────────────────
  public openReviewModal(req: RepairRequest) {
    this.selectedReq.set(req);
    this.triageDecision = 'PENDING';
    this.resetCompanyForm();
    this.showReviewModal = true;
  }

  public closeReviewModal() {
    this.showReviewModal = false;
    this.selectedReq.set(null);
    this.triageDecision = 'PENDING';
  }

  public selectTriage(decision: 'INTERNAL' | 'COMPANY') {
    this.triageDecision = decision;
  }

  // Officer confirms: assign to PDHS internal team
  public confirmInternalRepair() {
    const wo = this.selectedReq()?.workOrder;
    if (!wo) return;

    const payload: Partial<WorkOrder> = {
      assignedTechnicianId: this.userFacade.currentUser()?.id,
      assignedTechnicianName: this.userFacade.currentUser()?.fullName,
    };

    this.upsertService.updateWorkOrderStatus(wo.id, 'ACKNOWLEDGED', payload)
      .subscribe({
        next: () => {
          this.notify.success('Assigned to PDHS team', 'Work order acknowledged');
          this.closeReviewModal();
          this.onFilterChange();
        },
        error: err => this.notify.error('Failed to assign', err.message)
      });
  }

  // Officer confirms: escalate to company/vendor
  public confirmCompanyRepair() {
    const wo = this.selectedReq()?.workOrder;
    if (!wo) return;

    if (!this.vendorName.trim()) {
      this.notify.error('Please enter the company/vendor name', '');
      return;
    }
    if (this.handoverType === 'FIELD_VISIT' && !this.scheduledDate) {
      this.notify.error('Please enter the scheduled visit date', '');
      return;
    }
    if (this.handoverType === 'EQUIPMENT_SENT' && !this.dispatchDate) {
      this.notify.error('Please enter the dispatch date', '');
      return;
    }

    const dto = {
      vendorName: this.vendorName,
      vendorContact: this.vendorContact || undefined,
      repairBasis: this.repairBasis,
      handoverType: this.handoverType,
      scheduledDate: this.handoverType === 'FIELD_VISIT' ? this.scheduledDate! : undefined,
      dispatchDate: this.handoverType === 'EQUIPMENT_SENT' ? this.dispatchDate! : undefined,
      courierRef: this.courierRef || undefined,
    };

    this.upsertService.escalateToVendor(wo.id, dto)
      .subscribe({
        next: () => {
          this.notify.success('Escalated to company', this.vendorName);
          this.closeReviewModal();
          this.onFilterChange();
        },
        error: err => this.notify.error('Failed to escalate', err.message)
      });
  }

  private resetCompanyForm() {
    this.vendorName = '';
    this.vendorContact = '';
    this.repairBasis = 'WARRANTY';
    this.handoverType = 'FIELD_VISIT';
    this.scheduledDate = null;
    this.dispatchDate = null;
    this.courierRef = '';
  }

  // ── Technician Workbench modal ──────────────────────────────────────
  public openTechnicianModal(req: RepairRequest) {
    this.selectedReq.set(req);
    this.queryService.getWorkOrder(req.workOrder!.id).subscribe(wo => {
      this.workOrder.set(wo);
      if (!wo) return;
console.log('wo', wo)
      this.diagnosisNotes = wo.diagnosisNotes || '';
      this.techInspectedSpareParts = wo.inspectedSpareParts?.length
        ? [...wo.inspectedSpareParts]
        : (req as any).equipment?.spareParts?.map((c: any) =>
            ({ sparePartId: c.id, sparePartName: c.name, inspected: false, conditionNotes: '' })) ?? [];
      this.techPartsUsed = [...(wo.partsUsed || [])];
      this.tempItem = null;
      this.tempPartQty = 1;
      this.showTechnicianModal = true;
    });
  }

  public closeTechnicianModal() {
    this.showTechnicianModal = false;
    this.selectedReq.set(null);
    //this.workOrder.set(null);
  }

  public addPartToBuffer() {
    if (!this.tempItem) return;
    if (this.tempItem.currentStock < this.tempPartQty) {
      this.notify.error('Insufficient stock', `Available: ${this.tempItem.currentStock} units`);
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

  // Emergency self-acknowledge — technician bypasses officer review
  public selfAcknowledge(req: RepairRequest) {
    const wo = req.workOrder;
    if (!wo) return;
    const payload: Partial<WorkOrder> = {
      assignedTechnicianId: this.userFacade.currentUser()?.id,
      assignedTechnicianName: this.userFacade.currentUser()?.fullName,
    };
    this.upsertService.updateWorkOrderStatus(wo.id, 'ACKNOWLEDGED', payload)
      .subscribe({
        next: () => {
          this.notify.success('Emergency job accepted', req.equipmentName ?? '');
          this.onFilterChange();
        },
        error: err => this.notify.error('Failed', err.message)
      });
  }

  // Step-through transitions for internal track
  public runWorkOrderStep(step: 'Diagnose' | 'StartRepair' | 'AwaitParts' | 'Complete') {
    const wo = this.workOrder();
    if (!wo) return;

    let nextStatus: WorkOrderStatus = wo.status;
    const payload: Partial<WorkOrder> = {
      assignedTechnicianId: this.userFacade.currentUser()?.id,
      assignedTechnicianName: this.userFacade.currentUser()?.fullName,
    };

    switch (step) {
      case 'Diagnose':
        if (!this.diagnosisNotes.trim()) {
          this.notify.error('Please enter diagnostic findings first.', '');
          return;
        }
        nextStatus = 'DIAGNOSED';
        payload.diagnosisNotes = this.diagnosisNotes;
        payload.inspectedSpareParts = this.techInspectedSpareParts;
        break;
      case 'AwaitParts':
        nextStatus = 'AWAITING_PARTS';
        payload.diagnosisNotes = this.diagnosisNotes;
        payload.inspectedSpareParts = this.techInspectedSpareParts;
        break;
      case 'StartRepair':
        nextStatus = 'IN_REPAIR';
        break;
      case 'Complete':
        nextStatus = 'COMPLETED';
        payload.diagnosisNotes = this.diagnosisNotes;
        payload.inspectedSpareParts = this.techInspectedSpareParts;
        payload.partsUsed = this.techPartsUsed;
        break;
    }

    this.upsertService.updateWorkOrderStatus(wo.id, nextStatus, payload)
      .subscribe({
        next: result => {
          this.notify.success('Status updated', result.status);
          this.closeTechnicianModal();
          this.onFilterChange();
        },
        error: err => this.notify.error('Failed to update', err.message)
      });
  }

  // Supervisor verify and close — works for both tracks
  public verifyAndCloseWorkOrder(woId: string) {
    if (!confirm('Verify this repair and permanently close the work order?')) return;
    this.upsertService.updateWorkOrderStatus(woId, 'VERIFIED_CLOSED', {})
      .subscribe({
        next: () => { this.onFilterChange(); this.closeDetails(); },
        error: err => this.notify.error('Failed to close', err.message)
      });
  }

  // Role helpers
  public isOfficer(): boolean {
    return this.userFacade.hasAnyRole([RoleType.ADMIN_PDHS, RoleType.SUPER_ADMIN_PDHS]);
  }

  public isTechnician(): boolean {
    return this.userFacade.hasAnyRole([RoleType.BIOMEDICAL_TECHNICIAN, RoleType.SUPER_ADMIN_PDHS]);
  }

  public isSupervisor(): boolean {
    return this.userFacade.hasAnyRole([RoleType.ADMIN_PDHS, RoleType.SUPER_ADMIN_PDHS]);
  }
  
}

function equalsIgnoreCase(a: string | undefined, b: string | undefined): boolean {
  if (!a || !b) return false;
  return a.toLowerCase() === b.toLowerCase();
}