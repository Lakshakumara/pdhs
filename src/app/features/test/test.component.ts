import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BiomedStateService } from '../../core/services/biomed-state.service';

import { UserFacadeService } from '../../core/services/user-facade.service';
import { QueryService } from '../../core/services/query.service';
import { UpsertService } from '../../core/services/upsert.service';
import { NotificationService } from '../../core/services/notification.service';
import { RepairRequest, WorkOrder, Institution, Equipment, InventoryItem, RepairPriority, WorkOrderStatus, PartUsedDetail } from '../../core/models/biomed.interface';
import { RoleType } from "../../core/models/permission.types";
import { HasPermissionDirective } from '../../core/directives/permission-directive';
import { Permission } from '../../core/models/permission.types';
import { AutoCompleteCompleteEvent, AutoCompleteModule } from 'primeng/autocomplete';

@Component({
  selector: 'test',
  imports: [CommonModule, FormsModule, HasPermissionDirective, AutoCompleteModule],
  templateUrl: './test.component.html',
  styleUrl: './test.component.css'
})
export class Test implements OnInit {

  readonly permission = Permission
  //public requests: RepairRequest[] = [];
  readonly workOrders = signal<WorkOrder[]>([]);
  readonly repairRequests = signal<RepairRequest[]>([]);

  public institutions: Institution[] = [];
  readonly equipments = signal<Equipment[]>([]);
  readonly inventoryItems = signal<InventoryItem[]>([]); // Store inventory list for technicians to pick spare parts
  filteredItems: any[] | undefined;
  // Pagination properties
  readonly totalPages = signal(1);
  readonly total = signal(0);
  readonly currentPage = signal(1);
  readonly pageSize = signal(10);

  // Filter properties
  public selectedPriority = '';
  // Filter properties
  public searchTerm = signal('');
  public selectedCategory = signal('');
  public selectedStatus = signal('');
  public selectedInstitutionId = signal('');

  // Modals
  public showDetailModal = false;
  public showRequestModal = false;
  public showTechnicianModal = false; // Panel for technicians to perform edits

  // Selected state
  public selectedReq: RepairRequest | null = null;
  public selectedWO: WorkOrder | null = null;
  //readonly selectedWO = signal<WorkOrder>(null);


  // Submit Request Form State
  public reqEqId = '';
  public reqCompId = '';
  public reqFaultDesc = '';
  public reqPriority: RepairPriority = 'Routine';
  public selectedEqSparePartList: any[] = [];

  // Technician Form Action State
  public diagnosisNotes = '';
  public techInspectedSpareParts: { sparePartId: string; sparePartName: string; inspected: boolean; conditionNotes: string }[] = [];
  // Buffer for parts used
  public techPartsUsed: PartUsedDetail[] = []//{ inventoryItemId: string; partName: string; quantityUsed: number; unitCost: number }[] = [];
  public tempItem!: InventoryItem | null;
  public tempPartQty = 1;

  constructor(
    private queryService: QueryService,
    private upsertService: UpsertService,
    private notify: NotificationService,
    private userFacade: UserFacadeService,
    private stateService: BiomedStateService) { }

  ngOnInit() {

    this.getEquipment();
    this.getRepairRequest();
    this.getWorkOrders();
    this.getInventoryItem();
    /*this.applyFilters();
    this.stateService.institutions$.subscribe(list => {
      this.institutions = list;
    });

    this.stateService.inventoryItems$.subscribe(list => {
      this.inventoryItems = list;
    });*/
  }

  // Pre-load equipment options for submitting request based on active user context

  filterItems(event: AutoCompleteCompleteEvent) {
    console.log('event', event.query)
    //in a real application, make a request to a remote url with the query and return filtered results, for demo we filter at client side
    this.queryService.getInventorytem(
      this.currentPage(),
      this.pageSize(),
      event.query,
      this.selectedCategory(),
      this.selectedStatus(),
    ).subscribe(result => {
      this.inventoryItems.set(result.items);
      this.total.set(result.total);
    });
  }

  getInventoryItem() {
    console.log('get equipment session ', this.userFacade.currentSession())
    if (this.userFacade.currentSession() == null) {
      console.log('return equipment sessionis null')
      return
    }
    this.queryService.getInventorytem(
      this.currentPage(),
      this.pageSize(),
      this.searchTerm(),
      this.selectedCategory(),
      this.selectedStatus(),
    ).subscribe(result => {
      this.inventoryItems.set(result.items);
      this.total.set(result.total);
    });
  }

  getRepairRequest() {
    this.queryService.getRepairRequest(
      this.currentPage(),
      this.pageSize(),
      this.searchTerm(),
      this.selectedCategory(),
      this.selectedStatus(),
    ).subscribe(result => {
      this.repairRequests.set(result.items);
      this.total.set(result.total);
    });
  }
  getEquipment() {
    console.log('get equipment session ', this.userFacade.currentSession())
    if (this.userFacade.currentSession() == null) {
      console.log('return equipment sessionis null')
      return
    }
    this.queryService.getEquipment(
      this.currentPage(),
      this.pageSize(),
      this.searchTerm(),
      this.selectedCategory(),
      this.selectedStatus(),
      this.selectedInstitutionId()
    ).subscribe(result => {
      this.equipments.set(result.items);
      this.total.set(result.total);
    });
  }

  getWorkOrders() {
    this.queryService.getWorkOrders(
      this.currentPage(),
      this.pageSize(),
      this.searchTerm(),
      this.selectedCategory(),
      this.selectedStatus(),
    ).subscribe(result => {
      this.workOrders.set(result.items);
      console.log('Wo received', result.items);
      this.total.set(result.total);
    });
  }
  public getWO(repairRequestId: string): any {
    //console.log('getWO requeatedId ', repairRequestId)
    return this.workOrders().find(o => o.repairRequestId === repairRequestId);
  }
  public applyFilters() {
  }

  //trigger on ticket submit
  public onEqChange() {
    this.reqCompId = '';
    const eq = this.equipments().find(e => e.id === this.reqEqId);
    this.selectedEqSparePartList = eq ? eq.spareParts : [];
  }

  // Details Dialog
  public openDetails(req: RepairRequest) {
    this.selectedReq = req;
    this.selectedWO = this.getWO(req.id)
    this.showDetailModal = true;

    //console.log('Detail Doalog data', this.selectedReq, this.selectedWO)
  }

  public closeDetails() {
    this.showDetailModal = false;
    this.selectedReq = null;
    this.selectedWO = null;
  }

  private syncSelectedWO() {
    if (this.selectedReq) {
      this.selectedWO = this.getWO(this.selectedReq.id) || null;
    }
  }

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
      this.notify.error('Equipment not assigned to any institution', 'Please select an equipment that is assigned to an institution.')
      return;
    }
    const submittedByUserId = this.userFacade.currentUser()?.id;
    if (!submittedByUserId) {
      this.notify.error('User Session Expired', 'Try Logging again')
      return
    }

    this.upsertService.submitRepairRequest(this.reqEqId, this.reqCompId || undefined,
      this.reqFaultDesc, this.reqPriority, submittedByUserId)
      .subscribe({
        next: result => {
          console.log('result', result)
          this.getEquipment();
          this.getRepairRequest();
          this.showRequestModal = false;
          this.notify.success('Repair request submitted successfully!', `Your repair request for ${result.repairRequest.equipmentName} has been submitted.`);
        },
        error: err => {
          this.notify.error('Failed to submit repair request', err.message || 'An error occurred while submitting your request. Please try again.');
        }
      });

  }

  // Technician Actions Dialog (Diagnosis & Repairs updates)
  public openTechnicianModal(req: any) {
    console.log('technical view', req)
    this.selectedReq = req;
    this.syncSelectedWO()

    //setTimeout(() => {
    const wo: any = this.selectedWO;
    if (!wo) return;

    this.diagnosisNotes = wo.diagnosisNotes || '';

    if (wo.inspectedComponents && wo.inspectedComponents.length > 0) {
      this.techInspectedSpareParts = [...wo.inspectedComponents];
    } else {
      this.techInspectedSpareParts = req.equipment.spareParts.map((c: any) =>
        ({ sparePartId: c.id, sparePartName: c.name, inspected: false, conditionNotes: '' }))
    }

    this.techPartsUsed = [...(wo.partsUsed || [])];
    this.tempItem = null;;
    this.tempPartQty = 1;
    this.showTechnicianModal = true;
    // }, 500);
  }

  public closeTechnicianModal() {
    this.showTechnicianModal = false;
    this.selectedReq = null;
    this.selectedWO = null;
  }

  // Technician Parts Add buffer
  public addPartToBuffer() {
    //console.log('temp ID', this.tempPartId)
    //if (!this.tempPartId) return;
    //const item = this.inventoryItems().find(i => i.id === this.tempPartId);
    //console.log('tem', item)
    if (this.tempItem === null) return;

    if (this.tempItem.currentStock < this.tempPartQty) {
      this.notify.error(`Insufficient stock!`, ` Available in PDHS store: ${this.tempItem.currentStock} units`);
      return;
    }

    // Check if item already added
    const existing = this.techPartsUsed.find(p => p.inventoryItemId === this.tempItem?.id);
    //console.log('found', existing)
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
    if (!this.selectedWO) return;

    let nextStatus: WorkOrderStatus = this.selectedWO.status;
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
    console.log('work order', this.selectedWO.id, nextStatus, payload)
    this.upsertService.updateWorkOrderStatus(this.selectedWO.id, nextStatus, payload)
      .subscribe(result => {
        this.getRepairRequest();
        console.log('updateWorkOrderStatus result', result)
        this.notify.success('Status Updated ', result.status)
        this.closeTechnicianModal();
      });

  }

  // Supervisor Verify and Close
  public verifyAndCloseWorkOrder(woId: string) {
    if (confirm('Are you sure you have verified this repair work and want to close the work order? This will permanently archive the ticket.')) {
      this.stateService.updateWorkOrderStatus(woId, 'Verified & Closed');
      this.closeDetails();
    }
  }

  // Role permissions helpers
  public canSubmit(): boolean {
    return true;
    // if (!this.userFacade.currentUser()) return false;
    // return this.userFacade.currentUser()?.roles[0]?.scopeType === 'INSTITUTE' || this.userFacade.hasAnyRole(['ADMIN_PDHS', 'SUPER_ADMIN_PDHS', 'ADMIN_RDHS', 'SUPER_ADMIN_RDHS', 'ADMIN_INSTITUTE', 'SUPER_ADMIN_INSTITUTE']);
  }

  public isTechnician(): boolean {
    if (!this.userFacade.currentUser()) return false;
    return this.userFacade.hasAnyRole([RoleType.BIOMEDICAL_TECHNICIAN, RoleType.SUPER_ADMIN_PDHS]);
  }

  public isSupervisor(): boolean {
    if (!this.userFacade.currentUser()) return false;
    return this.userFacade.hasAnyRole([RoleType.ADMIN_PDHS, RoleType.SUPER_ADMIN_PDHS]);
  }
  // Helper status color classes
  public getStatusClass(status: WorkOrderStatus): string {
    switch (status) {
      case 'Submitted': return 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-450';
      case 'Acknowledged': return 'bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400';
      case 'Diagnosed': return 'bg-purple-50 text-purple-700 dark:bg-purple-950/20 dark:text-purple-400';
      case 'In Repair': return 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/20 dark:text-indigo-400';
      case 'Completed': return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400';
      case 'Verified & Closed': return 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400';
      default: return 'bg-zinc-100 text-zinc-500';
    }
  }

  public getPriorityClass(p: RepairPriority): string {
    switch (p) {
      case 'Emergency': return 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400 font-extrabold';
      case 'Urgent': return 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400 font-bold';
      case 'Routine': return 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400';
      default: return 'bg-zinc-100 text-zinc-500';
    }
  }

  public getInstitutionName(id: string): string {
    return this.institutions.find(i => i.id === id)?.name || id;
  }
}
/*

  private loadMyEquipment() {
    if (!this.userFacade.currentUser()) return;
    const allEq = this.stateService.equipmentSubject.value; // load direct list
    if (this.userFacade.currentUser()?.roles[0]?.scopeType === 'INSTITUTE' && this.userFacade.currentUser()?.institutionId) {
      this.equipmentList = allEq.filter(e => e.assignedInstitutionId === this.userFacade.currentUser()?.institutionId);
    } else {
      this.equipmentList = allEq.filter(e => e.status === 'Assigned'); // Show all active assigned items
    }
  }
public applyFilters() {
    if (!this.userFacade.currentUser()) return;

    const role = this.userFacade.currentUser()?.roles[0]?.role;
    let list = [...this.requests];

    // 1. Role boundaries
    if (this.userFacade.currentUser()?.roles[0]?.scopeType === 'RDHS' && this.userFacade.currentUser()?.districtId) {
      const districtInstIds = this.institutions
        .filter(i => i.districtId === this.userFacade.currentUser()?.districtId)
        .map(i => i.id);
      list = list.filter(r => districtInstIds.includes(r.institutionId));
    } else if (this.userFacade.currentUser()?.roles[0]?.scopeType === 'INSTITUTE' && this.userFacade.currentUser()?.institutionId) {
      list = list.filter(r => r.institutionId === this.userFacade.currentUser()?.institutionId);
    }

    // 2. Status match (joins request with work order status)
    if (this.selectedStatus) {
      list = list.filter(r => {
        const order = this.workOrders.find(o => o.repairRequestId === r.id);
        return order?.status === this.selectedStatus;
      });
    }

    // 3. Priority match
    if (this.selectedPriority) {
      list = list.filter(r => r.priority === this.selectedPriority);
    }

    // 4. Text search
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      list = list.filter(r =>
        r.id.toLowerCase().includes(term) ||
        r.equipmentName.toLowerCase().includes(term) ||
        r.faultDescription.toLowerCase().includes(term) ||
        r.equipmentSerialNumber.toLowerCase().includes(term) ||
        r.institutionName.toLowerCase().includes(term)
      );
    }

    this.filteredRequests = list;
  }
*/