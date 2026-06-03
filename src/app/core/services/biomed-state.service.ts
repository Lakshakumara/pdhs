import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import {
  District,
  Institution,
  Equipment,
  EquipmentComponent,
  EquipmentAssignment,
  RepairRequest,
  WorkOrder,
  Supplier,
  ProcurementPlan,
  PurchaseOrder,
  GoodsReceivedNote,
  InventoryItem,
  AuditLog,
  WorkOrderStatus,
  RepairPriority,
  UserDto
} from '../models/biomed.interface';

@Injectable({
  providedIn: 'root'
})
export class BiomedStateService {
  private baseUrl = 'http://localhost:3000/biomedical-state'; // Adjust if needed, or use environment variable

  private currentUserDtoSubject = new BehaviorSubject<UserDto | null>(null);
  public currentUserDto$ = this.currentUserDtoSubject.asObservable();

  private usersSubject = new BehaviorSubject<UserDto[]>([]);
  public usersDto$ = this.usersSubject.asObservable();

  private districtsSubject = new BehaviorSubject<District[]>([]);
  public districts$ = this.districtsSubject.asObservable();

  private institutionsSubject = new BehaviorSubject<Institution[]>([]);
  public institutions$ = this.institutionsSubject.asObservable();

  public equipmentSubject = new BehaviorSubject<Equipment[]>([]);
  public equipment$ = this.equipmentSubject.asObservable();

  private assignmentsSubject = new BehaviorSubject<EquipmentAssignment[]>([]);
  public assignments$ = this.assignmentsSubject.asObservable();

  private repairRequestsSubject = new BehaviorSubject<RepairRequest[]>([]);
  public repairRequests$ = this.repairRequestsSubject.asObservable();

  private workOrdersSubject = new BehaviorSubject<WorkOrder[]>([]);
  public workOrders$ = this.workOrdersSubject.asObservable();

  private suppliersSubject = new BehaviorSubject<Supplier[]>([]);
  public suppliers$ = this.suppliersSubject.asObservable();

  private procurementPlansSubject = new BehaviorSubject<ProcurementPlan[]>([]);
  public procurementPlans$ = this.procurementPlansSubject.asObservable();

  private purchaseOrdersSubject = new BehaviorSubject<PurchaseOrder[]>([]);
  public purchaseOrders$ = this.purchaseOrdersSubject.asObservable();

  private grnsSubject = new BehaviorSubject<GoodsReceivedNote[]>([]);
  public grns$ = this.grnsSubject.asObservable();

  private inventoryItemsSubject = new BehaviorSubject<InventoryItem[]>([]);
  public inventoryItems$ = this.inventoryItemsSubject.asObservable();

  private auditLogsSubject = new BehaviorSubject<AuditLog[]>([]);
  public auditLogs$ = this.auditLogsSubject.asObservable();

  constructor(private http: HttpClient) {
    this.initData();
  }

  private initData(): void {
    this.fetchDistricts();
    this.fetchInstitutions();
    this.fetchUsers();
    this.fetchEquipment();
    this.fetchAssignments();
    this.fetchRepairRequests();
    this.fetchWorkOrders();
    this.fetchSuppliers();
    this.fetchInventoryItems();
    this.fetchProcurementPlans();
    this.fetchPurchaseOrders();
    this.fetchGrns();
    this.fetchAuditLogs();
    // Set default active user from fetched users or null
    this.usersSubject.subscribe(users => {
      if (users.length > 0) {
        this.currentUserDtoSubject.next(users[0]);
      }
    });
  }

  private handleError(error: any) {
    console.error('An error occurred:', error);
    return throwError(() => new Error(error.message || error));
  }

  // Districts
  private fetchDistricts(): void {
    this.http.get<District[]>(`${this.baseUrl}/districts`)
      .pipe(catchError(this.handleError))
      .subscribe(districts => this.districtsSubject.next(districts));
  }

  // Institutions
  private fetchInstitutions(): void {
    this.http.get<Institution[]>(`${this.baseUrl}/institutions`)
      .pipe(catchError(this.handleError))
      .subscribe(institutions => this.institutionsSubject.next(institutions));
  }

  // Users
  private fetchUsers(): void {
    this.http.get<UserDto[]>(`${this.baseUrl}/users`)
      .pipe(catchError(this.handleError))
      .subscribe(users => this.usersSubject.next(users));
  }

  // Equipment
  private fetchEquipment(): void {
    this.http.get<Equipment[]>(`${this.baseUrl}/equipment`)
      .pipe(catchError(this.handleError))
      .subscribe(equipment => this.equipmentSubject.next(equipment));
  }

  // Assignments
  private fetchAssignments(): void {
    this.http.get<EquipmentAssignment[]>(`${this.baseUrl}/assignments`)
      .pipe(catchError(this.handleError))
      .subscribe(assignments => this.assignmentsSubject.next(assignments));
  }

  // Repair Requests
  private fetchRepairRequests(): void {
    this.http.get<RepairRequest[]>(`${this.baseUrl}/repair-requests`)
      .pipe(catchError(this.handleError))
      .subscribe(repairRequests => this.repairRequestsSubject.next(repairRequests));
  }

  // Work Orders
  private fetchWorkOrders(): void {
    this.http.get<WorkOrder[]>(`${this.baseUrl}/work-orders`)
      .pipe(catchError(this.handleError))
      .subscribe(workOrders => this.workOrdersSubject.next(workOrders));
  }

  // Suppliers
  private fetchSuppliers(): void {
    this.http.get<Supplier[]>(`${this.baseUrl}/suppliers`)
      .pipe(catchError(this.handleError))
      .subscribe(suppliers => this.suppliersSubject.next(suppliers));
  }

  // Inventory Items
  private fetchInventoryItems(): void {
    this.http.get<InventoryItem[]>(`${this.baseUrl}/inventory-items`)
      .pipe(catchError(this.handleError))
      .subscribe(inventoryItems => this.inventoryItemsSubject.next(inventoryItems));
  }

  // Procurement Plans
  private fetchProcurementPlans(): void {
    this.http.get<ProcurementPlan[]>(`${this.baseUrl}/procurement-plans`)
      .pipe(catchError(this.handleError))
      .subscribe(procurementPlans => this.procurementPlansSubject.next(procurementPlans));
  }

  // Purchase Orders
  private fetchPurchaseOrders(): void {
    this.http.get<PurchaseOrder[]>(`${this.baseUrl}/purchase-orders`)
      .pipe(catchError(this.handleError))
      .subscribe(purchaseOrders => this.purchaseOrdersSubject.next(purchaseOrders));
  }

  // GRNs
  private fetchGrns(): void {
    this.http.get<GoodsReceivedNote[]>(`${this.baseUrl}/grns`)
      .pipe(catchError(this.handleError))
      .subscribe(grns => this.grnsSubject.next(grns));
  }

  // Audit Logs
  private fetchAuditLogs(): void {
    this.http.get<AuditLog[]>(`${this.baseUrl}/audit-logs`)
      .pipe(catchError(this.handleError))
      .subscribe(auditLogs => this.auditLogsSubject.next(auditLogs));
  }

  // System Audit Logger (simplified - just logs to console for now, backend handles audit)
  public logAudit(action: 'CREATE' | 'UPDATE' | 'DELETE', entityName: string, recordId: string, description: string): void {
    // In a real app, you might send this to the backend via an endpoint.
    // For now, we'll just log to console and not update the auditLogsSubject directly.
    console.log('Audit Log:', { action, entityName, recordId, description });
    // Optionally, you could refetch audit logs after a delay to get the latest from backend.
    // setTimeout(() => this.fetchAuditLogs(), 1000);
  }

  // Equipment Master Actions
  public addEquipment(eq: Omit<Equipment, 'id'>): Observable<Equipment> {
    return this.http.post<Equipment>(`${this.baseUrl}/equipment`, eq).pipe(
      tap(newEquipment => {
        // Optimistically update the list? We'll refetch for simplicity.
        this.fetchEquipment();
        this.logAudit('CREATE', 'Equipment', newEquipment.id, `Registered new equipment: ${newEquipment.name} (${newEquipment.serialNumber})`);
      }),
      catchError(this.handleError)
    );
  }

  public updateEquipment(eq: Equipment): Observable<Equipment> {
    return this.http.put<Equipment>(`${this.baseUrl}/equipment/${eq.id}`, eq).pipe(
      tap(updatedEquipment => {
        this.fetchEquipment();
        this.logAudit('UPDATE', 'Equipment', updatedEquipment.id, `Updated equipment specs/status for: ${updatedEquipment.name}`);
      }),
      catchError(this.handleError)
    );
  }

  // Equipment Assign Workflow
  public assignEquipment(eqId: string, toInstitutionId: string, toEntity: 'RDHS' | 'Institution', quantity: number): Observable<EquipmentAssignment> {
    const body = { toInstitutionId, toEntity, quantity };
    return this.http.post<EquipmentAssignment>(`${this.baseUrl}/equipment/${eqId}/assign`, body).pipe(
      tap(assignment => {
        this.fetchEquipment();
        this.fetchAssignments();
        // Get institution name for log
        const institutions = this.institutionsSubject.value;
        const dest = institutions.find(i => i.id === toInstitutionId);
        const destName = dest ? dest.name : 'Unknown';
        this.logAudit('CREATE', 'EquipmentAssignment', assignment.id, `Assigned equipment to ${destName}`);
      }),
      catchError(this.handleError)
    );
  }

  // Repair Request Operations
  public submitRepairRequest(eqId: string, componentId: string | undefined, faultDescription: string, priority: RepairPriority): Observable<{ repairRequest: RepairRequest; workOrder: WorkOrder }> {
    const body = { equipmentId: eqId, componentId, faultDescription, priority };
    return this.http.post<{ repairRequest: RepairRequest; workOrder: WorkOrder }>(`${this.baseUrl}/repair-requests`, body).pipe(
      tap(result => {
        this.fetchRepairRequests();
        this.fetchWorkOrders();
        this.fetchEquipment(); // in case status changed
        this.logAudit('CREATE', 'RepairRequest', result.repairRequest.id, `Submitted repair request for ${result.repairRequest.equipmentName}. Status: Submitted.`);
      }),
      catchError(this.handleError)
    );
  }

  // Work Order Workflow
  public updateWorkOrderStatus(woId: string, nextStatus: WorkOrderStatus, payload?: Partial<WorkOrder>): Observable<WorkOrder> {
    const body = { status: nextStatus, payload };
    return this.http.put<WorkOrder>(`${this.baseUrl}/work-orders/${woId}/status`, body).pipe(
      tap(updatedWorkOrder => {
        this.fetchWorkOrders();
        // If completed, we might need to fetch inventory if parts were used
        if (nextStatus === 'Completed') {
          this.fetchInventoryItems();
        }
        this.logAudit('UPDATE', 'WorkOrder', woId, `Changed work order status to ${nextStatus}.`);
      }),
      catchError(this.handleError)
    );
  }

  // Stock Control
  public deductInventoryStock(itemId: string, qty: number): void {
    // This is now handled by the backend when work order is completed.
    // We might still want to optimistically update the inventory subject.
    const items = this.inventoryItemsSubject.value;
    const item = items.find(i => i.id === itemId);
    if (item) {
      item.currentStock = Math.max(0, item.currentStock - qty);
      this.inventoryItemsSubject.next(items);
      this.logAudit('UPDATE', 'InventoryItem', itemId, `Deducted ${qty} of ${item.name} due to repair work order consumption.`);
    }
    // Also call backend to persist? Actually, backend does it on work order completion.
    // We could call an endpoint to deduct stock, but let's assume backend handles it via work order completion.
    // For now, we'll just update optimistically and let the backend correction happen via fetchInventoryItems on work order completion.
  }

  // Store Management
  public addInventoryStock(itemId: string, qty: number): Observable<InventoryItem> {
    return this.http.post<InventoryItem>(`${this.baseUrl}/inventory-items/${itemId}/stock`, { quantity: qty }).pipe(
      tap(updatedItem => {
        this.fetchInventoryItems();
        this.logAudit('UPDATE', 'InventoryItem', updatedItem.id, `Restocked ${qty} items of ${updatedItem.name}.`);
      }),
      catchError(this.handleError)
    );
  }

  // Procurement Workflow
  public addProcurementPlan(plan: Omit<ProcurementPlan, 'id'>): Observable<ProcurementPlan> {
    return this.http.post<ProcurementPlan>(`${this.baseUrl}/procurement-plans`, plan).pipe(
      tap(newPlan => {
        this.fetchProcurementPlans();
        this.logAudit('CREATE', 'ProcurementPlan', newPlan.id, `Created annual procurement plan: ${newPlan.itemDescription}`);
      }),
      catchError(this.handleError)
    );
  }

  public createPurchaseOrder(po: Omit<PurchaseOrder, 'id' | 'poNumber' | 'approvalStatus' | 'orderDate'>): Observable<PurchaseOrder> {
    return this.http.post<PurchaseOrder>(`${this.baseUrl}/purchase-orders`, po).pipe(
      tap(newPo => {
        this.fetchPurchaseOrders();
        this.logAudit('CREATE', 'PurchaseOrder', newPo.id, `Generated purchase order: ${newPo.poNumber}`);
      }),
      catchError(this.handleError)
    );
  }

  public updatePOStatus(poId: string, status: 'Approved' | 'Rejected'): Observable<PurchaseOrder> {
    return this.http.put<PurchaseOrder>(`${this.baseUrl}/purchase-orders/${poId}/status`, { status }).pipe(
      tap(updatedPo => {
        this.fetchPurchaseOrders();
        this.fetchGrns();
        if (status === 'Approved') {
          // When PO is approved, backend creates GRN and updates inventory/equipment
          this.fetchInventoryItems();
          this.fetchEquipment();
        }
        this.logAudit('UPDATE', 'PurchaseOrder', poId, `Purchase order ${updatedPo.poNumber} was ${status.toLowerCase()}.`);
      }),
      catchError(this.handleError)
    );
  }

  // Goods Received Note
  public receiveGoods(poId: string): Observable<GoodsReceivedNote> {
    return this.http.post<GoodsReceivedNote>(`${this.baseUrl}/purchase-orders/${poId}/receive`, {}).pipe(
      tap(grn => {
        this.fetchGrns();
        this.fetchInventoryItems();
        this.fetchEquipment();
        this.logAudit('CREATE', 'GoodsReceivedNote', grn.id, `Goods Received Note confirmed for PO: ${grn.poNumber}. Stock automatically updated.`);
      }),
      catchError(this.handleError)
    );
  }


  // Institutions CRUD
  public addInstitution(institution: Omit<Institution, 'id'>): Observable<Institution> {
    return this.http.post<Institution>(`${this.baseUrl}/institutions`, institution).pipe(
      tap(newInst => {
        this.fetchInstitutions(); // refetch list
        this.logAudit('CREATE', 'Institution', newInst.id, `Added new institution: ${newInst.name}`);
      }),
      catchError(this.handleError)
    );
  }

  public updateInstitution(institution: Institution): Observable<Institution> {
    return this.http.put<Institution>(`${this.baseUrl}/institutions/${institution.id}`, institution).pipe(
      tap(updatedInst => {
        this.fetchInstitutions();
        this.logAudit('UPDATE', 'Institution', updatedInst.id, `Updated institution: ${updatedInst.name}`);
      }),
      catchError(this.handleError)
    );
  }

  public deleteInstitution(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/institutions/${id}`).pipe(
      tap(() => {
        this.fetchInstitutions();
        this.logAudit('DELETE', 'Institution', id, `Deleted institution with id: ${id}`);
      }),
      catchError(this.handleError)
    );
  }
}