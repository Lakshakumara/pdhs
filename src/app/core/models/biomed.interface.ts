import { ScopeType, Permission, RoleType } from "./permission.types";

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

export interface EquipmentSpareParts {
  id: string;
  name: string;
  description: string;
  partNumber: string;
  serialNumber?: string;
  quantity: number;
  sparePartType: 'Serialized' | 'Consumable' | 'Minor/Non-tracked';
  expiryOrWarrantyDate?: string;
}

export interface Equipment {
  id: string;
  invoiceNumber: string;
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
  spareParts: EquipmentSpareParts[];
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
  | 'SUBMITTED'
  | 'ACKNOWLEDGED'
  | 'DIAGNOSED'
  | 'AWAITING_PARTS'
  | 'IN_REPAIR'
  | 'COMPLETED'
  | 'VERIFIED_CLOSED'
  | 'ESCALATED_TO_VENDOR'
  | 'VENDOR_IN_PROGRESS'
  | 'VENDOR_COMPLETED';

export type RepairTrack = 'INTERNAL' | 'VENDOR';
export type RepairBasis = 'WARRANTY' | 'PAID';
export type HandoverType = 'FIELD_VISIT' | 'EQUIPMENT_SENT';


export interface WorkOrder {
  id: string;
  repairTrack?: RepairTrack;          // defaults to 'INTERNAL' on the backend
  repairRequestId: string;
  assignedTechnicianId?: string;
  assignedTechnicianName?: string;
  diagnosisNotes?: string;
  resolutionDetails?: string;
  status: WorkOrderStatus;
  statusDate: string;
  institutionId?: string;
  institutionName?: string;
  completedDate?: string;
  inspectedSpareParts?: InspectedSparePart[];
  partsUsed?: PartUsedDetail[];
  vendorRepair?: VendorRepair;        // populated only when repairTrack === 'VENDOR'
}

// Mirrors the VendorRepair Prisma model — one-to-one with WorkOrder.
export interface VendorRepair {
  id: string;
  workOrderId: string;

  vendorName: string;
  vendorContact?: string;
  vendorEmail?: string;

  repairBasis: RepairBasis;
  handoverType: HandoverType;

  // EQUIPMENT_SENT fields
  dispatchDate?: string;
  dispatchedBy?: string;
  courierRef?: string;

  // FIELD_VISIT fields
  scheduledDate?: string;
  visitLocation?: string;

  // Completion tracking
  vendorRefNumber?: string;
  returnDate?: string;
  returnNotes?: string;

  createdAt: string;
  updatedAt: string;
}

export interface RepairRequest {
  id: string;
  equipmentId: string;
  equipmentName: string;
  equipmentSerialNumber: string;
  sparePartId?: string; // Optional if fault is on sub-sparePart
  sparePartName?: string;
  faultDescription: string;
  priority: RepairPriority;
  photoUrl?: string;
  submittedByUserId: string;
  submittedByUserName: string;
  submissionDate: string;
  institutionId: string;
  institutionName: string;
  workOrder?: WorkOrder;
  equipment?: Equipment;
}
export interface EquipmentRepairHistory extends RepairRequest {
  workorder: WorkOrder;
}
export interface InspectedSparePart {
  id?: string;
  sparePartId: string;
  sparePartName?: string;
  inspected: boolean;
  conditionNotes?: string;
  workOrderId?: string;
}

export interface PartUsedDetail {
  id?: string;
  description?: string;
  quantityUsed: number;
  status?: 'BUFFERED' | 'CONSUMED';
  inventoryItemId: string;
  inventoryItemName?: string;
  unitCost?: number;
  workOrderId?: string;
}

/*export interface WorkOrder {
  id: string;
  repairTrack?: string;
  repairRequestId: string;
  assignedTechnicianId?: string;
  assignedTechnicianName?: string;
  diagnosisNotes?: string;
  resolutionDetails?: string;
  status: WorkOrderStatus;
  statusDate: string;
  institutionId?: string;
  institutionName?: string;
  completedDate?: string;
  inspectedSpareParts?: InspectedSparePart[];
  partsUsed: PartUsedDetail[];
}*/

export interface EscalateToVendorDto {
  vendorName: string;
  vendorContact?: string;
  vendorEmail?: string;
  repairBasis: 'WARRANTY' | 'PAID';
  handoverType: 'FIELD_VISIT' | 'EQUIPMENT_SENT';

  // EQUIPMENT_SENT fields
  dispatchDate?: Date;
  dispatchedBy?: string;
  courierRef?: string;

  // FIELD_VISIT fields
  scheduledDate?: Date;
  visitLocation?: string;

  vendorRefNumber?: string;
}

export interface VendorCompletedDto {
  returnDate: Date;
  returnNotes?: string;
}

/** A completed repair record pairing a RepairRequest with its WorkOrder */
export interface RepairHistoryEntry {
  repairRequest: RepairRequest;
  workOrder?: WorkOrder;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
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
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'ASSIGN' | 'STATUS_CHANGE';
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