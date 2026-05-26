import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BiomedStateService } from '../../core/services/biomed-state.service';
import { Equipment, EquipmentCategory, User, Institution, EquipmentComponent } from '../../core/models/biomed.interface';

@Component({
  selector: 'app-inventory',
  imports: [CommonModule, FormsModule],
  templateUrl: './inventory.component.html',
  styleUrl: './inventory.component.css'
})
export class InventoryComponent implements OnInit {
  public currentUser: User | null = null;
  public equipment: Equipment[] = [];
  public filteredEquipment: Equipment[] = [];
  public institutions: Institution[] = [];

  // Filter properties
  public searchTerm = '';
  public selectedCategory = '';
  public selectedStatus = '';

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
  public newEqMfgDate = '';
  public newEqReceiptDate = '';
  public newEqWarranty = 12;
  // Sub-components adding buffer
  public componentBuffer: Omit<EquipmentComponent, 'id'>[] = [];
  public tempCompName = '';
  public tempCompPart = '';
  public tempCompSerial = '';
  public tempCompType: 'Serialized' | 'Consumable' | 'Minor/Non-tracked' = 'Serialized';

  // Assignment Form State
  public assignEqId = '';
  public assignDestInstId = '';

  constructor(private stateService: BiomedStateService) {}

  ngOnInit() {
    this.stateService.currentUser$.subscribe(u => {
      this.currentUser = u;
      this.applyFilters();
    });

    this.stateService.institutions$.subscribe(list => {
      this.institutions = list;
    });

    this.stateService.equipment$.subscribe(list => {
      this.equipment = list;
      this.applyFilters();
    });
  }

  public applyFilters() {
    if (!this.currentUser) return;

    const role = this.currentUser.role;
    let list = [...this.equipment];

    // 1. Role-based view segregation
    if (role === 'RDHS Officer' && this.currentUser.districtId) {
      // Show only equipment in their district institutions
      const districtInstIds = this.institutions
        .filter(i => i.districtId === this.currentUser?.districtId)
        .map(i => i.id);
      list = list.filter(e => e.assignedInstitutionId && districtInstIds.includes(e.assignedInstitutionId));
    } else if (role === 'Institution User' && this.currentUser.institutionId) {
      // Show only equipment assigned to their institution
      list = list.filter(e => e.assignedInstitutionId === this.currentUser?.institutionId);
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

    this.filteredEquipment = list;
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
    if (!this.tempCompName.trim() || !this.tempCompPart.trim()) return;
    this.componentBuffer.push({
      name: this.tempCompName,
      description: 'Part of parent assembly',
      partNumber: this.tempCompPart,
      serialNumber: this.tempCompSerial || undefined,
      quantity: 1,
      componentType: this.tempCompType
    });
    this.tempCompName = '';
    this.tempCompPart = '';
    this.tempCompSerial = '';
    this.tempCompType = 'Serialized';
  }

  public removeComponentFromBuffer(idx: number) {
    this.componentBuffer.splice(idx, 1);
  }

  public saveEquipment() {
    if (!this.newEqName.trim() || !this.newEqSerial.trim() || !this.newEqModel.trim()) {
      alert('Please fill out Name, Model, and Serial Number.');
      return;
    }

    // Save sub-components
    const components: EquipmentComponent[] = this.componentBuffer.map((c, i) => ({
      ...c,
      id: `eqc_${Date.now()}_${i}`
    }));

    const eqData: Omit<Equipment, 'id'> = {
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
      dateOfManufacture: this.newEqMfgDate || new Date().toISOString().split('T')[0],
      dateOfReceipt: this.newEqReceiptDate || new Date().toISOString().split('T')[0],
      warrantyPeriodMonths: this.newEqWarranty,
      components,
      status: 'PDHS Store'
    };

    this.stateService.addEquipment(eqData);
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
    this.newEqMfgDate = '';
    this.newEqReceiptDate = '';
    this.newEqWarranty = 12;
    this.tempCompName = '';
    this.tempCompPart = '';
    this.tempCompSerial = '';
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
    this.stateService.assignEquipment(this.assignEqId, this.assignDestInstId, 'Institution', 1);
    this.showAssignModal = false;
    this.selectedEq = null;
  }

  // Permission helper to check who can register assets (Admin and Procurement)
  public canRegister(): boolean {
    if (!this.currentUser) return false;
    return this.currentUser.role === 'System Administrator' || this.currentUser.role === 'Procurement Officer' || this.currentUser.role === 'Biomedical Technician';
  }

  // Permission helper to check who can assign assets (Admin and Technician)
  public canAssign(): boolean {
    if (!this.currentUser) return false;
    return this.currentUser.role === 'System Administrator' || this.currentUser.role === 'Biomedical Technician';
  }

  // Helper names
  public getInstitutionName(id?: string): string {
    if (!id) return 'PDHS store';
    return this.institutions.find(i => i.id === id)?.name || id;
  }
}
