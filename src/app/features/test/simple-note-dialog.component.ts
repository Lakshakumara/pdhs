import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TextareaModule } from 'primeng/textarea';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';

/**
 * Any standalone component can be opened via DialogService.open(...) —
 * it doesn't need to be pre-declared as a <p-dialog> anywhere.
 * DynamicDialogConfig/Ref let it receive data in and pass a result back out.
 */
@Component({
  selector: 'app-simple-note-dialog',
  standalone: true,
  imports: [FormsModule, ButtonModule, TextareaModule],
  template: `
    <textarea pTextarea rows="4" style="width: 100%" [(ngModel)]="note" [placeholder]="config.data?.placeholder"></textarea>
    <div class="dialog-actions">
      <p-button label="Cancel" severity="secondary" [outlined]="true" (onClick)="ref.close()" />
      <p-button label="Save" icon="pi pi-check" (onClick)="ref.close(note)" />
    </div>
  `,
  styles: [`.dialog-actions { display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 1rem; }`],
})
export class SimpleNoteDialogComponent {
  readonly ref = inject(DynamicDialogRef);
  readonly config = inject(DynamicDialogConfig);
  note = '';
}