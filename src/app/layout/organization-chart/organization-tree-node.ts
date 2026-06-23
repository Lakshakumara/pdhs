export interface OrganizationTreeNode {

  id: string;

  name: string;

  type: 'PDHS' | 'RDHS' | 'CATEGORY';

  institutionCount?: number;

  assetCount?: number;

  repairCount?: number;

  children?: OrganizationTreeNode[];
}