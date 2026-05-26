import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BiomedStateService } from '../../core/services/biomed-state.service';
import {
  ProcurementPlan,
  PurchaseOrder,
  GoodsReceivedNote,
  InventoryItem,
  Supplier,
  User,
  WorkOrder,
  PurchaseOrderItem
} from '../../core/models/biomed.interface';

@Component({
  selector: 'app-procurement',
  imports: [CommonModule, FormsModule],
  templateUrl: './procurement.component.html',
  styleUrl: './procurement.component.css'
})
export class ProcurementComponent implements OnInit {
  public currentUser: User | null = null;
  
  // Lists
  public plans: ProcurementPlan[] = [];
  public purchaseOrders: PurchaseOrder[] = [];
  public grns: GoodsReceivedNote[] = [];
  public inventoryItems: InventoryItem[] = [];
  public suppliers: Supplier[] = [];
  public activeWorkOrders: WorkOrder[] = []; // Used for linking a PO to a repair order

  // Active view tab
  public activeTab: 'store' | 'po' | 'plans' | 'grn' = 'store';

  // Modals
  public showPlanModal = false;
  public showPOModal = false;

  // Plan Form State
  public planDesc = '';
  public planQty = 1;
  public planCost = 0;
  public planMethod: 'Petty Cash' | 'Quotation' | 'Limited Tender' | 'Open Tender' = 'Quotation';

  // PO Form State
  public poSupplierId = '';
  public poLinkedWorkOrderId = '';
  // Items buffer
  public poItemsBuffer: PurchaseOrderItem[] = [];
  public tempItemDesc = '';
  public tempItemQty = 1;
  public tempItemCost = 0;
  public tempItemCat: 'new equipment' | 'spare part' | 'consumable' | 'service' = 'spare part';

  constructor(private stateService: BiomedStateService) {}

  ngOnInit() {
    this.stateService.currentUser$.subscribe(u => {
      this.currentUser = u;
    });

    this.stateService.procurementPlans$.subscribe(list => {
      this.plans = list;
    });

    this.stateService.purchaseOrders$.subscribe(list => {
      this.purchaseOrders = list;
    });

    this.stateService.grns$.subscribe(list => {
      this.grns = list;
    });

    this.stateService.inventoryItems$.subscribe(list => {
      this.inventoryItems = list;
    });

    this.stateService.suppliers$.subscribe(list => {
      this.suppliers = list;
    });

    this.stateService.workOrders$.subscribe(list => {
      this.activeWorkOrders = list.filter(wo => wo.status !== 'Verified & Closed');
    });
  }

  // Plan creation
  public openPlanModal() {
    this.showPlanModal = true;
    this.planDesc = '';
    this.planQty = 1;
    this.planCost = 0;
    this.planMethod = 'Quotation';
  }

  public closePlanModal() {
    this.showPlanModal = false;
  }

  public savePlan() {
    if (!this.planDesc.trim() || this.planCost <= 0) {
      alert('Please fill out plan description and estimated cost.');
      return;
    }
    this.stateService.addProcurementPlan({
      itemDescription: this.planDesc,
      estimatedQuantity: this.planQty,
      estimatedCost: this.planCost,
      procurementMethod: this.planMethod
    });
    this.showPlanModal = false;
  }

  // PO Creation
  public openPOModal() {
    this.showPOModal = true;
    this.poSupplierId = '';
    this.poLinkedWorkOrderId = '';
    this.poItemsBuffer = [];
    this.resetTempItem();
  }

  public closePOModal() {
    this.showPOModal = false;
  }

  private resetTempItem() {
    this.tempItemDesc = '';
    this.tempItemQty = 1;
    this.tempItemCost = 0;
    this.tempItemCat = 'spare part';
  }

  public addItemToPO() {
    if (!this.tempItemDesc.trim() || this.tempItemQty <= 0 || this.tempItemCost <= 0) {
      alert('Please fill out item description, quantity, and unit cost.');
      return;
    }

    this.poItemsBuffer.push({
      description: this.tempItemDesc,
      quantity: this.tempItemQty,
      unitCost: this.tempItemCost,
      category: this.tempItemCat
    });

    this.resetTempItem();
  }

  public removeItemFromPO(idx: number) {
    this.poItemsBuffer.splice(idx, 1);
  }

  public savePO() {
    if (!this.poSupplierId) {
      alert('Please select a supplier.');
      return;
    }
    if (this.poItemsBuffer.length === 0) {
      alert('Please add at least one item to the PO.');
      return;
    }

    const supplier = this.suppliers.find(s => s.id === this.poSupplierId);
    if (!supplier) return;

    const totalCost = this.poItemsBuffer.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0);

    this.stateService.createPurchaseOrder({
      supplierId: this.poSupplierId,
      supplierName: supplier.name,
      totalCost,
      items: this.poItemsBuffer,
      linkedRepairWorkOrderId: this.poLinkedWorkOrderId || undefined
    });

    this.showPOModal = false;
  }

  // PO approvals
  public approvePO(poId: string) {
    this.stateService.updatePOStatus(poId, 'Approved');
  }

  public rejectPO(poId: string) {
    this.stateService.updatePOStatus(poId, 'Rejected');
  }

  // Receive goods (GRN)
  public confirmGRN(poId: string) {
    if (confirm('Verify delivery and record Goods Received Note? This will automatically update the spare parts store inventory and register any new hardware equipment in the PDHS master catalog.')) {
      this.stateService.receiveGoods(poId);
    }
  }

  // Restocking item manually
  public manualRestock(itemId: string) {
    const qtyStr = prompt('Enter quantity to restock:');
    if (qtyStr === null) return;
    const qty = parseInt(qtyStr, 10);
    if (isNaN(qty) || qty <= 0) {
      alert('Invalid quantity.');
      return;
    }
    this.stateService.addInventoryStock(itemId, qty);
  }

  // Permissions helpers
  public isProcurementOfficer(): boolean {
    if (!this.currentUser) return false;
    return this.currentUser.role === 'System Administrator' || this.currentUser.role === 'Procurement Officer';
  }

  public isAdmin(): boolean {
    if (!this.currentUser) return false;
    return this.currentUser.role === 'System Administrator';
  }
}
