import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, tap, catchError } from 'rxjs';
import { Equipment, EquipmentAssignment } from '../models/biomed.interface';
import { NotificationService } from './notification.service';

@Injectable({
  providedIn: 'root',
})
export class UpsertService {
  private baseUrl = 'http://localhost:3000/api';

  constructor(
    private http: HttpClient,
    private notify: NotificationService) { }

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
  public logAudit(action: 'CREATE' | 'UPDATE' | 'DELETE', entityName: string, recordId: string, description: string): void {
    // In a real app, you might send this to the backend via an endpoint.
    // For now, we'll just log to console and not update the auditLogsSubject directly.
    console.log('Audit Log:', { action, entityName, recordId, description });
    // Optionally, you could refetch audit logs after a delay to get the latest from backend.
    // setTimeout(() => this.fetchAuditLogs(), 1000);
  }
}
