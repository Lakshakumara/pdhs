import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BiomedStateService } from '../../core/services/biomed-state.service';
import { Equipment, EquipmentCategory, Institution, EquipmentSpareParts } from '../../core/models/biomed.interface';
import { UserFacadeService } from '../../core/services/user-facade.service';
import { UpsertService } from '../../core/services/upsert.service';
import { RoleType } from "../../core/models/permission.types";

@Component({
  selector: 'app-inventory',
  imports: [CommonModule, FormsModule],
  templateUrl: './inventory.component.html',
  styleUrl: './inventory.component.css'
})
export class InventoryComponent implements OnInit {
  //public currentUser: UserDto | null = null;
  public equipment: Equipment[] = [];
  public filteredEquipment: Equipment[] = [];
  public institutions: Institution[] = [];

  // Filter properties
  public searchTerm = '';
  public selectedCategory = '';
  public selectedStatus = '';
  public selectedInstitutionId = '';

  // Pagination properties
  public currentPage = 1;
  public pageSize = 10;
  public totalPages = 1;
  public paginatedEquipment: Equipment[] = [];

  // Modal displays
  public showDetailModal = false;
  public showAddModal = false;
  public showAssignModal = false;

  // Selected Item details
  public selectedEq: Equipment | null = null;

  // New Equipment Form State
  public newEqName = '';
  public newEqDesc = '';
  public newEqCat: EquipmentCategory = 'General Medical';
  public newEqMan = '';
  public newEqCountry = '';
  public newEqSupplier = '';
  public newEqTender = '';
  public newEqPO = '';
  public newEqModel = '';
  public newEqSerial = '';
  public newEqBatch = '';
  public newEqQty = 1;
  public newEqMfgDate = null;
  public newEqReceiptDate = null;
  public newEqWarranty = 12;
  // Sub-components adding buffer
  public componentBuffer: Omit<EquipmentSpareParts, 'id'>[] = [];
  public tempCompName = '';
  public tempCompPart = '';
  public tempCompSerial = '';
  public tempCompType: 'Serialized' | 'Consumable' | 'Minor/Non-tracked' = 'Serialized';

  // Service Plan State
  public includeServicePlan = false;
  public spRef = '';
  public spExpiry: string | null = null;
  public spFreeServices = 0;
  public spServicePerAnnum = 0;
  public spServiceCosts = [0, 0, 0, 0, 0];
  public spLabourCosts = [0, 0, 0, 0, 0];
  public spTransportCosts = [0, 0, 0, 0, 0];
  public spOtherCosts = [0, 0, 0, 0, 0];
  public spSparePartsCosts = [0, 0, 0, 0, 0];

  // Spare Parts Cost adding buffer
  public sparePartsCostsBuffer: any[] = [];
  public tempSparePartName = '';
  public tempSparePartCosts = [0, 0, 0, 0, 0];

  // Assignment Form State
  public assignEqId = '';
  public assignDestInstId = '';

  constructor(private userFacade: UserFacadeService,
    private upsertService: UpsertService,
    private stateService: BiomedStateService) { }

  ngOnInit() {
    this.applyFilters();

    this.stateService.institutions$.subscribe(list => {
      this.institutions = list;
    });

    this.stateService.equipment$.subscribe(list => {
      this.equipment = list;
      this.applyFilters();
    });
  }

  public applyFilters() {
    if (!this.userFacade.currentUser()) return;
    let list = [...this.equipment];

    // 1. Role-based view segregation
    const hasAccess = this.userFacade.hasAnyRole([RoleType.ADMIN_RDHS, RoleType.SUPER_ADMIN_PDHS]);
    if (hasAccess) {
      // Show only equipment in their district institutions)
      const currentInstitution = this.institutions.find(
        i => i.id === this.userFacade.currentUser()?.institutionId
      );

      list = list.filter(e => e.assignedInstitutionId && this.userFacade.currentUser()?.districtId?.includes(e.assignedInstitutionId));
    } else if (this.userFacade.hasAnyRole([RoleType.INSTITUTION_USER, RoleType.ADMIN_INSTITUTE, RoleType.VIEWER_INSTITUTE]) && this.userFacade.currentUser()?.institutionId) {
      // Show only equipment assigned to their institution
      list = list.filter(e => e.assignedInstitutionId === this.userFacade.currentUser()?.institutionId);
    }

    // 2. Search filter
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      list = list.filter(e =>
        e.name.toLowerCase().includes(term) ||
        e.serialNumber.toLowerCase().includes(term) ||
        e.modelNumber.toLowerCase().includes(term) ||
        e.manufacturer.toLowerCase().includes(term) ||
        e.supplierName.toLowerCase().includes(term)
      );
    }

    // 3. Category filter
    if (this.selectedCategory) {
      list = list.filter(e => e.category === this.selectedCategory);
    }

    // 4. Status filter
    if (this.selectedStatus) {
      list = list.filter(e => e.status === this.selectedStatus);
    }

    // 5. Institution filter
    if (this.selectedInstitutionId) {
      list = list.filter(e => e.assignedInstitutionId === this.selectedInstitutionId);
    }

    this.filteredEquipment = list;
    this.currentPage = 1;
    this.updatePagination();
  }

  // Pagination Logic
  public updatePagination() {
    this.totalPages = Math.ceil(this.filteredEquipment.length / this.pageSize) || 1;
    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages;
    }
    const startIndex = (this.currentPage - 1) * this.pageSize;
    this.paginatedEquipment = this.filteredEquipment.slice(startIndex, startIndex + this.pageSize);
  }

  public nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePagination();
    }
  }

  public prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagination();
    }
  }

  public goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  // Details Modal
  public openDetails(eq: Equipment) {
    this.selectedEq = eq;
    this.showDetailModal = true;
  }

  public closeDetails() {
    this.showDetailModal = false;
    this.selectedEq = null;
  }

  // Register New Asset Modal
  public openAddModal() {
    this.showAddModal = true;
    this.componentBuffer = [];
    this.resetAddForm();
  }

  public closeAddModal() {
    this.showAddModal = false;
  }

  public addComponentToBuffer() {
    console.log('addComponentToBuffer click 143')
    if (!this.tempCompName.trim() || !this.tempCompPart.trim()) return;
    this.componentBuffer.push({
      name: this.tempCompName,
      description: 'Part of parent assembly',
      partNumber: this.tempCompPart,
      serialNumber: this.tempCompSerial || undefined,
      quantity: 1,
      sparePartType: this.tempCompType
    });
    this.tempCompName = '';
    this.tempCompPart = '';
    this.tempCompSerial = '';
    this.tempCompType = 'Serialized';
  }

  public removeComponentFromBuffer(idx: number) {
    this.componentBuffer.splice(idx, 1);
  }

  public addSparePartCostToBuffer() {
    if (!this.tempSparePartName.trim()) return;
    this.sparePartsCostsBuffer.push({
      name: this.tempSparePartName.trim(),
      year1: this.tempSparePartCosts[0] || 0,
      year2: this.tempSparePartCosts[1] || 0,
      year3: this.tempSparePartCosts[2] || 0,
      year4: this.tempSparePartCosts[3] || 0,
      year5: this.tempSparePartCosts[4] || 0
    });
    this.tempSparePartName = '';
    this.tempSparePartCosts = [0, 0, 0, 0, 0];
  }

  public removeSparePartCostFromBuffer(idx: number) {
    this.sparePartsCostsBuffer.splice(idx, 1);
  }

  public saveEquipment() {
    if (!this.newEqName.trim() || !this.newEqSerial.trim() || !this.newEqModel.trim()) {
      alert('Please fill out Name, Model, and Serial Number.');
      return;
    }

    // Save sub-components
    const parts: EquipmentSpareParts[] = this.componentBuffer.map((c, i) => ({
      ...c,
      id: `eqc_${Date.now()}_${i}`
    }));

    const eqData: Omit<Equipment, 'id'> = {
      invoiceNumber: '',
      name: this.newEqName,
      description: this.newEqDesc,
      category: this.newEqCat,
      manufacturer: this.newEqMan,
      countryOfOrigin: this.newEqCountry,
      supplierName: this.newEqSupplier,
      tenderNumber: this.newEqTender,
      purchaseOrderNumber: this.newEqPO,
      modelNumber: this.newEqModel,
      serialNumber: this.newEqSerial,
      batchNumber: this.newEqBatch,
      quantityReceived: this.newEqQty,
      dateOfManufacture: this.newEqMfgDate || null, //new Date().toISOString().split('T')[0],
      dateOfReceipt: this.newEqReceiptDate || null,// || new Date().toISOString().split('T')[0],
      warrantyPeriodMonths: this.newEqWarranty,
      spareParts: parts,
      status: 'PDHS Store'
    };

    if (this.includeServicePlan) {
      const yearObj = (arr: number[]) => {
        return { year1: arr[0], year2: arr[1], year3: arr[2], year4: arr[3], year5: arr[4] };
      };
      eqData.servicePlan = {
        id: `sp_${Date.now()}`,
        agreementReference: this.spRef,
        expiryDate: this.spExpiry || undefined,
        noOfFreeService: this.spFreeServices,
        servicePerAnnum: this.spServicePerAnnum,
        serviceCosts: yearObj(this.spServiceCosts),
        labourCosts: yearObj(this.spLabourCosts),
        transportCosts: yearObj(this.spTransportCosts),
        otherCosts: yearObj(this.spOtherCosts),
        sparePartsCosts: this.sparePartsCostsBuffer
      };

    }

    //this.stateService.addEquipment(eqData);

    this.upsertService.upsertEquipment(eqData).subscribe({
      next: (result) => {
        console.log('Equipment saved', result);
        this.showAddModal = false;
      },
      error: (err) => {
        console.error('Failed to save equipment', err);
      }
    });

    this.showAddModal = false;
  }

  private resetAddForm() {
    this.newEqName = '';
    this.newEqDesc = '';
    this.newEqCat = 'General Medical';
    this.newEqMan = '';
    this.newEqCountry = '';
    this.newEqSupplier = '';
    this.newEqTender = '';
    this.newEqPO = '';
    this.newEqModel = '';
    this.newEqSerial = '';
    this.newEqBatch = '';
    this.newEqQty = 1;
    this.newEqMfgDate = null;
    this.newEqReceiptDate = null;
    this.newEqWarranty = 12;
    this.tempCompName = '';
    this.tempCompPart = '';
    this.tempCompSerial = '';

    this.includeServicePlan = false;
    this.spRef = '';
    this.spExpiry = null;
    this.spFreeServices = 0;
    this.spServicePerAnnum = 0;
    this.spServiceCosts = [0, 0, 0, 0, 0];
    this.spLabourCosts = [0, 0, 0, 0, 0];
    this.spTransportCosts = [0, 0, 0, 0, 0];
    this.spOtherCosts = [0, 0, 0, 0, 0];
    this.spSparePartsCosts = [0, 0, 0, 0, 0];
    this.sparePartsCostsBuffer = [];
    this.tempSparePartName = '';
    this.tempSparePartCosts = [0, 0, 0, 0, 0];
  }

  // Assign Modal
  public openAssignModal(eq: Equipment) {
    this.assignEqId = eq.id;
    this.selectedEq = eq;
    this.assignDestInstId = '';
    this.showAssignModal = true;
  }

  public closeAssignModal() {
    this.showAssignModal = false;
    this.selectedEq = null;
  }

  public submitAssignment() {
    if (!this.assignDestInstId) {
      alert('Please select a destination institution.');
      return;
    }

    const inst = this.institutions.find(i => i.id === this.assignDestInstId);
    if (!inst) return;

    // Direct assignment to institution
    //this.stateService.assignEquipment(this.assignEqId, this.assignDestInstId, 'Institution', 1);
    this.showAssignModal = false;
    this.selectedEq = null;
  }

  // Permission helper to check who can register assets (Admin and Procurement)
  public canRegister(): boolean {
    if (!this.userFacade.currentUser()) return false;
    return this.userFacade.hasAnyRole([RoleType.SUPER_ADMIN_PDHS, RoleType.ADMIN_PDHS, RoleType.PROCUREMENT_OFFICER, RoleType.BIOMEDICAL_TECHNICIAN]);
  }

  // Permission helper to check who can assign assets (Admin and Technician)
  public canAssign(): boolean {
    if (!this.userFacade.currentUser()) return false;
    return this.userFacade.hasAnyRole([RoleType.SUPER_ADMIN_PDHS, RoleType.ADMIN_PDHS]
    )
  }

  public isAdmin(): boolean {
    if (!this.userFacade.currentUser()) return false;
    return this.userFacade.hasAnyRole([RoleType.SUPER_ADMIN_PDHS, RoleType.ADMIN_PDHS]);
  }

  public updateEquipment(eq: Equipment) {
    alert('Update functionality to be implemented.');
  }

  public disposeEquipment(eq: Equipment) {
    if (confirm(`Are you sure you want to dispose of ${eq.name}? This action is irreversible.`)) {
      alert('Dispose functionality to be implemented.');
    }
  }

  public viewRepairHistory(eq: Equipment) {
    alert(`Showing repair history for ${eq.name} (To be implemented)`);
  }

  // Helper names
  public getInstitutionName(id?: string): string {
    if (!id) return 'PDHS store';
    return this.institutions.find(i => i.id === id)?.name || id;
  }
}
