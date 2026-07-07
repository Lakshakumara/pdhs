import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, tap, catchError } from 'rxjs';
import { Equipment, EquipmentAssignment, EscalateToVendorDto, RepairPriority, RepairRequest, Supplier, VendorCompletedDto, WorkOrder, WorkOrderStatus } from '../models/biomed.interface';
import { NotificationService } from './notification.service';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class UpsertService {
  
  private baseUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private notify: NotificationService) { }

    escalateToVendor(workOrderId: string, dto: EscalateToVendorDto) {
  return this.http.post<WorkOrder>(
    `${this.baseUrl}/work-orders/${workOrderId}/escalate-vendor`,
    dto
  );
}
 
markVendorCompleted(workOrderId: string, dto: VendorCompletedDto) {
  return this.http.post<WorkOrder>(
    `${this.baseUrl}/work-orders/${workOrderId}/vendor-completed`,
    dto
  );
}

  public upsertEquipment(eq: Omit<Equipment, 'id'>): Observable<Equipment> {
    console.log('add equipment ', eq)
    return this.http.post<Equipment>(`${this.baseUrl}/equipment/add`, eq)
      .pipe(
        tap(newEquipment => {
          // Optimistically update the list? We'll refetch for simpli
          this.logAudit('CREATE', 'Equipment', newEquipment.id, `Registered new equipment: ${newEquipment.name} (${newEquipment.serialNumber})`);
        })
      );
  }

  public updateEquipment(eq: Equipment): Observable<Equipment> {
    console.log('update equipment ', eq)
    return this.http.put<Equipment>(`${this.baseUrl}/equipment/update/${eq.id}`, eq)
      .pipe(
        tap(updatedEquipment => {
          this.logAudit('UPDATE', 'Equipment', updatedEquipment.id, `Updated equipment specs/status for: ${updatedEquipment.name}`);

        }));
  }

  // Equipment Assign Workflow
  public assignEquipment(eqId: string, toInstitutionId: string, toEntity: 'RDHS' | 'Institution', quantity: number, destName: string): Observable<EquipmentAssignment> {
    const body = { toInstitutionId, toEntity, quantity };
    return this.http.post<EquipmentAssignment>(`${this.baseUrl}/equipment/${eqId}/assign`, body).pipe(
      tap(assignment => {

        this.logAudit('CREATE', 'EquipmentAssignment', assignment.id, `Assigned equipment to ${destName}`);
      }),
    );
  }

  // Repair Request Operations
  public submitRepairRequest(eqId: string, componentId: string | undefined,
    faultDescription: string, priority: RepairPriority, submittedByUserId: string
  ): Observable<{ repairRequest: RepairRequest; workOrder: WorkOrder }> {
    
    const body = { equipmentId: eqId, componentId, faultDescription, priority, submittedByUserId };
    console.log('sent body', body)
    return this.http.post<{ repairRequest: RepairRequest; workOrder: WorkOrder }>
      (`${this.baseUrl}/repair-requests`, body).pipe(
        tap(result => {
          this.logAudit('CREATE', 'RepairRequest', result.repairRequest.id, `Submitted repair request for ${result.repairRequest.equipmentName}. Status: Submitted.`);
        })
      );
  }

  public updateWorkOrderStatus(woId: string, nextStatus: WorkOrderStatus, payload?: Partial<WorkOrder>): Observable<WorkOrder> {
    const body = { status: nextStatus, payload };
    return this.http.put<WorkOrder>(`${this.baseUrl}/work-orders/${woId}/status`, body).pipe(
      tap(updatedWorkOrder => {
        this.logAudit('UPDATE', 'WorkOrder', woId, `Changed work order status to ${nextStatus}.`);
      })
    );
  }

   updateSupplier(supplierid: string, payload: any) {
      alert('Method not implemented.');
      return this.http.put<{ repairRequest: RepairRequest; workOrder: WorkOrder }>
      (`${this.baseUrl}/supplier/${supplierid}/edit`, payload)
      .pipe(
        tap(result => {
          this.logAudit('CREATE', 'Supplier', result.repairRequest.id, `Submitted repair request for ${result.repairRequest.equipmentName}. Status: Submitted.`);
        })
      );
  }
  createSupplier(payload: any){
      alert('Method not implemented.');
      return this.http.post<{ supplier:Supplier }>(`${this.baseUrl}/supplier/add`, payload).pipe(
        tap(result => {
          this.logAudit('CREATE', 'Supplier', result.supplier.id, 
            ``);
        })
      );
  }


  public logAudit(action: 'CREATE' | 'UPDATE' | 'DELETE', entityName: string, recordId: string, description: string): void {
    // In a real app, you might send this to the backend via an endpoint.
    // For now, we'll just log to console and not update the auditLogsSubject directly.
    console.log('Audit Log:', { action, entityName, recordId, description });
    // Optionally, you could refetch audit logs after a delay to get the latest from backend.
    // setTimeout(() => this.fetchAuditLogs(), 1000);
  }
}
