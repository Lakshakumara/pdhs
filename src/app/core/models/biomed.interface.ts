export interface District {
  id: string;
  name: string;
}

export type InstitutionType =
  | 'PDHS Office'
  | 'RDHS Office'
  | 'Base Hospital'
  | 'Divisional Hospital'
  | 'PMCU'
  | 'MOH Office'
  | 'STD Clinic'
  | 'Chest Clinic'
  | 'Regional Malaria Office (RMO)'
  | 'Regional Medical Supply Division (RMSD)'
  | 'Training Centre'
  | 'Others';

export interface Institution {
  id: string;
  name: string;
  type: InstitutionType;
  districtId?: string; // Optional (PDHS Office has no district)
  active: boolean;
}

export type UserRole =
  | 'System Administrator'
  | 'Biomedical Technician'
  | 'Procurement Officer'
  | 'PDHS Viewer'
  | 'RDHS Officer'
  | 'Institution User';

export interface User {
  id: string;
  username: string;
  fullName: string;
  role: UserRole;
  districtId?: string; // Standard for RDHS Officer
  institutionId?: string; // Standard for Institution User
  active: boolean;
}

export type EquipmentCategory =
  | 'Diagnostic'
  | 'Therapeutic'
  | 'Life Support'
  | 'Laboratory'
  | 'Radiology'
  | 'General Medical'
  | 'Other';

export interface ServicePlan {
  id: string;
  agreementReference: string;
  expiryDate: string;
  sparePartDiscountPercent: number;
  yearlyPricing: { [year: number]: number }; // Year 1 to Year 5 prices
}

export interface EquipmentComponent {
  id: string;
  name: string;
  description: string;
  partNumber: string;
  serialNumber?: string;
  quantity: number;
  componentType: 'Serialized' | 'Consumable' | 'Minor/Non-tracked';
  expiryOrWarrantyDate?: string;
}

export interface Equipment {
  id: string;
  name: string;
  description: string;
  category: EquipmentCategory;
  manufacturer: string;
  countryOfOrigin: string;
  supplierName: string;
  tenderNumber: string;
  purchaseOrderNumber: string;
  modelNumber: string;
  serialNumber: string;
  batchNumber: string;
  quantityReceived: number;
  dateOfManufacture: string | null;
  dateOfReceipt: string | null;
  expiryDate?: string | null;
  warrantyPeriodMonths: number;
  servicePlan?: ServicePlan;
  components: EquipmentComponent[];
  // Location Tracking
  assignedInstitutionId?: string;
  status: 'PDHS Store' | 'In Transit' | 'Assigned';
}

export interface EquipmentAssignment {
  id: string;
  equipmentId: string;
  fromEntity: 'PDHS' | 'RDHS';
  toEntity: 'RDHS' | 'Institution';
  toEntityId: string;
  quantity: number;
  assignmentDate: string;
  status: 'In Transit' | 'Delivered' | 'Acknowledged';
}

export type RepairPriority = 'Routine' | 'Urgent' | 'Emergency';
export type WorkOrderStatus =
  | 'Submitted'
  | 'Acknowledged'
  | 'Diagnosed'
  | 'In Repair'
  | 'Completed'
  | 'Verified & Closed';

export interface RepairRequest {
  id: string;
  equipmentId: string;
  equipmentName: string;
  equipmentSerialNumber: string;
  componentId?: string; // Optional if fault is on sub-component
  componentName?: string;
  faultDescription: string;
  priority: RepairPriority;
  photoUrl?: string;
  submittedByUserId: string;
  submittedByUserName: string;
  submissionDate: string;
  institutionId: string;
  institutionName: string;
}

export interface WorkOrder {
  id: string;
  repairRequestId: string;
  assignedTechnicianId?: string;
  assignedTechnicianName?: string;
  diagnosisNotes?: string;
  resolutionDetails?: string;
  status: WorkOrderStatus;
  statusDate: string;
  completedDate?: string;
  inspectedComponents: {
    componentId: string;
    componentName: string;
    inspected: boolean;
    conditionNotes: string;
  }[];
  partsUsed: {
    inventoryItemId: string;
    partName: string;
    quantityUsed: number;
    unitCost: number;
  }[];
}

export interface Supplier {
  id: string;
  name: string;
  contactName: string;
  phone: string;
  email: string;
  performanceNotes: string;
  rating: number; // 1-5 stars
}

export interface ProcurementPlan {
  id: string;
  itemDescription: string;
  estimatedQuantity: number;
  estimatedCost: number;
  procurementMethod: 'Petty Cash' | 'Quotation' | 'Limited Tender' | 'Open Tender';
}

export interface PurchaseOrderItem {
  description: string;
  quantity: number;
  unitCost: number;
  category: 'new equipment' | 'spare part' | 'consumable' | 'service';
}

export interface PurchaseOrder {
  id: string;
  planId?: string;
  supplierId: string;
  supplierName: string;
  poNumber: string;
  orderDate: string;
  approvalStatus: 'Pending' | 'Approved' | 'Rejected';
  totalCost: number;
  items: PurchaseOrderItem[];
  linkedRepairWorkOrderId?: string; // For parts traceability
}

export interface GoodsReceivedNote {
  id: string;
  purchaseOrderId: string;
  poNumber: string;
  grnNumber: string;
  receivedDate: string;
  status: 'Draft' | 'Confirmed';
}

export interface InventoryItem {
  id: string;
  name: string;
  category: 'spare part' | 'consumable';
  currentStock: number;
  minStockThreshold: number;
  unitOfMeasure: string;
  costPerUnit: number;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  entityName: string;
  recordId: string;
  description: string;
}
