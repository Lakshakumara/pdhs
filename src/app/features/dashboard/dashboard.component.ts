import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BiomedStateService } from '../../core/services/biomed-state.service';
import {
  Equipment,
  RepairRequest,
  WorkOrder,
  InventoryItem,
  User,
  Institution
} from '../../core/models/biomed.interface';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  public currentUser: User | null = null;
  public institutions: Institution[] = [];
  
  // Master lists
  public allEquipment: Equipment[] = [];
  public allRequests: RepairRequest[] = [];
  public allOrders: WorkOrder[] = [];
  public allInventory: InventoryItem[] = [];

  // Filtered/Computed Metrics
  public totalAssets = 0;
  public activeRepairs = 0;
  public pendingRequests = 0;
  public lowStockAlerts = 0;
  public totalProcurementSpend = 0;

  // Visual widgets lists
  public urgentRepairs: RepairRequest[] = [];
  public lowStockItems: InventoryItem[] = [];
  public categoryDistribution: { category: string; count: number; percent: number }[] = [];

  constructor(private stateService: BiomedStateService) {}

  ngOnInit() {
    this.stateService.currentUser$.subscribe(u => {
      this.currentUser = u;
      this.calculateMetrics();
    });

    this.stateService.institutions$.subscribe(list => {
      this.institutions = list;
    });

    this.stateService.equipment$.subscribe(list => {
      this.allEquipment = list;
      this.calculateMetrics();
    });

    this.stateService.repairRequests$.subscribe(list => {
      this.allRequests = list;
      this.calculateMetrics();
    });

    this.stateService.workOrders$.subscribe(list => {
      this.allOrders = list;
      this.calculateMetrics();
    });

    this.stateService.inventoryItems$.subscribe(list => {
      this.allInventory = list;
      this.calculateMetrics();
    });

    this.stateService.purchaseOrders$.subscribe(list => {
      // Calculate procurement spend
      const approvedPOs = list.filter(po => po.approvalStatus === 'Approved');
      this.totalProcurementSpend = approvedPOs.reduce((sum, po) => sum + po.totalCost, 0);
    });
  }

  private calculateMetrics() {
    if (!this.currentUser) return;

    const role = this.currentUser.role;
    let filteredEquipment = [...this.allEquipment];
    let filteredRequests = [...this.allRequests];

    // Filter data based on user context
    if (role === 'RDHS Officer' && this.currentUser.districtId) {
      // Filter by district institutions
      const districtInstIds = this.institutions
        .filter(i => i.districtId === this.currentUser?.districtId)
        .map(i => i.id);

      filteredEquipment = this.allEquipment.filter(e => e.assignedInstitutionId && districtInstIds.includes(e.assignedInstitutionId));
      filteredRequests = this.allRequests.filter(r => districtInstIds.includes(r.institutionId));
    } else if (role === 'Institution User' && this.currentUser.institutionId) {
      // Filter by single institution
      filteredEquipment = this.allEquipment.filter(e => e.assignedInstitutionId === this.currentUser?.institutionId);
      filteredRequests = this.allRequests.filter(r => r.institutionId === this.currentUser?.institutionId);
    }

    // Set counts
    this.totalAssets = filteredEquipment.length;

    // Filter requests
    const filteredReqIds = filteredRequests.map(r => r.id);
    const relatedOrders = this.allOrders.filter(o => filteredReqIds.includes(o.repairRequestId));
    
    // Active repairs = requests that have a work order NOT 'Verified & Closed'
    this.activeRepairs = relatedOrders.filter(o => o.status !== 'Verified & Closed').length;
    
    // Pending requests = work orders with status 'Submitted'
    this.pendingRequests = relatedOrders.filter(o => o.status === 'Submitted').length;

    // Low stock alerts
    this.lowStockItems = this.allInventory.filter(i => i.currentStock <= i.minStockThreshold);
    this.lowStockAlerts = this.lowStockItems.length;

    // Critical urgent/emergency repairs list
    this.urgentRepairs = filteredRequests
      .filter(r => {
        const order = this.allOrders.find(o => o.repairRequestId === r.id);
        return (r.priority === 'Emergency' || r.priority === 'Urgent') && order?.status !== 'Verified & Closed';
      })
      .slice(0, 5); // Limit to top 5

    // Category Distribution
    const cats: { [key: string]: number } = {};
    filteredEquipment.forEach(eq => {
      cats[eq.category] = (cats[eq.category] || 0) + 1;
    });

    const total = filteredEquipment.length || 1;
    this.categoryDistribution = Object.keys(cats).map(catName => ({
      category: catName,
      count: cats[catName],
      percent: Math.round((cats[catName] / total) * 100)
    })).sort((a, b) => b.count - a.count);
  }

  // Get name of institution from ID
  public getInstitutionName(id?: string): string {
    if (!id) return 'Unassigned';
    return this.institutions.find(i => i.id === id)?.name || id;
  }
}
