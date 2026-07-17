import { Component, input, model, computed } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';

/**
 * DEV-EXPERIENCE FEATURE #1: Signal-based input()/output()
 * -----------------------------------------------------------
 * No @Input()/@Output() decorators. `input()` returns a signal you read
 * with (), and Angular tracks it reactively — no manual OnChanges needed.
 * `input.required()` enforces the parent must pass it (compile-time checked).
 * `output()` replaces EventEmitter with a slightly leaner API.
 */
@Component({
  selector: 'app-repair-counter',
  standalone: true,
  imports: [ButtonModule, TagModule],
  template: `
    <div class="counter">
      <span>{{ label() }}</span>
      <p-tag [value]="count() + ''" [severity]="severity()" />
      <p-button icon="pi pi-plus" size="small" text (onClick)="increment()" />
      <p-button icon="pi pi-minus" size="small" text (onClick)="decrement()" />
    </div>
  `,
  styles: [`.counter { display: flex; align-items: center; gap: 0.5rem; }`],
})
export class RepairCounterComponent {
  // required signal input — TypeScript + Angular both enforce the parent passes it
  label = input.required<string>();

  // model() = a signal input AND output combined — enables [(count)] two-way
  // binding on the parent side, same idea as [(ngModel)] but for your own components.
  count = model(0);

  // a computed signal derived from another signal — no decorators, no lifecycle hooks
  severity = computed(() => (this.count() > 5 ? 'danger' : this.count() > 2 ? 'warn' : 'success'));

  increment(): void {
    this.count.update((c) => c + 1);
  }

  decrement(): void {
    this.count.update((c) => Math.max(0, c - 1));
  }
}