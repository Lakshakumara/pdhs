import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BiomedStateService } from '../../core/services/biomed-state.service';
import {
  RepairRequest,
  WorkOrder,
  Equipment,
  Institution,
  InventoryItem,
  RepairPriority,
  WorkOrderStatus,
  UserDto,
} from '../../core/models/biomed.interface';
import { UserFacadeService } from '../../core/services/user-facade.service';
import { PermissionService } from '../../core/auth/permission.service';
import { QueryService } from '../../core/services/query.service';

@Component({
  selector: 'app-repairs',
  imports: [CommonModule, FormsModule],
  templateUrl: './repairs.component.html',
  styleUrl: './repairs.component.css'
})
export class RepairsComponent implements OnInit {
  //public currentUser: UserDto | null = null;
  public requests: RepairRequest[] = [];
  public workOrders: WorkOrder[] = [];
  public filteredRequests: RepairRequest[] = [];

  public institutions: Institution[] = [];
  public equipmentList: Equipment[] = []; // Sub-list of equipment for submitting request
  public inventoryItems: InventoryItem[] = []; // Store inventory list for technicians to pick spare parts

  // Filter properties
  public searchTerm = '';
  public selectedStatus = '';
  public selectedPriority = '';

  // Modals
  public showDetailModal = false;
  public showRequestModal = false;
  public showTechnicianModal = false; // Panel for technicians to perform edits

  // Selected state
  public selectedReq: RepairRequest | null = null;
  public selectedWO: WorkOrder | null = null;

  // Submit Request Form State
  public reqEqId = '';
  public reqCompId = '';
  public reqFaultDesc = '';
  public reqPriority: RepairPriority = 'Routine';
  public selectedEqComponentsList: any[] = [];

  // Technician Form Action State
  public diagnosisNotes = '';
  public techInspectedComponents: { componentId: string; componentName: string; inspected: boolean; conditionNotes: string }[] = [];
  // Buffer for parts used
  public techPartsUsed: { inventoryItemId: string; partName: string; quantityUsed: number; unitCost: number }[] = [];
  public tempPartId = '';
  public tempPartQty = 1;

  constructor(
      public permission: PermissionService,
          private queryService: QueryService,
      public userApi: UserFacadeService, private stateService: BiomedStateService) { }

  ngOnInit() {

    this.getEquipment();
    this.applyFilters();
    /*this.stateService.institutions$.subscribe(list => {
      this.institutions = list;
    });

    this.stateService.equipment$.subscribe(list => {
      this.loadMyEquipment();
    });*/

    this.stateService.repairRequests$.subscribe(list => {
      this.requests = list;
      this.applyFilters();
    });

    this.stateService.workOrders$.subscribe(list => {
      this.workOrders = list;
      this.syncSelectedWO();
    });

    this.stateService.inventoryItems$.subscribe(list => {
      this.inventoryItems = list;
    });
  }

  // Pre-load equipment options for submitting request based on active user context
  
  getEquipment() {
    if (this.userApi.currentSession() == null) {
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
  public onEqChange() {
    this.reqCompId = '';
    const eq = this.equipmentList.find(e => e.id === this.reqEqId);
    this.selectedEqComponentsList = eq ? eq.components : [];
  }

  

  // Get matching work order
  public getWO(reqId: string): WorkOrder | undefined {
    return this.workOrders.find(o => o.repairRequestId === reqId);
  }

  // Details Dialog
  public openDetails(req: RepairRequest) {
    this.selectedReq = req;
    this.selectedWO = this.getWO(req.id) || null;
    this.showDetailModal = true;
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
    this.selectedEqComponentsList = [];
  }

  public closeRequestModal() {
    this.showRequestModal = false;
  }

  public submitRequest() {
    if (!this.reqEqId || !this.reqFaultDesc.trim()) {
      alert('Please select an equipment and describe the fault.');
      return;
    }

    this.stateService.submitRepairRequest(this.reqEqId, this.reqCompId || undefined, this.reqFaultDesc, this.reqPriority);
    this.showRequestModal = false;
  }

  // Technician Actions Dialog (Diagnosis & Repairs updates)
  public openTechnicianModal(req: RepairRequest) {
    this.selectedReq = req;
    const wo = this.getWO(req.id);
    if (!wo) return;

    this.selectedWO = wo;
    this.diagnosisNotes = wo.diagnosisNotes || '';

    // Load components of this equipment for inspection checklist
    const eqList = this.stateService.equipmentSubject.value;
    const eqObj = eqList.find(e => e.id === req.equipmentId);

    if (wo.inspectedComponents && wo.inspectedComponents.length > 0) {
      this.techInspectedComponents = [...wo.inspectedComponents];
    } else {
      this.techInspectedComponents = eqObj
        ? eqObj.components.map(c => ({ componentId: c.id, componentName: c.name, inspected: false, conditionNotes: '' }))
        : [];
    }

    this.techPartsUsed = [...wo.partsUsed];
    this.tempPartId = '';
    this.tempPartQty = 1;
    this.showTechnicianModal = true;
  }

  public closeTechnicianModal() {
    this.showTechnicianModal = false;
    this.selectedReq = null;
    this.selectedWO = null;
  }

  // Technician Parts Add buffer
  public addPartToBuffer() {
    if (!this.tempPartId) return;
    const item = this.inventoryItems.find(i => i.id === this.tempPartId);
    if (!item) return;

    if (item.currentStock < this.tempPartQty) {
      alert(`Insufficient stock! Available in PDHS store: ${item.currentStock} units.`);
      return;
    }

    // Check if item already added
    const existing = this.techPartsUsed.find(p => p.inventoryItemId === this.tempPartId);
    if (existing) {
      existing.quantityUsed += this.tempPartQty;
    } else {
      this.techPartsUsed.push({
        inventoryItemId: item.id,
        partName: item.name,
        quantityUsed: this.tempPartQty,
        unitCost: item.costPerUnit
      });
    }

    this.tempPartId = '';
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

    switch (step) {
      case 'Acknowledge':
        nextStatus = 'Acknowledged';
        break;
      case 'Diagnose':
        if (!this.diagnosisNotes.trim()) {
          alert('Please input your diagnostic findings first.');
          return;
        }
        nextStatus = 'Diagnosed';
        payload.diagnosisNotes = this.diagnosisNotes;
        payload.inspectedComponents = this.techInspectedComponents;
        break;
      case 'StartRepair':
        nextStatus = 'In Repair';
        break;
      case 'Complete':
        nextStatus = 'Completed';
        payload.diagnosisNotes = this.diagnosisNotes;
        payload.inspectedComponents = this.techInspectedComponents;
        payload.partsUsed = this.techPartsUsed;
        break;
    }

    this.stateService.updateWorkOrderStatus(this.selectedWO.id, nextStatus, payload);
    this.closeTechnicianModal();
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
    if (!this.userFacade.currentUser()) return false;
    return this.userFacade.currentUser()?.roles[0]?.scopeType === 'INSTITUTE' || this.userFacade.hasAnyRole(['ADMIN_PDHS', 'SUPER_ADMIN_PDHS', 'ADMIN_RDHS', 'SUPER_ADMIN_RDHS', 'ADMIN_INSTITUTE', 'SUPER_ADMIN_INSTITUTE']);
  }

  public isTechnician(): boolean {
    if (!this.userFacade.currentUser()) return false;
    return this.userFacade.hasAnyRole(['BIOMEDICAL_TECHNICIAN', 'SUPER_ADMIN_PDHS']);
  }

  public isSupervisor(): boolean {
    if (!this.userFacade.currentUser()) return false;
    return this.userFacade.hasAnyRole(['ADMIN_PDHS', 'SUPER_ADMIN_PDHS']);
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
      case 'Routine': return 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-350';
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