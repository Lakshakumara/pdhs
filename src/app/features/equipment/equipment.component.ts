import { Component, effect, OnInit, signal } from '@angular/core';
import { UserFacadeService } from '../../core/services/user-facade.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Institution, EquipmentCategory, Equipment, EquipmentParts } from '../../core/models/biomed.interface';
import { QueryService } from '../../core/services/query.service';
import { PermissionService } from '../../core/auth/permission.service';
import { NotificationService } from '../../core/services/notification.service';
import { UpsertService } from '../../core/services/upsert.service';
import { HasPermissionDirective } from '../../core/auth/permission-directive';
import { Permission } from '../../core/auth/permission.types';

@Component({
  selector: 'app-equipment',
  imports: [CommonModule, FormsModule, HasPermissionDirective],
  templateUrl: './equipment.component.html',
  styleUrl: './equipment.component.css',
})
export class EquipmentComponent implements OnInit {
  readonly Permission = Permission;
  readonly institutions = signal<Institution[]>([]);
  // Filter properties
  public searchTerm = signal('');
  public selectedCategory = signal('');
  public selectedStatus = signal('');
  public selectedInstitutionId = signal('');

  // Pagination properties
  readonly totalPages = signal(1);
  readonly total = signal(0);
  readonly currentPage = signal(1);
  readonly pageSize = signal(10);

  readonly equipments = signal<Equipment[]>([]);

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
  // Spare parts adding buffer
  public partsBuffer: Omit<EquipmentParts, 'id'>[] = [];
  public tempPartName = '';
  public tempPartNumber = '';
  public tempPartSerialNumber = '';
  public tempPartType: 'Serialized' | 'Consumable' | 'Minor/Non-tracked' = 'Serialized';

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

  // Edit mode
  public isEditMode = false;
  public editingEquipmentId: string | null = null;

  constructor(
    public permission: PermissionService,
    public userApi: UserFacadeService,
    public queryService: QueryService,
    private upsertService: UpsertService,
    private notify: NotificationService) {
    effect(() => {
      this.getInstitute();
      this.getEquipment();
    })
  }

  ngOnInit(): void {
  }

  getInstitute() {
    if (this.userApi.currentSession() == null) {
      console.log('return institute sessionis null')
      return
    }
    this.queryService.getInstitute(1, 100
    ).subscribe(result => {
      this.institutions.set(result.items);
    });
  }

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

  // Details Modal
  public openDetails(eq: Equipment) {
    this.selectedEq = eq;
    console.log('selected eq', eq)
    this.showDetailModal = true;
  }

  public closeDetails() {
    this.showDetailModal = false;
    this.selectedEq = null;
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
      this.notify.warn('Please select a destination institution.');
      return;
    }

    const inst = this.institutions().find(i => i.id === this.assignDestInstId);
    if (!inst) return;

    // Direct assignment to institution
    this.upsertService.assignEquipment(this.assignEqId, this.assignDestInstId, 'Institution', 1, inst.name)
      .subscribe({
        next: result => {
          this.getEquipment();
          this.showAssignModal = false;
          this.selectedEq = null;
          this.notify.success('Equipment Assigned to', inst.name);
        },
        error: err => {
          this.notify.error('Failed to Assigned equipment', err.message);
        }
      });

  }

  // Register New Asset Modal
  public openAddModal() {

    this.isEditMode = false;
    this.editingEquipmentId = null;

    this.showAddModal = true;
    this.partsBuffer = [];
    this.resetAddForm();
  }

  public closeAddModal() {
    this.showAddModal = false;

    this.isEditMode = false;
    this.editingEquipmentId = null;

  }

  public addPartsToBuffer() {
    if (!this.tempPartName.trim() || !this.tempPartNumber.trim()) return;
    this.partsBuffer.push({
      name: this.tempPartName,
      description: 'Part of parent assembly',
      partNumber: this.tempPartNumber,
      serialNumber: this.tempPartSerialNumber || undefined,
      quantity: 1,
      componentType: this.tempPartType
    });
    this.tempPartName = '';
    this.tempPartNumber = '';
    this.tempPartSerialNumber = '';
    this.tempPartType = 'Serialized';
  }

  public removeComponentFromBuffer(idx: number) {
    this.partsBuffer.splice(idx, 1);
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
      this.notify.warn('Required Fields are missing ', 'Name, Model, and Serial Number.');
      return;
    }

    // Save spare parts 
    const parts: EquipmentParts[] = this.partsBuffer.map((c, i) => ({
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
      dateOfManufacture: this.newEqMfgDate || null, //new Date().toISOString().split('T')[0],
      dateOfReceipt: this.newEqReceiptDate || null,// || new Date().toISOString().split('T')[0],
      warrantyPeriodMonths: this.newEqWarranty,
      components: parts,
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
    if (this.isEditMode) {
      const eq = {
        id: this.editingEquipmentId ?? '',
        ...eqData
      }

      this.upsertService.updateEquipment(eq)
        .subscribe({
          next: result => {
            this.getEquipment();
            this.showAddModal = false;
            this.isEditMode = false;
            this.editingEquipmentId = null;
            this.notify.success('Equipment Updated', result.name);
          },
          error: err => {
            this.notify.error('Failed to save equipment', err.message);
          }
        });
    } else {
      this.upsertService.upsertEquipment(eqData)
        .subscribe({
          next: result => {
            this.getEquipment();
            this.showAddModal = false;
            this.notify.success('Equipment saved', result.name);
          },
          error: err => {
            this.notify.error('Failed to save equipment', err.message);
          }
        });
    }
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
    this.tempPartName = '';
    this.tempPartNumber = '';
    this.tempPartSerialNumber = '';
    this.tempPartType = 'Serialized';
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

  public updateEquipment(eq: Equipment) {
    console.log('updateEquipment', eq)
    this.isEditMode = true;
    this.editingEquipmentId = eq.id;

    this.newEqName = eq.name;
    this.newEqDesc = eq.description ?? '';
    this.newEqCat = eq.category;
    this.newEqMan = eq.manufacturer ?? '';
    this.newEqCountry = eq.countryOfOrigin ?? '';
    this.newEqSupplier = eq.supplierName ?? '';
    this.newEqTender = eq.tenderNumber ?? '';
    this.newEqPO = eq.purchaseOrderNumber ?? '';

    this.newEqModel = eq.modelNumber ?? '';
    this.newEqSerial = eq.serialNumber ?? '';
    this.newEqBatch = eq.batchNumber ?? '';

    this.newEqQty = eq.quantityReceived ?? 1;

    this.newEqMfgDate = eq.dateOfManufacture as any;
    this.newEqReceiptDate = eq.dateOfReceipt as any;

    this.newEqWarranty = eq.warrantyPeriodMonths ?? 12;

    // Components
    this.partsBuffer = [...(eq.components ?? [])];

    // Service Plan
    if (eq.servicePlan) {

      this.includeServicePlan = true;

      this.spRef = eq.servicePlan.agreementReference ?? '';

      this.spExpiry =
        eq.servicePlan.expiryDate
          ? String(eq.servicePlan.expiryDate).substring(0, 10)
          : null;

      this.spFreeServices =
        eq.servicePlan.noOfFreeService ?? 0;

      this.spServicePerAnnum =
        eq.servicePlan.servicePerAnnum ?? 0;

      this.spServiceCosts = [
        eq.servicePlan.serviceCosts?.year1 ?? 0,
        eq.servicePlan.serviceCosts?.year2 ?? 0,
        eq.servicePlan.serviceCosts?.year3 ?? 0,
        eq.servicePlan.serviceCosts?.year4 ?? 0,
        eq.servicePlan.serviceCosts?.year5 ?? 0
      ];

      this.spLabourCosts = [
        eq.servicePlan.labourCosts?.year1 ?? 0,
        eq.servicePlan.labourCosts?.year2 ?? 0,
        eq.servicePlan.labourCosts?.year3 ?? 0,
        eq.servicePlan.labourCosts?.year4 ?? 0,
        eq.servicePlan.labourCosts?.year5 ?? 0
      ];

      this.spTransportCosts = [
        eq.servicePlan.transportCosts?.year1 ?? 0,
        eq.servicePlan.transportCosts?.year2 ?? 0,
        eq.servicePlan.transportCosts?.year3 ?? 0,
        eq.servicePlan.transportCosts?.year4 ?? 0,
        eq.servicePlan.transportCosts?.year5 ?? 0
      ];

      this.spOtherCosts = [
        eq.servicePlan.otherCosts?.year1 ?? 0,
        eq.servicePlan.otherCosts?.year2 ?? 0,
        eq.servicePlan.otherCosts?.year3 ?? 0,
        eq.servicePlan.otherCosts?.year4 ?? 0,
        eq.servicePlan.otherCosts?.year5 ?? 0
      ];

      this.sparePartsCostsBuffer = [
        ...(eq.servicePlan.sparePartsCosts ?? [])
      ];

    } else {

      this.includeServicePlan = false;

    }

    this.showAddModal = true;
  }

  public disposeEquipment(eq: Equipment) {
    if (confirm(`Are you sure you want to dispose of ${eq.name}? This action is irreversible.`)) {
      alert('Dispose functionality to be implemented.');
    }
  }

  public viewRepairHistory(eq: Equipment) {
    alert(`Showing repair history for ${eq.name} (To be implemented)`);
  }



  // Pagination Logic
  /*public updatePagination() {
    //this.totalPages = Math.ceil(this.apiService.equipmentList().length / this.pageSize) || 1;
    if (this.currentPage() > this.totalPages()) {
      this.currentPage.set(this.totalPages());
    }
    const startIndex = (this.currentPage() - 1) * this.pageSize();
    //this.apiService.equipmentList().slice(startIndex, startIndex + this.pageSize);
  }*/

  public nextPage() {
    this.currentPage.update(p => p + 1);
    this.getEquipment();
  }

  public prevPage() {
    if (this.currentPage() <= 1) {
      return;
    }

    this.currentPage.update(p => p - 1);
    this.getEquipment();
  }

  public goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.getEquipment();
    }
  }

  public isAdmin(): boolean {
    if (this.userApi.currentSession() === null) return false;
    return ['SUPER_ADMIN_PDHS', 'ADMIN_PDHS'].includes(this.userApi.currentSession()?.activeRole.role ?? '')
    //return this.userFacade.hasAnyRole(['SUPER_ADMIN_PDHS', 'ADMIN_PDHS']);
  }

}
