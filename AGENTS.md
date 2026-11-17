# AGENTS.md — PDHS (Biomedical Item Management)

Read this file first. It maps both repositories so you never need to scan the whole project.

## The two repos

| Repo                     | Path               | Stack                                                                                               | Port                         |
| ------------------------ | ------------------ | --------------------------------------------------------------------------------------------------- | ---------------------------- |
| **Frontend** (this repo) | `D:\root\pdhs`     | Angular 21 (standalone), PrimeNG 21, Tailwind v4, RxJS + signals                                    | dev `4200` (`ng serve`)      |
| **Backend**              | `D:\root\pdhs-api` | NestJS 11, Prisma 7 + PostgreSQL (driver-adapter `@prisma/adapter-pg`, schema `pdhs`), Passport JWT | `3000` (`npm run start:dev`) |

API base URL: `environment.apiUrl` → dev `http://localhost:3000/api`; prod builds it from `window.location` port 3000. **Every controller hard-codes the `api/` prefix** (no global prefix in `main.ts`).

### Commands

- Frontend: `npm start` (serve), `npm run build`, `npm test` (Vitest), `npx prettier --write .` (no ESLint/lint script).
- Backend: `npm run start:dev`, `npm run build`, `npm run lint`, `npm test`, `npx prisma migrate deploy`, `npx prisma migrate dev --name x`, `npm run seed` (seed data source is `scripts/seed-data.ts`, but `npm run seed` needs `npx tsx`), `npm run gen:perms` (auto-runs on `prebuild`), `npm run sync:perms` (backfills role-default permissions to existing users).

---

## Backend map (`D:\root\pdhs-api`)

```
src/
├── main.ts                  # CORS, global ValidationPipe({transform, whitelist}), static client SPA fallback, port 3000
├── app.module.ts            # plain registry; NO global guards/pipes
├── auth/                    # auth.module, auth.controller (api/auth/*), permission.service.ts, scope.service.ts,
│   ├── strategies/jwt.strategy.ts
│   ├── permission.enum.ts           # DERIVED re-export of Permission from permission.registry.ts (never hand-edit)
│   ├── role-permissions.ts          # authorization policy: ROLE_PERMISSIONS (defaults), SCOPE_ROLES, ROLE_META, SCOPE_META
│   └── constants/permission.registry.ts   # SINGLE SOURCE of permissions → gen:perms generates both FE files
├── common/
│   ├── decorators/          # @RequirePermission(), @SkipPermission(), @ActiveRole(), @TransformDate()
│   └── guards/              # auth.guard.ts (JwtAuthGuard, ActiveRoleGuard), permission.guard.ts (PermissionGuard)
├── modules/                 # audit, dashboard, equipment, institute, inventory, organization, repair, supplier, users
├── prisma/                  # prisma.module (@Global), prisma.service (PrismaPg adapter, schema 'pdhs'), prisma-query-builder.ts
└── shared/                  # dto/base-query.dto.ts (BaseQueryDto), id/ (IdService → 'SUP-2026-0001')
prisma/schema.prisma         # all models; migrations in prisma/migrations/
```

### Non-negotiable backend rules

1. **Guard chain is per-controller, never global.** Every controller:
   ```ts
   @UseGuards(JwtAuthGuard, ActiveRoleGuard, PermissionGuard)
   @Controller('api/<name>')
   ```
   Guards are exported by `AuthModule` → feature modules must `imports: [AuthModule, PrismaModule, ...]`.
2. **PermissionGuard fails closed**: every route MUST have `@RequirePermission(...)` or `@SkipPermission()`, else 403.
   ```ts
   @RequirePermission(Permission.X_VIEW)                      // single
   @RequirePermission([Permission.A_VIEW, Permission.B_VIEW]) // ANY mode (default)
   @RequirePermission((req) => req.body?.status === 'Y' ? Permission.X_VERIFY : Permission.X_ASSIGN) // resolver
   ```
3. **Adding a permission (single-source workflow):**
   1. `src/auth/constants/permission.registry.ts` — add the `Permission.X` entry (label/group/icon).
   2. `src/auth/role-permissions.ts` — add it to the relevant `ROLE_PERMISSIONS[...]` defaults.
   3. Use it: `@RequirePermission(Permission.X)` on the route.
   4. `npm run build` — `gen:perms` runs automatically on `prebuild` and regenerates the FE files.
   5. `npm run sync:perms` — backfills the new default to existing users (new users get it at create/role-add time).
      Never edit `src/auth/permission.enum.ts` (derived shim) or the FE files `core/constants/permissions.ts` / `core/models/permission.types.ts` (both AUTO-GENERATED).
4. **Scoping**: services start reads with `this.scopeService.scopeWhere(activeRole)` (PDHS=all, RDHS=district, INSTITUTE=institution). `activeRole` comes from `@ActiveRole()` (set by `ActiveRoleGuard` from `x-role`/`x-scope-type`/`x-scope-id` headers, validated against JWT).
5. **IDs**: inject `IdService`, `this.idService.generate(ID_PREFIXES.X)` (`SUP` → supplier, etc.). Defined in `src/shared/id/id.service.ts`.
6. **Module recipe** (copy `modules/repair` or `modules/inventory`):
   ```
   modules/<name>/<name>.module.ts      imports [AuthModule, PrismaModule, (IdModule), (AuditModule)]
   modules/<name>/<name>.controller.ts  3-guard chain, @Controller('api/...'), @RequirePermission per route
   modules/<name>/<name>.service.ts     PrismaService (+ ScopeService/PrismaQueryBuilder/IdService/AuditService)
   modules/<name>/dto/<name>.dto.ts     Query*Dto extends BaseQueryDto; Create/Update with class-validator
   ```
7. Writes are wrapped in `prisma.$transaction` + `auditService.log(buildAuditContext(req), ...)` in richer modules (repair). DTOs: `whitelist: true` strips unknown props; empty-string phone/email fields use `@Transform` → `undefined`.
8. Alias routes are conventional here: `POST /add` = `POST /`, `PUT /:id/edit` = `PUT /:id` (see equipment + supplier).

### Auth flow (backend)

`POST /api/auth/login` → `{ token, refreshToken, user }`. JWT payload = `{ sub, username, fullName, institutionId, roles[] }` — **permissions are NOT in the token**; `PermissionGuard` queries the `UserPermission` table per request (supports expiring grants). Service-level double-check via `PermissionService.require(role, perm)` exists (used in `repair.service.ts`).

### Prisma models (all in `prisma/schema.prisma`)

`District, Institution, User, UserRole, UserPermission, RefreshToken, PasswordResetToken, Supplier, InventoryItem, ServicePlan, EquipmentSpareParts, Equipment, EquipmentDisposal, Assignment, RepairRequest, WorkOrder, VendorRepair, InspectedSparePart, PartUsed, ProcurementPlan, PurchaseOrder, PurchaseOrderItem, Grn, AuditLog, IdSequence, SeedSnapshot`.
Enums: `RoleType` (14 roles), `ScopeType` (PDHS|RDHS|INSTITUTE), `PartStatus`.
Note: there is **no `items` module/model** — items = `InventoryItem` in the `inventory` module.

---

## Frontend map (`D:\root\pdhs`, this repo)

```
src/app/
├── app.config.ts            # provideHttpClient(withInterceptors([userSessionInterceptor, errorInterceptor])), PrimeNG Aura theme
├── app.routes.ts            # ALL routes in this one file (2-level: shell + lazy children)
├── auth/login/              # public, outside shell
├── core/
│   ├── auth/                # auth.service.ts (token in localStorage 'auth_token'), permission.service.ts
│   ├── constants/permissions.ts    # AUTO-GENERATED Permission enum — never hand-edit (run gen:perms in pdhs-api)
│   ├── models/permission.types.ts  # AUTO-GENERATED RoleType/ScopeType/SCOPE_ROLES/ROLE_META/SCOPE_META — never hand-edit
│   ├── directives/          # permission-directive.ts (*appHasPermission), scope-directive.ts (*appHasScope)
│   ├── guards/              # auth.guard.ts (functional, on shell), admin.guard.ts (institute only)
│   ├── interceptors/        # user-session.interceptor.ts (Authorization Bearer only), error.interceptor.ts (→ toasts)
│   ├── models/biomed.interface.ts  # ALL domain models (Supplier, InventoryItem, PagedResult<T>, ...)
│   └── services/            # query.service.ts (READS), upsert.service.ts (WRITES), notification.service.ts,
│                            # user-facade.service.ts (session signals), biomed-state.service.ts (LEGACY — avoid)
├── features/                # standalone components: admin, audit, dashboard, equipment, institute, inventory,
│                            # procurement, repairs, supplier, test, users
└── layout/shell.component.* # sidebar+header, dark mode, *appHasPermission nav links
```

### Non-negotiable frontend rules

1. **No NgModules** — all standalone. **State = Angular signals** (`signal/computed/effect`); HTTP = RxJS (`forkJoin`, `finalize(loading)`, `subscribe({next, error})`). No ngrx.
2. **API split convention**: reads in `QueryService` (`core/services/query.service.ts`), writes in `UpsertService` (`core/services/upsert.service.ts`). Both use `environment.apiUrl`. Feature-local services only for scoped resources (see `UserApiService`).
3. **Errors**: services don't catch — `error.interceptor.ts` shows the toast; components still handle `error` in `subscribe` for specific messages via `NotificationService.success/error`.
4. **Permissions in templates**: `*appHasPermission="permission.X_VIEW"` (component exposes `readonly permission = Permission`). UI checks are cosmetic — backend re-verifies. Route-level auth is only `authGuard` (+ `AdminGuard` for institute). Role/permission metadata (matrix groups, default chips, role/scope labels+colors) is fetched from `GET /auth/permissions/meta` via `PermissionService.getMeta()` — no hardcoded `PERMISSION_GROUPS`/`ROLE_COLOR` in components (see `users.component.ts`).
5. **Styling**: Tailwind v4 utility classes inline in templates (feature components often have no `.css` file). Dark mode = `.dark` class on `<html>`. PrimeNG components imported per-file.
6. **Templates**: new control flow `@if/@for/@empty`; `strict` + `strictTemplates` are ON — template type errors break the build.
7. Routing: add new features as children of the shell in `app.routes.ts` with `loadComponent: () => import('./features/x/x.component').then(m => m.XComponent)`.

---

## CURRENT WORK: Supplier feature (status & known gaps)

### Backend — `src/modules/supplier/` (NEW, partly uncommitted)

- `supplier.module.ts`, `suppliers.controller.ts` (plural filename, class `SuppliersController`), `supplier.service.ts`, `dto/supplier.dto.ts`.
- Routes: `GET /api/supplier`, `GET /api/supplier/:id`, `POST /api/supplier` (+ `/add`), `PUT /api/supplier/:id` (+ `/:id/edit`), `DELETE /api/supplier/:id` (soft delete → `isDeleted: true`).
- Permissions (per-route `@RequirePermission(() => [...])`, ANY mode): GET → `SUPPLIER_VIEW|PROCUREMENT_VIEW`; POST → `SUPPLIER_CREATE|PROCUREMENT_CREATE`; PUT → `SUPPLIER_UPDATE|PROCUREMENT_CREATE`; DELETE → `SUPPLIER_DELETE` only (no fallback).
- DTO: `QuerySupplierDto extends BaseQueryDto` (+ `name`, `rating`); `Create/UpdateSupplierDto` with phone regex `/^[+]?[\d\s-]{7,20}$/`, email validation, `rating 1–5`, `supplyItem: Array<{id, name}>`.

**Known gaps to fix:**

1. ✅ Migration `20261113044000_supplier_contact_soft_delete` adds `contactPhone`, `contactEmail`, `whatsApp`, `isDeleted` — created via shadow-DB diff and `migrate resolve --applied` (columns pre-existed in live DB); `migrate status` clean.
2. `SupplierService.findSupplier` accepts `activeRole` but does **no scoping** and does not use `PrismaQueryBuilder` (unlike repair/inventory) — inconsistent pagination/search implementation.
3. Supplier is not audited (no `AuditModule` / `auditService.log` on writes) unlike repair.
4. ✅ `role-permissions.ts` `ADMIN_PDHS` triplicated `SUPPLIER_*` blocks deduped to one block (with `SUPPLIER_DELETE`).
5. ✅ Seed re-run: `SUPPLIER_*` rows now exist (VIEW/CREATE/UPDATE ×7 users; DELETE × admin, proc_sajith, super_admin); no duplicate user+permission rows.
6. `npm run seed` fails as-is (`tsx` not in node_modules / not a dependency) — use `npx tsx prisma/seed.ts`.

### Frontend — `src/app/features/supplier/`

- `supplier.component.ts` + `supplier.component.html` (no `.css`, Tailwind-only). Route: `path: 'supplier'` in `app.routes.ts`.
- Reads: `queryService.getSuppliers(page, size, rating?, search?)` → `GET /supplier`. Writes: `upsertService.createSupplier/updateSupplier/deleteSupplier`.
- Model: `Supplier` + `PagedResult<T>` in `core/models/biomed.interface.ts`.
- PrimeNG lazy `p-table`, rating filter chips, dialog form with inventory checkbox list (`supplyItemIds` → mapped to `supplyItem: [{id, name}]` on save).

**Known gaps / mismatches to fix:**

1. ✅ FE gating now mirrors the backend ANY-mode arrays: nav = `[SUPPLIER_VIEW, PROCUREMENT_VIEW]`, Register/Edit = `[SUPPLIER_CREATE, PROCUREMENT_UPDATE/CREATE]`, Delete = `SUPPLIER_DELETE`.
2. ✅ `QueryService.getInventorytem` renamed to `getInventoryItems` (supplier, repairs ×2, procurement updated).
3. ✅ Duplicate error toasts removed: `error.interceptor.ts` is the **single** source of HTTP-error toasts; component `subscribe.error` callbacks are now `error: () => {}`. Local pre-flight validation toasts (repairs/supplier "Please select…") stay.
4. `procurement.component.ts` still reads `suppliers$` from legacy `BiomedStateService` (hardcoded dead URL `http://10.20.16.5:3000/...`) → always empty; should move to `queryService.getSuppliers()`.
5. FE form validation must stay in sync with `CreateSupplierDto` (phone regex, email, rating 1–5, name minLength 3).
6. Role headers (`x-role`, `x-scope-type`, `x-scope-id`) are documented by `ActiveRoleGuard` but the FE interceptor currently sends **only** `Authorization` — if `ActiveRoleGuard` rejects requests, add these headers to `user-session.interceptor.ts` (or rely on its default `roles[0]` fallback).

---

## Known gotchas (both repos)

- **Backend**: `npm run lint` runs ESLint **with `--fix`** (rewrites files) and reports ~300 pre-existing errors across the codebase — not a clean gate. `src/old-controller` is a single fully-commented-out legacy file, not a folder. `delete-deploy.controller.ts` (`api/developer`, unguarded) is a dev leftover in `UsersModule`. `npm run seed:data` is broken (points at missing `prisma/seed-data.ts`; real data is `scripts/seed-data.ts`). No meaningful tests (only stock `test/app.e2e-spec.ts`).
- **Frontend**: `institute` route is registered twice in `app.routes.ts` (dead `loadChildren` copy). `biomed-state.service.ts` is deprecated. `README.md` is the stock Angular CLI one. No ESLint.
- Permission changes: edit `permission.registry.ts` + `role-permissions.ts` → `npm run build` (auto `gen:perms`) → `npm run sync:perms` for existing users. FE enum + types update automatically. Never hand-edit `permission.enum.ts` or the two generated FE files.
- DB: PostgreSQL, database `biomedical`, schema `pdhs`, user `biomedical_user`; `.env` at backend repo root (`DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `PORT`).

## Verification checklist after changes

- Backend: `npm run lint` && `npm run build` (and `npx prisma migrate dev` if schema changed).
- Frontend: `npx prettier --write .` && `npm run build` (strictTemplates catches template errors); `npm test` (Vitest, minimal coverage exists).
