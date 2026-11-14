import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { UserFacadeService } from '../../core/services/user-facade.service';
import { QueryService } from '../../core/services/query.service';
import { UpsertService } from '../../core/services/upsert.service';
import { NotificationService } from '../../core/services/notification.service';
import {
  RepairRequest,
  WorkOrder,
  Equipment,
  InventoryItem,
  RepairPriority,
  WorkOrderStatus,
  PartUsedDetail,
  InspectedSparePart,
} from '../../core/models/biomed.interface';
import { RoleType } from '../../core/models/permission.types';
import { HasPermissionDirective } from '../../core/directives/permission-directive';

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
import { equalsIgnoreCase } from '../../core/utils/helper';
import { Permission } from '../../core/constants/permissions';
// ─────────────────────────────────────────────────────────────────────
// Internal track timeline — repair phase, then the post-repair chain:
// feedback → payment → MS → RDHS → PDHD (auto-close)
// Vendor track timeline — company does the repair phase, then the
// same post-repair chain
// ─────────────────────────────────────────────────────────────────────
const INTERNAL_STEPS: WorkOrderStatus[] = [
  'SUBMITTED',
  'ACKNOWLEDGED',
  'DIAGNOSED',
  'AWAITING_PARTS',
  'IN_REPAIR',
  'COMPLETED',
  'AWAITING_FEEDBACK',
  'PAYMENT_PENDING',
  'MS_APPROVAL',
  'RDHS_APPROVAL',
  'PDHS_APPROVAL',
  'VERIFIED_CLOSED',
];

const VENDOR_STEPS: WorkOrderStatus[] = [
  'SUBMITTED',
  'ACKNOWLEDGED',
  'DIAGNOSED',
  'ESCALATED_TO_VENDOR',
  'VENDOR_IN_PROGRESS',
  'VENDOR_COMPLETED',
  'AWAITING_FEEDBACK',
  'PAYMENT_PENDING',
  'MS_APPROVAL',
  'RDHS_APPROVAL',
  'PDHS_APPROVAL',
  'VERIFIED_CLOSED',
];

const STEP_LABELS: Record<string, string> = {
  SUBMITTED: 'Submitted',
  ACKNOWLEDGED: 'Assigned',
  DIAGNOSED: 'Diagnosed',
  AWAITING_PARTS: 'Awaiting Parts',
  IN_REPAIR: 'In Repair',
  COMPLETED: 'Completed',
  ESCALATED_TO_VENDOR: 'Escalated',
  VENDOR_IN_PROGRESS: 'Company Repair',
  VENDOR_COMPLETED: 'Company Done',
  AWAITING_FEEDBACK: 'User Review',
  PAYMENT_PENDING: 'Payment',
  MS_APPROVAL: 'MS Approval',
  RDHS_APPROVAL: 'RDHS Approval',
  PDHS_APPROVAL: 'PDHD Approval',
  VERIFIED_CLOSED: 'Closed',
};

// Statuses in which the end-user repair review can be submitted
// (COMPLETED/VENDOR_COMPLETED = legacy records from before the chain)
const REVIEWABLE_STATUSES = ['AWAITING_FEEDBACK', 'COMPLETED', 'VENDOR_COMPLETED'];

function stepsForTrack(track?: string): WorkOrderStatus[] {
  return track === 'VENDOR' ? VENDOR_STEPS : INTERNAL_STEPS;
}

@Component({
  selector: 'app-repairs',
  imports: [
    CommonModule,
    FormsModule,
    HasPermissionDirective,
    AutoCompleteModule,
    TableModule,
    DialogModule,
    TagModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    IconFieldModule,
    InputIconModule,
    TextareaModule,
    InputNumberModule,
    CheckboxModule,
    ToolbarModule,
    SkeletonModule,
    DatePickerModule,
    ToggleSwitchModule,
    TooltipModule,
    DividerModule,
  ],
  templateUrl: './repairs.component.html',
  styleUrl: './repairs.component.css',
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
    { label: 'Routine', value: 'Routine' },
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
    // Post-repair chain
    { label: 'Awaiting User Review', value: 'AWAITING_FEEDBACK' },
    { label: 'Payment Pending', value: 'PAYMENT_PENDING' },
    { label: 'Awaiting MS Approval', value: 'MS_APPROVAL' },
    { label: 'Awaiting RDHS Approval', value: 'RDHS_APPROVAL' },
    { label: 'Awaiting PDHD Approval', value: 'PDHS_APPROVAL' },
  ];

  public readonly internalSteps = INTERNAL_STEPS;

  public stepsForTrack(track?: string): WorkOrderStatus[] {
    return stepsForTrack(track);
  }

  // ── Modal visibility ────────────────────────────────────────────────
  public showDetailModal = false;
  public showRequestModal = false;
  public showTechnicianModal = false;
  public showReviewModal = false; // Officer review + triage decision

  // ── Post-repair chain dialogs (feedback → payment → MS/RDHS/PDHD) ──
  public showFeedbackModal = false;
  public showPaymentModal = false;
  public showApprovalModal = false;
  public feedbackApproved = true;
  public feedbackComment = '';
  public postComment = '';
  public approvalStage: 'MS' | 'RDHS' | 'PDHS' = 'MS';

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
  public selectedServiceYear = 1;

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
    //{ label: 'Paid Repair (Third-Party)', value: 'PAID' }
  ];

  public readonly handoverTypeOptions = [
    { label: 'Field Visit (Vendor comes on-site)', value: 'FIELD_VISIT' },
    { label: 'Equipment Sent to Workshop', value: 'EQUIPMENT_SENT' },
  ];

  constructor(
    private queryService: QueryService,
    private upsertService: UpsertService,
    private notify: NotificationService,
    private userFacade: UserFacadeService,
  ) {}

  ngOnInit() {
    this.getEquipment();
    this.getInventoryItem();
  }
  getInventoryItem() {
    if (!this.userFacade.currentSession()) return;
    this.queryService
      .getInventoryItems(1, 20, '', '', '')
      .subscribe((result) => this.inventoryItems.set(result.items));
  }

  getEquipment() {
    if (!this.userFacade.currentSession()) return;
    this.queryService
      .getEquipment(1, 100, '', '', '', '')
      .subscribe((result) => this.equipments.set(result.items));
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

    this.queryService
      .getRepairRequest(page, rows, this.searchTerm, this.selectedPriority, this.selectedStatus)
      .subscribe({
        next: (result) => {
          console.log('result', result);
          this.repairRequests.set(result.items);
          this.total.set(result.total);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  public onFilterChange() {
    this.currentPage.set(1);
    this.onLazyLoad({
      first: 0,
      rows: this.pageSize(),
      sortField: this.sortField,
      sortOrder: this.sortOrder,
    });
  }

  public filterItems(event: AutoCompleteCompleteEvent) {
    this.queryService
      .getInventoryItems(this.currentPage(), this.pageSize(), event.query, '', '')
      .subscribe((result) => this.inventoryItems.set(result.items));
  }

  // ── Status helpers ──────────────────────────────────────────────────
  public isVendorTrack(status: string): boolean {
    return ['ESCALATED_TO_VENDOR', 'VENDOR_IN_PROGRESS', 'VENDOR_COMPLETED'].includes(status);
  }

  public isStepComplete(step: WorkOrderStatus, current: WorkOrderStatus, track?: string): boolean {
    const steps = stepsForTrack(track);
    const curIdx = steps.findIndex((s) => equalsIgnoreCase(s, current));
    const stepIdx = steps.findIndex((s) => equalsIgnoreCase(s, step));
    if (curIdx === -1 || stepIdx === -1) return false;
    return stepIdx <= curIdx;
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

  public getStatusSeverity(
    status: string,
  ): 'warn' | 'info' | 'secondary' | 'contrast' | 'success' | 'danger' {
    switch (status) {
      case 'SUBMITTED':
        return 'warn';
      case 'ACKNOWLEDGED':
        return 'info';
      case 'DIAGNOSED':
        return 'contrast';
      case 'AWAITING_PARTS':
        return 'warn';
      case 'IN_REPAIR':
        return 'info';
      case 'ESCALATED_TO_VENDOR':
        return 'contrast';
      case 'VENDOR_IN_PROGRESS':
        return 'info';
      case 'VENDOR_COMPLETED':
        return 'success';
      case 'COMPLETED':
        return 'success';
      case 'AWAITING_FEEDBACK':
        return 'warn';
      case 'PAYMENT_PENDING':
        return 'warn';
      case 'MS_APPROVAL':
        return 'info';
      case 'RDHS_APPROVAL':
        return 'info';
      case 'PDHS_APPROVAL':
        return 'contrast';
      case 'VERIFIED_CLOSED':
        return 'secondary';
      default:
        return 'secondary';
    }
  }

  public getStatusLabel(status: string): string {
    const found = this.statusOptions.find((o) => equalsIgnoreCase(o.value, status));
    return found?.label ?? status;
  }

  /** Friendly short label for the step-through stepper dots. */
  public stepLabel(status: WorkOrderStatus): string {
    return STEP_LABELS[status] ?? status;
  }

  public getPrioritySeverity(p: RepairPriority): 'danger' | 'warn' | 'secondary' {
    switch (p) {
      case 'Emergency':
        return 'danger';
      case 'Urgent':
        return 'warn';
      default:
        return 'secondary';
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

  public closeRequestModal() {
    this.showRequestModal = false;
  }

  public onEqChange() {
    this.reqCompId = '';
    const eq = this.equipments().find((e) => e.id === this.reqEqId);
    this.selectedEqSparePartList = eq?.spareParts ?? [];
  }

  public submitRequest() {
    if (!this.reqEqId || !this.reqFaultDesc.trim()) {
      this.notify.error('Please select an equipment and describe the fault.', '');
      return;
    }
    const eq = this.equipments().find((e) => e.id === this.reqEqId);
    if (!eq?.assignedInstitutionId) {
      this.notify.error('Equipment not assigned to any institution', '');
      return;
    }
    const userId = this.userFacade.currentUser()?.id;
    if (!userId) {
      this.notify.error('Session expired', '');
      return;
    }

    this.upsertService
      .submitRepairRequest(
        this.reqEqId,
        this.reqCompId || undefined,
        this.reqFaultDesc,
        this.reqPriority,
        userId,
      )
      .subscribe({
        next: (result) => {
          this.onFilterChange();
          this.showRequestModal = false;
          this.notify.success('Repair request submitted', result.repairRequest.equipmentName);
        },
        error: () => {},
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

    this.upsertService.updateWorkOrderStatus(wo.id, 'ACKNOWLEDGED', payload).subscribe({
      next: () => {
        this.notify.success('Assigned to PDHS team', 'Work order acknowledged');
        this.closeReviewModal();
        this.onFilterChange();
      },
      error: () => {},
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

    this.upsertService.escalateToVendor(wo.id, dto).subscribe({
      next: () => {
        this.notify.success('Escalated to company', this.vendorName);
        this.closeReviewModal();
        this.onFilterChange();
      },
      error: () => {},
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
    this.queryService.getWorkOrder(req.id).subscribe((wo) => {
      this.workOrder.set(wo);
      if (!wo) return;
      this.diagnosisNotes = wo?.diagnosisNotes || '';
      this.techInspectedSpareParts = wo.inspectedSpareParts?.length
        ? [...wo.inspectedSpareParts]
        : ((req as any).equipment?.spareParts?.map((c: any) => ({
            sparePartId: c.id,
            sparePartName: c.name,
            inspected: false,
            conditionNotes: '',
          })) ?? []);

      this.techPartsUsed = (wo.partsUsed || []).map((p: any) => ({
        id: p.id,
        inventoryItemId: p.inventoryItemId,
        inventoryItemName: p.inventoryItem?.name || p.inventoryItemName,
        quantity: Number(p.quantity), // Prisma Decimal maps to string/number
        unitCost: p.unitCost ?? p.inventoryItem?.costPerUnit ?? 0,
        status: p.status || 'BUFFERED', // 👈 Fallback to BUFFERED if not set
      }));

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
    const existing = this.techPartsUsed.find((p) => p.inventoryItemId === this.tempItem?.id);
    if (existing) {
      existing.quantity += this.tempPartQty;
    } else {
      this.techPartsUsed.push({
        inventoryItemId: this.tempItem.id,
        inventoryItemName: this.tempItem.name,
        quantity: this.tempPartQty,
        unitCost: this.tempItem.costPerUnit,
        status: 'BUFFERED',
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
    this.upsertService.updateWorkOrderStatus(wo.id, 'ACKNOWLEDGED', payload).subscribe({
      next: () => {
        this.notify.success('Emergency job accepted', req.equipmentName ?? '');
        this.onFilterChange();
      },
      error: () => {},
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
    console.log('pay load 1', payload);
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
        payload.partsUsed = this.techPartsUsed;
        break;
      case 'StartRepair':
        nextStatus = 'IN_REPAIR';
        payload.diagnosisNotes = this.diagnosisNotes;
        payload.partsUsed = this.techPartsUsed;
        break;
      case 'Complete':
        nextStatus = 'COMPLETED';
        payload.diagnosisNotes = this.diagnosisNotes;
        payload.inspectedSpareParts = this.techInspectedSpareParts;
        payload.partsUsed = this.techPartsUsed.map((p) => ({
          ...p,
          status: 'CONSUMED',
        }));
        break;
    }
    this.upsertService.updateWorkOrderStatus(wo.id, nextStatus, payload).subscribe({
      next: (result) => {
        this.notify.success('Status updated', this.getStatusLabel(result.status));
        this.closeTechnicianModal();
        this.onFilterChange();
      },
      error: () => {},
    });
  }

  // Supervisor verify and close — works for both tracks
  public verifyAndCloseWorkOrder(woId: string) {
    if (!confirm('Verify this repair and permanently close the work order?')) return;
    this.upsertService.updateWorkOrderStatus(woId, 'VERIFIED_CLOSED', {}).subscribe({
      next: () => {
        this.onFilterChange();
        this.closeDetails();
      },
      error: () => {},
    });
  }

  // ── Post-repair chain (feedback → payment → MS → RDHS → PDHD) ──────
  public canReviewFeedback(wo?: WorkOrder | null): boolean {
    return !!wo && REVIEWABLE_STATUSES.includes(wo.status);
  }

  public isPaymentPending(wo?: WorkOrder | null): boolean {
    return wo?.status === 'PAYMENT_PENDING';
  }

  public approvalStageFor(wo?: WorkOrder | null): 'MS' | 'RDHS' | 'PDHS' | null {
    switch (wo?.status) {
      case 'MS_APPROVAL':
        return 'MS';
      case 'RDHS_APPROVAL':
        return 'RDHS';
      case 'PDHS_APPROVAL':
        return 'PDHS';
      default:
        return null;
    }
  }

  public openFeedbackModal() {
    this.feedbackApproved = true;
    this.feedbackComment = '';
    this.showFeedbackModal = true;
  }

  public submitFeedback() {
    const wo = this.selectedReq()?.workOrder;
    if (!wo) return;
    if (!this.feedbackApproved && !this.feedbackComment.trim()) {
      this.notify.error('Please describe what is still wrong.', '');
      return;
    }
    this.upsertService
      .submitRepairFeedback(wo.id, this.feedbackApproved, this.feedbackComment.trim() || undefined)
      .subscribe({
        next: (result) => {
          this.notify.success(
            this.feedbackApproved ? 'Repair accepted — moving to payment' : 'Sent back for rework',
            '',
          );
          this.showFeedbackModal = false;
          this.applyChainResult(result);
        },
        error: () => {},
      });
  }

  public openPaymentModal() {
    this.postComment = '';
    this.showPaymentModal = true;
  }

  public submitPayment() {
    const wo = this.selectedReq()?.workOrder;
    if (!wo) return;
    if (!this.postComment.trim()) {
      this.notify.error('Please enter a payment reference or remark.', '');
      return;
    }
    this.upsertService.recordRepairPayment(wo.id, this.postComment.trim()).subscribe({
      next: (result) => {
        this.notify.success('Payment recorded', 'Awaiting MS approval');
        this.showPaymentModal = false;
        this.applyChainResult(result);
      },
      error: () => {},
    });
  }

  public openApprovalModal(stage: 'MS' | 'RDHS' | 'PDHS') {
    this.approvalStage = stage;
    this.postComment = '';
    this.showApprovalModal = true;
  }

  public approvalFlowHint(): string {
    switch (this.approvalStage) {
      case 'MS':
        return 'Next: RDHS approval.';
      case 'RDHS':
        return 'Next: PDHD approval.';
      default:
        return 'This final approval verifies & closes the work order.';
    }
  }

  public submitApproval() {
    const wo = this.selectedReq()?.workOrder;
    if (!wo) return;
    this.upsertService
      .approveRepairStage(wo.id, this.approvalStage, this.postComment.trim() || undefined)
      .subscribe({
        next: (result) => {
          this.notify.success(
            `${this.approvalStage} approval recorded`,
            result.status === 'VERIFIED_CLOSED'
              ? 'Work order verified & closed'
              : 'Next approval pending',
          );
          this.showApprovalModal = false;
          this.applyChainResult(result);
        },
        error: () => {},
      });
  }

  // Keep the open details modal in sync after a chain action + refresh list.
  private applyChainResult(result: { status: string; updated?: any }) {
    const req = this.selectedReq();
    if (req?.workOrder) {
      this.selectedReq.set({
        ...req,
        workOrder: {
          ...req.workOrder,
          ...(result.updated ?? {}),
          status: result.status as WorkOrderStatus,
        },
      });
    }
    this.onFilterChange();
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

  // ── Service plan year-cost helpers ─────────────────────────────────
  public getYearCost(costs: any, year: number): number {
    if (!costs) return 0;
    return costs[`year${year}`] ?? 0;
  }

  public getPartYearCost(part: any, year: number): number {
    if (!part) return 0;
    return part[`year${year}`] ?? 0;
  }
}
