import { Component, inject, signal } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { RepairCounterComponent } from './repair-counter.component';
import { SimpleNoteDialogComponent } from './simple-note-dialog.component';

@Component({
  selector: 'app-dev-features-test',
  standalone: true,
  imports: [ButtonModule, CardModule, ToastModule, RepairCounterComponent],
  providers: [DialogService, MessageService], // remove if already provided app-wide
  template: `
    <p-toast />

    <p-card header="Dev-Experience Feature Checks">
      <!-- ============================================================
           FEATURE: model() two-way binding on a custom component
           [(count)] works exactly like [(ngModel)], but it's OUR component.
      ============================================================= -->
      <section>
        <h4>1. model() two-way binding</h4>
        <app-repair-counter label="Parts pending" [(count)]="pendingParts" />
        <p class="hint">Parent-side value updates live via signal: {{ pendingParts() }}</p>
      </section>

      <!-- ============================================================
           FEATURE: PassThrough (pt) props
           Reach into a PrimeNG component's internal DOM nodes without
           ::ng-deep or global CSS overrides.
      ============================================================= -->
      <section>
        <h4>2. PassThrough (pt) props</h4>
        <p-button
          label="Styled via pt"
          icon="pi pi-star"
          [pt]="{
            root: { class: 'pt-demo-root' },
            label: { class: 'pt-demo-label' },
            icon: { style: { color: 'gold' } }
          }"
        />
        <p class="hint">Root/label/icon all get custom classes/styles directly — no ::ng-deep.</p>
      </section>

      <!-- ============================================================
           FEATURE: DialogService — open any standalone component as a
           modal dynamically, without declaring <p-dialog> in the template.
      ============================================================= -->
      <section>
        <h4>3. DialogService (dynamic modal)</h4>
        <p-button label="Open Dynamic Dialog" icon="pi pi-external-link" severity="secondary" (onClick)="openDialog()" />
      </section>
    </p-card>
  `,
  styles: [
    `
      section { margin-bottom: 1.75rem; }
      h4 { margin: 0 0 0.5rem; }
      .hint { color: var(--p-text-muted-color); font-size: 0.85rem; margin-top: 0.4rem; }

      /* pt-injected classes styled here like any normal CSS target */
      :host ::ng-deep .pt-demo-root { border-radius: 999px; }
      :host ::ng-deep .pt-demo-label { font-style: italic; }
    `,
  ],
})
export class Test {
  private readonly dialogService = inject(DialogService);
  private readonly messageService = inject(MessageService);
  private dialogRef?: DynamicDialogRef | null;

  pendingParts = signal(3);

  openDialog(): void {
    this.dialogRef = this.dialogService.open(SimpleNoteDialogComponent, {
      header: 'Add a Quick Note',
      width: '30rem',
      modal: true,
      data: { placeholder: 'What needs attention?' },
    });

    this.dialogRef?.onClose.subscribe((note?: string) => {
      if (note) {
        this.messageService.add({ severity: 'success', summary: 'Note saved', detail: note });
      }
    });
  }
}