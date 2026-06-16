import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastModule } from 'primeng/toast';

/**
 * Root component.
 *
 * This component is intentionally "dumb" — it no longer contains the
 * sidebar/header layout. That layout now lives in `ShellComponent`
 * (see src/app/layout/shell.component.ts) and is mounted only for
 * authenticated routes via app.routes.ts.
 *
 * This lets `/login` render as a clean, full-screen page with no
 * sidebar/header chrome around it — appropriate for a medical app's
 * entry point.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class App {
  protected readonly title = signal('pdhs');
}
