// AUTO-GENERATED from pdhs-api/src/auth/role-permissions.ts
// DO NOT EDIT - run npm run gen:perms in pdhs-api (also runs on npm run build)
//
// Single source of truth lives in the backend:
//   RoleType / ScopeType  → prisma/schema.prisma enums
//   SCOPE_ROLES           → src/auth/role-permissions.ts
//   ROLE_META / SCOPE_META → src/auth/role-permissions.ts

export enum ScopeType {
  PDHS = 'PDHS',
  RDHS = 'RDHS',
  INSTITUTE = 'INSTITUTE',
}

export enum RoleType {
  SUPER_ADMIN_PDHS = 'SUPER_ADMIN_PDHS',
  ADMIN_PDHS = 'ADMIN_PDHS',
  VIEWER_PDHS = 'VIEWER_PDHS',
  SUPER_ADMIN_RDHS = 'SUPER_ADMIN_RDHS',
  ADMIN_RDHS = 'ADMIN_RDHS',
  VIEWER_RDHS = 'VIEWER_RDHS',
  SUPER_ADMIN_INSTITUTE = 'SUPER_ADMIN_INSTITUTE',
  ADMIN_INSTITUTE = 'ADMIN_INSTITUTE',
  VIEWER_INSTITUTE = 'VIEWER_INSTITUTE',
  STORE_KEEPER = 'STORE_KEEPER',
  BIOMEDICAL_TECHNICIAN = 'BIOMEDICAL_TECHNICIAN',
  PROCUREMENT_OFFICER = 'PROCUREMENT_OFFICER',
  INSTITUTION_USER = 'INSTITUTION_USER',
}

// Roles allowed to be assigned at each scope level
export const SCOPE_ROLES: Record<ScopeType, RoleType[]> = {
  [ScopeType.PDHS]: [
    RoleType.SUPER_ADMIN_PDHS,
    RoleType.ADMIN_PDHS,
    RoleType.VIEWER_PDHS,
    RoleType.BIOMEDICAL_TECHNICIAN,
    RoleType.PROCUREMENT_OFFICER,
  ],
  [ScopeType.RDHS]: [
    RoleType.SUPER_ADMIN_RDHS,
    RoleType.ADMIN_RDHS,
    RoleType.VIEWER_RDHS,
    RoleType.STORE_KEEPER,
    RoleType.BIOMEDICAL_TECHNICIAN,
  ],
  [ScopeType.INSTITUTE]: [
    RoleType.SUPER_ADMIN_INSTITUTE,
    RoleType.ADMIN_INSTITUTE,
    RoleType.VIEWER_INSTITUTE,
    RoleType.INSTITUTION_USER,
    RoleType.STORE_KEEPER,
    RoleType.BIOMEDICAL_TECHNICIAN,
  ],
};

// Display metadata for role badges / selects (UI only — not auth logic)
export const ROLE_META: Record<RoleType, { label: string; color: string }> = {
  [RoleType.SUPER_ADMIN_PDHS]: { label: "Super Admin (PDHS)", color: "#dc2626" },
  [RoleType.ADMIN_PDHS]: { label: "Admin (PDHS)", color: "#7c3aed" },
  [RoleType.VIEWER_PDHS]: { label: "Viewer (PDHS)", color: "#0284c7" },
  [RoleType.SUPER_ADMIN_RDHS]: { label: "Super Admin (RDHS)", color: "#ea580c" },
  [RoleType.ADMIN_RDHS]: { label: "Admin (RDHS)", color: "#6d28d9" },
  [RoleType.VIEWER_RDHS]: { label: "Viewer (RDHS)", color: "#0369a1" },
  [RoleType.SUPER_ADMIN_INSTITUTE]: { label: "Super Admin (Institute)", color: "#d97706" },
  [RoleType.ADMIN_INSTITUTE]: { label: "Admin (Institute)", color: "#5b21b6" },
  [RoleType.VIEWER_INSTITUTE]: { label: "Viewer (Institute)", color: "#075985" },
  [RoleType.STORE_KEEPER]: { label: "Store Keeper", color: "#16a34a" },
  [RoleType.BIOMEDICAL_TECHNICIAN]: { label: "Biomedical Technician", color: "#059669" },
  [RoleType.PROCUREMENT_OFFICER]: { label: "Procurement Officer", color: "#0d9488" },
  [RoleType.INSTITUTION_USER]: { label: "Institution User", color: "#6b7280" },
};

// Display metadata for scope level selects
export const SCOPE_META: Record<ScopeType, { label: string }> = {
  [ScopeType.PDHS]: { label: "PDHS (System-wide)" },
  [ScopeType.RDHS]: { label: "RDHS (District)" },
  [ScopeType.INSTITUTE]: { label: "Institute" },
};
