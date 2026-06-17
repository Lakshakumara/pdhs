import { ScopeType, Permission } from "../auth/permission.types";

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

export interface UserDto {
  id: string;
  username: string;
  fullName: string;
  email?: string | null;

  mustChangePassword: boolean;
  active: boolean;

  institutionId?: string | null;
  institutionName?: string | null;

  districtId?: string | null;
  districtName?: string | null;

  permissions: UserPermissionRecord[];
  roles: UserRoleDto[];

  createdAt: string;
  updatedAt: string;
}

export interface UserPermissionRecord {
  id: string;
  permission: Permission;
  grantedAt: string;
  expiresAt: string | null;
  note: string | null;
  active: boolean;
  grantedBy: { id: string; fullName: string } | null;
}

export interface UserRoleDto {
  id: string;
  role: RoleType;
  scopeType: ScopeType;
  scopeId: string | null;
  permission: Permission[] | null;
  assignedAt: string;
  assignedById: string | null;
}
export interface UserSession {
  user: UserDto;
  activeRole: ActiveRole;
  permission: Permission[] | null;
}
export interface ActiveRole {
  role: RoleType;
  scopeType: ScopeType;
  scopeId: string | null;
}

export type RoleType =
  | 'SUPER_ADMIN_PDHS'
  | 'ADMIN_PDHS'
  | 'SUPER_ADMIN_RDHS'
  | 'ADMIN_RDHS'
  | 'SUPER_ADMIN_INSTITUTE'
  | 'ADMIN_INSTITUTE'
  | 'VIEWER_PDHS'
  | 'VIEWER_RDHS'
  | 'VIEWER_INSTITUTE'
  | 'STORE_KEEPER'
  | 'BIOMEDICAL_TECHNICIAN'
  | 'PROCUREMENT_OFFICER'
  | 'INSTITUTION_USER';
  

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
  agreementReference?: string;
  expiryDate?: string;
  noOfFreeService: number;
  servicePerAnnum?: number;
  serviceCosts?: any;
  labourCosts?: any;
  transportCosts?: any;
  otherCosts?: any;
  totalCosts?: any;
  sparePartsCosts?: any;
}

export interface EquipmentParts {
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
  components: EquipmentParts[];
  // Location Tracking
  assignedInstitutionId?: string;
  assignedInstitution?: Institution;
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


export interface PagedResult<T> {

  items: T[];

  page: number;

  size: number;

  total: number;

  totalPages: number;
}