import { Component, OnInit, signal } from '@angular/core';
import { TreeNode } from 'primeng/api';
import { OrganizationTreeNode } from './organiization.tree.node';
import { QueryService } from '../../core/services/query.service';
import { OrganizationChartModule } from 'primeng/organizationchart';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-organization.chart',
  imports: [CommonModule, OrganizationChartModule],
  templateUrl: './organization.chart.component.html',
  styleUrl: './organization.chart.component.css',
})
export class OrganizationChart implements OnInit{
  nodes = signal<TreeNode[]>([]);
  constructor(private queryService: QueryService,)
  {}
  
  ngOnInit() {

  this.queryService.getOrganizationTree()
    .subscribe(tree => {

      this.nodes.set([
        this.mapNode(tree)
      ]);

    });
}

private mapNode(
  node: OrganizationTreeNode
): TreeNode {

  return {

    label: node.name,

    type: node.type,

    data: {
      institutionCount:
        node.institutionCount,

      assetCount:
        node.assetCount,

      repairCount:
        node.repairCount
    },

    expanded: true,

    children:
      node.children?.map(
        c => this.mapNode(c)
      ) ?? []
  };
}

nodeSelected(event: any) {

  const node = event.node;

  switch (node.type) {

    case 'RDHS':
console.log('navigate to RDHS')
      /*this.router.navigate([
        '/institutions'
      ], {
        queryParams: {
          district: node.label
        }
      });*/

      break;

    case 'CATEGORY':

console.log('navigate to institutions')
      /*this.router.navigate([
        '/institutions'
      ], {
        queryParams: {
          category: node.label
        }
      });*/

      break;
  }
}
}
