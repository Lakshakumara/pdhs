import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import {
  District,
  Institution,
  User,
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
  UserRole,
  WorkOrderStatus,
  RepairPriority
} from '../models/biomed.interface';

@Injectable({
  providedIn: 'root'
})
export class BiomedStateService {
  // Behavior Subjects for Reactivity
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private districtsSubject = new BehaviorSubject<District[]>([]);
  public districts$ = this.districtsSubject.asObservable();

  private institutionsSubject = new BehaviorSubject<Institution[]>([]);
  public institutions$ = this.institutionsSubject.asObservable();

  private usersSubject = new BehaviorSubject<User[]>([]);
  public users$ = this.usersSubject.asObservable();

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

  constructor() {
    this.initDatabase();
  }

  // Database Initialization & Seeding
  private initDatabase() {
    // 1. Districts
    let districts: District[] = this.load('districts');
    if (!districts || districts.length === 0) {
      districts = [
        { id: 'dist_rat', name: 'Rathnapura' },
        { id: 'dist_keg', name: 'Kegalle' }
      ];
      this.save('districts', districts);
    }
    this.districtsSubject.next(districts);

    // 2. Institutions
    let institutions: Institution[] = this.load('institutions');
    if (!institutions || institutions.length === 0) {
      institutions = [
        { id: 'inst_pdhs', name: 'Sabaragamuwa PDHS Office', type: 'PDHS Office', active: true },
        { id: 'inst_rdhs_rat', name: 'Rathnapura RDHS Office', type: 'RDHS Office', districtId: 'dist_rat', active: true },
        { id: 'inst_rdhs_keg', name: 'Kegalle RDHS Office', type: 'RDHS Office', districtId: 'dist_keg', active: true },
        { id: 'inst_bh_rat', name: 'Rathnapura Base Hospital', type: 'Base Hospital', districtId: 'dist_rat', active: true },
        { id: 'inst_bh_keg', name: 'Kegalle Base Hospital', type: 'Base Hospital', districtId: 'dist_keg', active: true },
        { id: 'inst_dh_bal', name: 'Balangoda Divisional Hospital', type: 'Divisional Hospital', districtId: 'dist_rat', active: true },
        { id: 'inst_dh_kar', name: 'Karawanella Divisional Hospital', type: 'Divisional Hospital', districtId: 'dist_keg', active: true },
        { id: 'inst_pmcu_kal', name: 'Kalawana PMCU', type: 'PMCU', districtId: 'dist_rat', active: true },
        { id: 'inst_moh_rat', name: 'MOH Office Rathnapura', type: 'MOH Office', districtId: 'dist_rat', active: true },
        { id: 'inst_clinic_std', name: 'STD Clinic Rathnapura', type: 'STD Clinic', districtId: 'dist_rat', active: true },
        { id: 'inst_rmsd_rat', name: 'RMSD Rathnapura', type: 'Regional Medical Supply Division (RMSD)', districtId: 'dist_rat', active: true }
      ];
      this.save('institutions', institutions);
    }
    this.institutionsSubject.next(institutions);

    // 3. Users
    let users: User[] = this.load('users');
    if (!users || users.length === 0) {
      users = [
        { id: 'usr_admin', username: 'admin', fullName: 'YML Kumara (Admin)', role: 'System Administrator', active: true },
        { id: 'usr_tech1', username: 'tech_nuwan', fullName: 'Nuwan Perera (Technician)', role: 'Biomedical Technician', active: true },
        { id: 'usr_proc1', username: 'proc_sajith', fullName: 'Sajith Bandara (Procurement)', role: 'Procurement Officer', active: true },
        { id: 'usr_viewer', username: 'pdhs_director', fullName: 'Dr. K. Pathirana (PDHS Director)', role: 'PDHS Viewer', active: true },
        { id: 'usr_rdhs_rat', username: 'rdhs_rat', fullName: 'Mrs. D. Wickramasinghe (RDHS Rat)', role: 'RDHS Officer', districtId: 'dist_rat', active: true },
        { id: 'usr_bh_rat', username: 'bh_rat_user', fullName: 'Dr. Saman Silva (Rathnapura BH)', role: 'Institution User', institutionId: 'inst_bh_rat', active: true },
        { id: 'usr_dh_bal', username: 'dh_bal_user', fullName: 'Sister Priyanthi (Balangoda DH)', role: 'Institution User', institutionId: 'inst_dh_bal', active: true }
      ];
      this.save('users', users);
    }
    this.usersSubject.next(users);

    // Set Default Active User to Admin
    const loggedUser = this.load('logged_user') || users[0];
    this.currentUserSubject.next(loggedUser);

    // 4. Suppliers
    let suppliers: Supplier[] = this.load('suppliers');
    if (!suppliers || suppliers.length === 0) {
      suppliers = [
        { id: 'sup_prime', name: 'Prime Diagnostics Ltd', contactName: 'M. Fernando', phone: '+94 11 2345678', email: 'sales@primediag.lk', performanceNotes: 'Excellent support on MRI/CT calibrations.', rating: 5 },
        { id: 'sup_medi', name: 'MediEquipment Pvt Ltd', contactName: 'K. Ratnayake', phone: '+94 11 7654321', email: 'service@mediequip.lk', performanceNotes: 'Prompt delivery of parts, pricing moderate.', rating: 4 },
        { id: 'sup_supplies', name: 'Sabaragamuwa Medical Supplies', contactName: 'R. Perera', phone: '+94 45 2234123', email: 'sabsupplies@gmail.com', performanceNotes: 'Good local supplier for consumables.', rating: 3 }
      ];
      this.save('suppliers', suppliers);
    }
    this.suppliersSubject.next(suppliers);

    // 5. Inventory Items (Spare parts store)
    let inventoryItems: InventoryItem[] = this.load('inventory_items');
    if (!inventoryItems || inventoryItems.length === 0) {
      inventoryItems = [
        { id: 'inv_bat_philips', name: 'Philips Defibrillator Battery M5070A', category: 'spare part', currentStock: 2, minStockThreshold: 3, unitOfMeasure: 'Pcs', costPerUnit: 25000 },
        { id: 'inv_spo2_goldway', name: 'Goldway SpO2 Sensor (Reusable)', category: 'spare part', currentStock: 8, minStockThreshold: 5, unitOfMeasure: 'Pcs', costPerUnit: 12000 },
        { id: 'inv_ecg_leads', name: '3-Lead ECG Patient Cable', category: 'spare part', currentStock: 15, minStockThreshold: 10, unitOfMeasure: 'Pcs', costPerUnit: 6000 },
        { id: 'inv_helium', name: 'Helium Refill Cylinder 50L', category: 'consumable', currentStock: 1, minStockThreshold: 2, unitOfMeasure: 'Cylinder', costPerUnit: 150000 },
        { id: 'inv_nibp_cuff', name: 'Adult NIBP Cuff (Double Tube)', category: 'consumable', currentStock: 10, minStockThreshold: 8, unitOfMeasure: 'Pcs', costPerUnit: 4500 }
      ];
      this.save('inventory_items', inventoryItems);
    }
    this.inventoryItemsSubject.next(inventoryItems);

    // 6. Equipment (Master Inventory)
    let equipment: Equipment[] = this.load('equipment');
    if (!equipment || equipment.length === 0) {
      equipment = [
        {
          id: 'eq_mri_01',
          name: 'Siemens Magnetom Altea 1.5T MRI',
          description: 'High-end diagnostic magnetic resonance imaging scanner.',
          category: 'Radiology',
          manufacturer: 'Siemens Healthineers',
          countryOfOrigin: 'Germany',
          supplierName: 'Prime Diagnostics Ltd',
          tenderNumber: 'TND/2024/MED/089',
          purchaseOrderNumber: 'PO-2024-88392',
          modelNumber: 'Magnetom Altea 1.5T',
          serialNumber: 'SN-MRI-88329-SIE',
          batchNumber: 'BATCH-2024-01',
          quantityReceived: 1,
          dateOfManufacture: '2024-02-15',
          dateOfReceipt: '2024-06-20',
          warrantyPeriodMonths: 60,
          status: 'PDHS Store',
          servicePlan: {
            id: 'sp_mri_01',
            agreementReference: 'SVC-SIE-9902',
            expiryDate: '2029-06-20',
            sparePartDiscountPercent: 20,
            yearlyPricing: {
              1: 500000,
              2: 520000,
              3: 540000,
              4: 560000,
              5: 580000
            }
          },
          components: [
            { id: 'eqc_mri_01_1', name: 'RF Body Coil', description: 'Radiofrequency transmit/receive coil', partNumber: 'RF-B-101', serialNumber: 'COIL-7762', quantity: 1, componentType: 'Serialized', expiryOrWarrantyDate: '2029-06-20' },
            { id: 'eqc_mri_01_2', name: 'Helium Compressor Unit', description: 'Coldhead compressor unit', partNumber: 'HC-COMP-99', serialNumber: 'COMP-11029', quantity: 1, componentType: 'Serialized', expiryOrWarrantyDate: '2029-06-20' },
            { id: 'eqc_mri_01_3', name: 'Console PC Workstation', description: 'Reconstruction and acquisition computer host', partNumber: 'WS-SIE-X8', serialNumber: 'PC-998827', quantity: 1, componentType: 'Serialized', expiryOrWarrantyDate: '2027-06-20' },
            { id: 'eqc_mri_01_4', name: 'MRI Patient Table', description: 'Motorized sliding patient table', partNumber: 'TBL-ALTEA', quantity: 1, componentType: 'Minor/Non-tracked' }
          ]
        },
        {
          id: 'eq_defib_01',
          name: 'Philips HeartStart XL+ Defibrillator',
          description: 'Biphasic defibrillator/monitor with pacing and ECG recording.',
          category: 'Life Support',
          manufacturer: 'Philips Healthcare',
          countryOfOrigin: 'USA',
          supplierName: 'MediEquipment Pvt Ltd',
          tenderNumber: 'TND/2023/MED/102',
          purchaseOrderNumber: 'PO-2023-77402',
          modelNumber: 'HeartStart XL+',
          serialNumber: 'SN-DF-77632-PHI',
          batchNumber: 'B-PHI-2023',
          quantityReceived: 1,
          dateOfManufacture: '2023-01-10',
          dateOfReceipt: '2023-04-15',
          warrantyPeriodMonths: 24,
          status: 'Assigned',
          assignedInstitutionId: 'inst_bh_rat',
          components: [
            { id: 'eqc_defib_1_1', name: 'Rechargeable Li-Ion Battery', description: '14.8V battery pack', partNumber: 'M5070A', serialNumber: 'BATT-99281', quantity: 1, componentType: 'Consumable', expiryOrWarrantyDate: '2025-04-15' },
            { id: 'eqc_defib_1_2', name: 'External Defibrillating Paddles', description: 'Hard paddles set with adult/pediatric sliding contact', partNumber: 'PADDLE-XL', serialNumber: 'PAD-66271', quantity: 1, componentType: 'Serialized', expiryOrWarrantyDate: '2025-04-15' },
            { id: 'eqc_defib_1_3', name: '3-Lead ECG Patient Cable', description: 'ECG connector lead wire set', partNumber: 'ECG-3L', quantity: 1, componentType: 'Minor/Non-tracked' }
          ]
        },
        {
          id: 'eq_monitor_01',
          name: 'Goldway G30E Patient Monitor',
          description: 'Multi-parameter bedside monitor tracking SpO2, NIBP, Pulse, and Temp.',
          category: 'Diagnostic',
          manufacturer: 'Goldway (Philips)',
          countryOfOrigin: 'China',
          supplierName: 'MediEquipment Pvt Ltd',
          tenderNumber: 'TND/2024/MED/012',
          purchaseOrderNumber: 'PO-2024-11029',
          modelNumber: 'G30E',
          serialNumber: 'SN-PM-55419-GW',
          batchNumber: 'B-GW-2024',
          quantityReceived: 1,
          dateOfManufacture: '2024-01-05',
          dateOfReceipt: '2024-03-10',
          warrantyPeriodMonths: 12,
          status: 'Assigned',
          assignedInstitutionId: 'inst_dh_bal',
          components: [
            { id: 'eqc_mon_1_1', name: 'SpO2 Finger Sensor', description: 'Adult reusable silicone clip SpO2 sensor', partNumber: 'SPO2-GW-01', serialNumber: 'SPO2-8819', quantity: 1, componentType: 'Consumable', expiryOrWarrantyDate: '2025-03-10' },
            { id: 'eqc_mon_1_2', name: 'NIBP Cuff Adult', description: 'Reusable blood pressure cuff', partNumber: 'NIBP-GW-A', quantity: 1, componentType: 'Minor/Non-tracked' }
          ]
        },
        {
          id: 'eq_xray_01',
          name: 'Shimadzu RADspeed Fit Digital X-Ray',
          description: 'Ceiling suspension digital radiography system.',
          category: 'Radiology',
          manufacturer: 'Shimadzu Corp',
          countryOfOrigin: 'Japan',
          supplierName: 'Prime Diagnostics Ltd',
          tenderNumber: 'TND/2022/MED/115',
          purchaseOrderNumber: 'PO-2022-44102',
          modelNumber: 'RADspeed Fit',
          serialNumber: 'SN-XR-11928-SHI',
          batchNumber: 'B-SHI-2022',
          quantityReceived: 1,
          dateOfManufacture: '2022-05-18',
          dateOfReceipt: '2022-09-05',
          warrantyPeriodMonths: 36,
          status: 'Assigned',
          assignedInstitutionId: 'inst_bh_keg',
          components: [
            { id: 'eqc_xr_1_1', name: 'X-Ray Tube Assembly', description: 'Rotating anode X-ray source tube', partNumber: 'TUBE-SHI-150', serialNumber: 'TUBE-2291', quantity: 1, componentType: 'Serialized', expiryOrWarrantyDate: '2025-09-05' },
            { id: 'eqc_xr_1_2', name: 'Digital Flat Panel Detector', description: 'Wireless DR flat panel detector image capturer', partNumber: 'FPD-SHI-CX', serialNumber: 'FPD-00392', quantity: 1, componentType: 'Serialized', expiryOrWarrantyDate: '2025-09-05' }
          ]
        }
      ];
      this.save('equipment', equipment);
    }
    this.equipmentSubject.next(equipment);

    // 7. Equipment Assignments
    let assignments: EquipmentAssignment[] = this.load('equipment_assignments');
    if (!assignments || assignments.length === 0) {
      assignments = [
        { id: 'asg_01', equipmentId: 'eq_defib_01', fromEntity: 'PDHS', toEntity: 'RDHS', toEntityId: 'inst_rdhs_rat', quantity: 1, assignmentDate: '2023-04-16', status: 'Delivered' },
        { id: 'asg_02', equipmentId: 'eq_defib_01', fromEntity: 'RDHS', toEntity: 'Institution', toEntityId: 'inst_bh_rat', quantity: 1, assignmentDate: '2023-04-18', status: 'Acknowledged' },
        { id: 'asg_03', equipmentId: 'eq_monitor_01', fromEntity: 'PDHS', toEntity: 'RDHS', toEntityId: 'inst_rdhs_rat', quantity: 1, assignmentDate: '2024-03-12', status: 'Delivered' },
        { id: 'asg_04', equipmentId: 'eq_monitor_01', fromEntity: 'RDHS', toEntity: 'Institution', toEntityId: 'inst_dh_bal', quantity: 1, assignmentDate: '2024-03-15', status: 'Acknowledged' },
        { id: 'asg_05', equipmentId: 'eq_xray_01', fromEntity: 'PDHS', toEntity: 'RDHS', toEntityId: 'inst_rdhs_keg', quantity: 1, assignmentDate: '2022-09-08', status: 'Delivered' },
        { id: 'asg_06', equipmentId: 'eq_xray_01', fromEntity: 'RDHS', toEntity: 'Institution', toEntityId: 'inst_bh_keg', quantity: 1, assignmentDate: '2022-09-10', status: 'Acknowledged' }
      ];
      this.save('equipment_assignments', assignments);
    }
    this.assignmentsSubject.next(assignments);

    // 8. Repair Requests
    let repairRequests: RepairRequest[] = this.load('repair_requests');
    let workOrders: WorkOrder[] = this.load('work_orders');
    if (!repairRequests || repairRequests.length === 0) {
      repairRequests = [
        {
          id: 'REQ-2026-001',
          equipmentId: 'eq_defib_01',
          equipmentName: 'Philips HeartStart XL+ Defibrillator',
          equipmentSerialNumber: 'SN-DF-77632-PHI',
          componentId: 'eqc_defib_1_2',
          componentName: 'External Defibrillating Paddles',
          faultDescription: 'Defibrillator fails to discharge shock. Warning alert on screen points to paddle calibration/connection issue.',
          priority: 'Emergency',
          submittedByUserId: 'usr_bh_rat',
          submittedByUserName: 'Dr. Saman Silva',
          submissionDate: '2026-05-24T10:30:00Z',
          institutionId: 'inst_bh_rat',
          institutionName: 'Rathnapura Base Hospital'
        },
        {
          id: 'REQ-2026-002',
          equipmentId: 'eq_monitor_01',
          equipmentName: 'Goldway G30E Patient Monitor',
          equipmentSerialNumber: 'SN-PM-55419-GW',
          componentId: 'eqc_mon_1_1',
          componentName: 'SpO2 Finger Sensor',
          faultDescription: 'SpO2 sensor cord is frayed. Monitor reads "Sensor Disconnected" constantly.',
          priority: 'Routine',
          submittedByUserId: 'usr_dh_bal',
          submittedByUserName: 'Sister Priyanthi',
          submissionDate: '2026-05-25T14:15:00Z',
          institutionId: 'inst_dh_bal',
          institutionName: 'Balangoda Divisional Hospital'
        }
      ];
      this.save('repair_requests', repairRequests);

      // Create matching work orders
      workOrders = [
        {
          id: 'WO-2026-001',
          repairRequestId: 'REQ-2026-001',
          assignedTechnicianId: 'usr_tech1',
          assignedTechnicianName: 'Nuwan Perera (Technician)',
          diagnosisNotes: 'Diagnostic check indicates internal paddle contacts are worn. The cables have continuity but discharge resistance is too high. Replaced standard wiring assembly.',
          status: 'In Repair',
          statusDate: '2026-05-25T08:00:00Z',
          inspectedComponents: [
            { componentId: 'eqc_defib_1_1', componentName: 'Rechargeable Li-Ion Battery', inspected: true, conditionNotes: 'Healthy, capacity at 92%' },
            { componentId: 'eqc_defib_1_2', componentName: 'External Defibrillating Paddles', inspected: true, conditionNotes: 'Damaged contacts, high resistance' },
            { componentId: 'eqc_defib_1_3', componentName: '3-Lead ECG Patient Cable', inspected: true, conditionNotes: 'Good condition' }
          ],
          partsUsed: []
        },
        {
          id: 'WO-2026-002',
          repairRequestId: 'REQ-2026-002',
          status: 'Submitted',
          statusDate: '2026-05-25T14:15:00Z',
          inspectedComponents: [],
          partsUsed: []
        }
      ];
      this.save('work_orders', workOrders);
    }
    this.repairRequestsSubject.next(repairRequests);
    this.workOrdersSubject.next(workOrders);

    // 9. Procurement Plans
    let procurementPlans: ProcurementPlan[] = this.load('procurement_plans');
    if (!procurementPlans || procurementPlans.length === 0) {
      procurementPlans = [
        { id: 'plan_01', itemDescription: 'Procurement of Life Support Spare Batteries (M5070A)', estimatedQuantity: 5, estimatedCost: 125000, procurementMethod: 'Quotation' },
        { id: 'plan_02', itemDescription: 'Annual Calibration Consumables sab-province', estimatedQuantity: 100, estimatedCost: 350000, procurementMethod: 'Limited Tender' }
      ];
      this.save('procurement_plans', procurementPlans);
    }
    this.procurementPlansSubject.next(procurementPlans);

    // 10. Purchase Orders
    let purchaseOrders: PurchaseOrder[] = this.load('purchase_orders');
    if (!purchaseOrders || purchaseOrders.length === 0) {
      purchaseOrders = [
        {
          id: 'po_01',
          planId: 'plan_01',
          supplierId: 'sup_medi',
          supplierName: 'MediEquipment Pvt Ltd',
          poNumber: 'PO-2026-00049',
          orderDate: '2026-05-10',
          approvalStatus: 'Approved',
          totalCost: 125000,
          items: [
            { description: 'Philips Defibrillator Battery M5070A', quantity: 5, unitCost: 25000, category: 'spare part' }
          ]
        }
      ];
      this.save('purchase_orders', purchaseOrders);
    }
    this.purchaseOrdersSubject.next(purchaseOrders);

    // 11. Goods Received Notes
    let grns: GoodsReceivedNote[] = this.load('grns');
    if (!grns || grns.length === 0) {
      grns = [];
      this.save('grns', grns);
    }
    this.grnsSubject.next(grns);

    // 12. Audit Logs
    let auditLogs: AuditLog[] = this.load('audit_logs');
    if (!auditLogs || auditLogs.length === 0) {
      auditLogs = [
        { id: 'aud_01', timestamp: '2026-05-24T10:30:00Z', userId: 'usr_bh_rat', userName: 'Dr. Saman Silva', userRole: 'Institution User', action: 'CREATE', entityName: 'RepairRequest', recordId: 'REQ-2026-001', description: 'Created repair request REQ-2026-001 for Phillips Defibrillator.' },
        { id: 'aud_02', timestamp: '2026-05-25T08:00:00Z', userId: 'usr_tech1', userName: 'Nuwan Perera', userRole: 'Biomedical Technician', action: 'UPDATE', entityName: 'WorkOrder', recordId: 'WO-2026-001', description: 'Acknowledged work order WO-2026-001 and assigned to self.' }
      ];
      this.save('audit_logs', auditLogs);
    }
    this.auditLogsSubject.next(auditLogs);
  }

  // Local Storage Helpers
  private load(key: string): any {
    const data = localStorage.getItem(`biomed_${key}`);
    return data ? JSON.parse(data) : null;
  }

  private save(key: string, data: any) {
    localStorage.setItem(`biomed_${key}`, JSON.stringify(data));
  }

  // System Audit Logger
  public logAudit(action: 'CREATE' | 'UPDATE' | 'DELETE', entityName: string, recordId: string, description: string) {
    const user = this.currentUserSubject.value;
    const logs: AuditLog[] = this.load('audit_logs') || [];
    const newLog: AuditLog = {
      id: `AUD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      userId: user?.id || 'SYSTEM',
      userName: user?.fullName || 'SYSTEM',
      userRole: user?.role || 'SYSTEM',
      action,
      entityName,
      recordId,
      description
    };
    logs.unshift(newLog);
    this.save('audit_logs', logs);
    this.auditLogsSubject.next(logs);
  }

  // Role Switcher API
  public switchUser(userId: string) {
    const users = this.usersSubject.value;
    const match = users.find(u => u.id === userId);
    if (match) {
      this.currentUserSubject.next(match);
      this.save('logged_user', match);
      this.logAudit('UPDATE', 'UserSession', match.id, `Switched session active user to: ${match.fullName} (${match.role})`);
    }
  }

  // Equipment Master Actions
  public addEquipment(eq: Omit<Equipment, 'id'>) {
    const list = this.equipmentSubject.value;
    const newEq: Equipment = { ...eq, id: `eq_${Date.now()}` };
    list.unshift(newEq);
    this.save('equipment', list);
    this.equipmentSubject.next(list);
    this.logAudit('CREATE', 'Equipment', newEq.id, `Registered new equipment: ${newEq.name} (${newEq.serialNumber})`);
    return newEq;
  }

  public updateEquipment(eq: Equipment) {
    const list = this.equipmentSubject.value;
    const idx = list.findIndex(item => item.id === eq.id);
    if (idx !== -1) {
      list[idx] = eq;
      this.save('equipment', list);
      this.equipmentSubject.next(list);
      this.logAudit('UPDATE', 'Equipment', eq.id, `Updated equipment specs/status for: ${eq.name}`);
    }
  }

  // Equipment Assign Workflow
  public assignEquipment(eqId: string, toInstitutionId: string, toEntity: 'RDHS' | 'Institution', quantity: number) {
    const equipmentList = this.equipmentSubject.value;
    const eq = equipmentList.find(e => e.id === eqId);
    if (!eq) return;

    // Check parent details
    const institutionList = this.institutionsSubject.value;
    const dest = institutionList.find(i => i.id === toInstitutionId);
    if (!dest) return;

    // Create assignment row
    const assignmentsList = this.assignmentsSubject.value;
    const newAsg: EquipmentAssignment = {
      id: `asg_${Date.now()}`,
      equipmentId: eqId,
      fromEntity: eq.status === 'PDHS Store' ? 'PDHS' : 'RDHS',
      toEntity: toEntity,
      toEntityId: toInstitutionId,
      quantity,
      assignmentDate: new Date().toISOString().split('T')[0],
      status: 'Acknowledged' // Automatically set to completed/acknowledged for demo
    };

    assignmentsList.push(newAsg);
    this.save('equipment_assignments', assignmentsList);
    this.assignmentsSubject.next(assignmentsList);

    // Update equipment location
    eq.status = 'Assigned';
    eq.assignedInstitutionId = toInstitutionId;
    this.updateEquipment(eq);

    this.logAudit('CREATE', 'EquipmentAssignment', newAsg.id, `Assigned equipment ${eq.name} to ${dest.name}`);
  }

  // Repair Request Operations
  public submitRepairRequest(eqId: string, componentId: string | undefined, faultDesc: string, priority: RepairPriority) {
    const equipment = this.equipmentSubject.value.find(e => e.id === eqId);
    if (!equipment) throw new Error('Equipment not found');

    const user = this.currentUserSubject.value;
    const institution = this.institutionsSubject.value.find(i => i.id === equipment.assignedInstitutionId);

    const requests = this.repairRequestsSubject.value;
    const newReqId = `REQ-${new Date().getFullYear()}-${String(requests.length + 1).padStart(3, '0')}`;
    
    let componentName: string | undefined = undefined;
    if (componentId) {
      const comp = equipment.components.find(c => c.id === componentId);
      componentName = comp?.name;
    }

    const newReq: RepairRequest = {
      id: newReqId,
      equipmentId: eqId,
      equipmentName: equipment.name,
      equipmentSerialNumber: equipment.serialNumber,
      componentId,
      componentName,
      faultDescription: faultDesc,
      priority,
      submittedByUserId: user?.id || 'usr_bh_rat',
      submittedByUserName: user?.fullName || 'Dr. Saman Silva',
      submissionDate: new Date().toISOString(),
      institutionId: equipment.assignedInstitutionId || 'inst_bh_rat',
      institutionName: institution?.name || 'Local Hospital'
    };

    requests.unshift(newReq);
    this.save('repair_requests', requests);
    this.repairRequestsSubject.next(requests);

    // Auto create empty work order
    const orders = this.workOrdersSubject.value;
    const newWo: WorkOrder = {
      id: `WO-${new Date().getFullYear()}-${String(orders.length + 1).padStart(3, '0')}`,
      repairRequestId: newReqId,
      status: 'Submitted',
      statusDate: new Date().toISOString(),
      inspectedComponents: [],
      partsUsed: []
    };
    orders.unshift(newWo);
    this.save('work_orders', orders);
    this.workOrdersSubject.next(orders);

    this.logAudit('CREATE', 'RepairRequest', newReq.id, `Submitted repair request for ${equipment.name}. Status: Submitted.`);
  }

  // Work Order Workflow
  public updateWorkOrderStatus(woId: string, nextStatus: WorkOrderStatus, payload?: Partial<WorkOrder>) {
    const orders = this.workOrdersSubject.value;
    const idx = orders.findIndex(o => o.id === woId);
    if (idx !== -1) {
      const user = this.currentUserSubject.value;
      const order = orders[idx];
      orders[idx] = {
        ...order,
        ...payload,
        status: nextStatus,
        statusDate: new Date().toISOString(),
        ...(nextStatus === 'Completed' ? { completedDate: new Date().toISOString() } : {}),
        ...(nextStatus === 'Acknowledged' && !order.assignedTechnicianId
          ? {
              assignedTechnicianId: user?.id,
              assignedTechnicianName: user?.fullName
            }
          : {})
      };

      // Handle stock deduction if status is "Completed"
      if (nextStatus === 'Completed' && orders[idx].partsUsed.length > 0) {
        orders[idx].partsUsed.forEach(part => {
          this.deductInventoryStock(part.inventoryItemId, part.quantityUsed);
        });
      }

      this.save('work_orders', orders);
      this.workOrdersSubject.next(orders);
      this.logAudit('UPDATE', 'WorkOrder', woId, `Changed work order status to ${nextStatus}.`);
    }
  }

  // Stock Control
  private deductInventoryStock(itemId: string, qty: number) {
    const list = this.inventoryItemsSubject.value;
    const item = list.find(i => i.id === itemId);
    if (item) {
      item.currentStock = Math.max(0, item.currentStock - qty);
      this.save('inventory_items', list);
      this.inventoryItemsSubject.next(list);
      this.logAudit('UPDATE', 'InventoryItem', itemId, `Deducted ${qty} of ${item.name} due to repair work order consumption.`);
    }
  }

  // Store Management
  public addInventoryStock(itemId: string, qty: number) {
    const list = this.inventoryItemsSubject.value;
    const item = list.find(i => i.id === itemId);
    if (item) {
      item.currentStock += qty;
      this.save('inventory_items', list);
      this.inventoryItemsSubject.next(list);
      this.logAudit('UPDATE', 'InventoryItem', itemId, `Restocked ${qty} items of ${item.name}.`);
    }
  }

  // Procurement Workflow
  public addProcurementPlan(plan: Omit<ProcurementPlan, 'id'>) {
    const list = this.procurementPlansSubject.value;
    const newPlan = { ...plan, id: `plan_${Date.now()}` };
    list.unshift(newPlan);
    this.save('procurement_plans', list);
    this.procurementPlansSubject.next(list);
    this.logAudit('CREATE', 'ProcurementPlan', newPlan.id, `Created annual procurement plan: ${newPlan.itemDescription}`);
  }

  public createPurchaseOrder(po: Omit<PurchaseOrder, 'id' | 'poNumber' | 'approvalStatus' | 'orderDate'>) {
    const list = this.purchaseOrdersSubject.value;
    const poNumber = `PO-2026-${String(list.length + 1).padStart(5, '0')}`;
    const newPo: PurchaseOrder = {
      ...po,
      id: `po_${Date.now()}`,
      poNumber,
      orderDate: new Date().toISOString().split('T')[0],
      approvalStatus: 'Pending'
    };
    list.unshift(newPo);
    this.save('purchase_orders', list);
    this.purchaseOrdersSubject.next(list);
    this.logAudit('CREATE', 'PurchaseOrder', newPo.id, `Generated purchase order: ${newPo.poNumber}`);
  }

  public updatePOStatus(poId: string, status: 'Approved' | 'Rejected') {
    const list = this.purchaseOrdersSubject.value;
    const idx = list.findIndex(p => p.id === poId);
    if (idx !== -1) {
      list[idx].approvalStatus = status;
      this.save('purchase_orders', list);
      this.purchaseOrdersSubject.next(list);
      this.logAudit('UPDATE', 'PurchaseOrder', poId, `Purchase order ${list[idx].poNumber} was ${status.toLowerCase()}.`);
    }
  }

  // Goods Received Note
  public receiveGoods(poId: string) {
    const poList = this.purchaseOrdersSubject.value;
    const po = poList.find(p => p.id === poId);
    if (!po) return;

    // Create GRN
    const grnList = this.grnsSubject.value;
    const grnNumber = `GRN-2026-${String(grnList.length + 1).padStart(5, '0')}`;
    const newGrn: GoodsReceivedNote = {
      id: `grn_${Date.now()}`,
      purchaseOrderId: poId,
      poNumber: po.poNumber,
      grnNumber,
      receivedDate: new Date().toISOString().split('T')[0],
      status: 'Confirmed'
    };
    grnList.unshift(newGrn);
    this.save('grns', grnList);
    this.grnsSubject.next(grnList);

    // Restock store or add new equipment based on PO items!
    po.items.forEach(item => {
      if (item.category === 'spare part' || item.category === 'consumable') {
        // Add to spare parts inventory
        const invList = this.inventoryItemsSubject.value;
        // Try matching by name
        let target = invList.find(i => i.name.toLowerCase().includes(item.description.toLowerCase()) || item.description.toLowerCase().includes(i.name.toLowerCase()));
        if (target) {
          this.addInventoryStock(target.id, item.quantity);
        } else {
          // Create new inventory item record
          const newItem: InventoryItem = {
            id: `inv_${Date.now()}_${Math.floor(Math.random() * 100)}`,
            name: item.description,
            category: item.category,
            currentStock: item.quantity,
            minStockThreshold: 2,
            unitOfMeasure: 'Pcs',
            costPerUnit: item.unitCost
          };
          invList.unshift(newItem);
          this.save('inventory_items', invList);
          this.inventoryItemsSubject.next(invList);
          this.logAudit('CREATE', 'InventoryItem', newItem.id, `Created new inventory item catalog from GRN: ${newItem.name}`);
        }
      } else if (item.category === 'new equipment') {
        // Create new master equipment record in PDHS store
        for (let i = 0; i < item.quantity; i++) {
          this.addEquipment({
            name: item.description,
            description: `Procured under PO ${po.poNumber}`,
            category: 'General Medical',
            manufacturer: 'Global Health Corp',
            countryOfOrigin: 'Sri Lanka',
            supplierName: po.supplierName,
            tenderNumber: 'TND-LOCAL-PO',
            purchaseOrderNumber: po.poNumber,
            modelNumber: 'Model-Gen',
            serialNumber: `SN-${Date.now()}-${i}-${Math.floor(Math.random() * 100)}`,
            batchNumber: 'BATCH-AUTO',
            quantityReceived: 1,
            dateOfManufacture: new Date().toISOString().split('T')[0],
            dateOfReceipt: new Date().toISOString().split('T')[0],
            warrantyPeriodMonths: 12,
            components: [
              { id: `eqc_auto_${Date.now()}_${i}`, name: 'Standard Battery Pack', description: 'Internal secondary power unit', partNumber: 'BAT-ST-01', quantity: 1, componentType: 'Consumable' }
            ],
            status: 'PDHS Store'
          });
        }
      }
    });

    this.logAudit('CREATE', 'GoodsReceivedNote', newGrn.id, `Goods Received Note confirmed for PO: ${po.poNumber}. Stock automatically updated.`);
  }
}
