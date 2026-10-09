# CyberAutoSuite CRM

An advanced auto-service-center platform: public marketing site, online booking, a role-scoped
back-office CRM, and a customer portal — built on **Next.js 15 (App Router) + MongoDB**.

No Docker. One `npm install`, one `npm run seed`, one `npm run dev`.

---

## What's inside

### 1. Public site (`/`)
| Route | What it does |
|---|---|
| `/` | Landing page — hero, pillars, live service catalogue from the DB, workflow, counters, testimonials, contact form |
| `/services` | Full catalogue grouped by category with starting prices and inclusions |
| `/about` | Story, values, milestones, technician roster |
| `/contact` | Contact details, enquiry form (writes to the CRM inbox), map |
| `/book` | 4-step booking wizard — services → vehicle & contact → slot → confirmation with a tracking code |
| `/track` | Public status lookup by `APT-xxxxxx` or `JOB-xxxxxx` — timeline, stage, totals. No login needed |

### 2. Admin / back-office (`/admin`)
| Route | What it does |
|---|---|
| `/admin` | Dashboard — revenue, outstanding, active jobs, alerts, charts, today's schedule |
| `/admin/appointments` | Booking queue, confirm/cancel, assign a technician, convert → job card |
| `/admin/board` | Drag-and-drop workshop board across the seven workflow stages |
| `/admin/orders` + `/admin/orders/[id]` | Job cards: labour lines, parts, technicians, diagnosis, work log, costing, invoice generation |
| `/admin/customers` + `/admin/customers/[id]` | Customer CRUD and a 360° view (vehicles, jobs, appointments, invoices, spend) |
| `/admin/vehicles` | Vehicle CRUD with insurance/PUC expiry highlighting |
| `/admin/services` | Service catalogue — pricing, inclusions, featured/live toggles |
| `/admin/parts` | Inventory with reorder alerts, inline stock +/−, margin per SKU |
| `/admin/invoices` + `/admin/invoices/[id]` | GST-ready invoices, part payments, printable document, void |
| `/admin/technicians` | Roster, specialisations, live workload, availability |
| `/admin/reports` | Daily billing, 12-month trend, payment mix, funnel, service mix, technician output, inventory value, CSV export |
| `/admin/messages` | Website enquiry inbox with replies |
| `/admin/users` | Users & roles with a live permission preview, password reset |
| `/admin/audit-logs` | Append-only trail of every mutation |
| `/admin/settings` | Workshop profile, billing defaults, hours & capacity, reminders |
| `/admin/profile` | Own details, password, permission list |

### 3. Customer portal (`/portal`)
Overview with a live job tracker, vehicles (add your own), self-service booking, invoices with
payment history, profile and password.

---

## Roles & permissions

Five roles, one permission table (`src/lib/rbac.ts`). Every API route and nav item is gated
through `can(role, permission)`.

| Role | Scope |
|---|---|
| `SUPER_ADMIN` | Everything, including other admins |
| `ADMIN` | All operations + users, settings, audit log |
| `MANAGER` | Floor operations, billing, reports — no user/settings access |
| `TECHNICIAN` | Own job cards only (enforced server-side on read *and* write) |
| `CUSTOMER` | Portal only — own vehicles, bookings, invoices |

---

## Getting started

```bash
# 1. install
npm install

# 2. configure
cp .env.example .env.local      # then edit MONGODB_URI and JWT_SECRET

# 3. seed demo data (staff, services, parts, customers, vehicles, jobs, invoices)
npm run seed:fresh

# 4. run
npm run dev                     # http://localhost:3000
```

### Environment

```ini
MONGODB_URI="mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/cyberautocrm-Ai?retryWrites=true&w=majority"
JWT_SECRET="a-long-random-string-at-least-32-chars"
JWT_EXPIRES_IN="7d"
NEXT_PUBLIC_APP_NAME="CyberAutoSuite"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
SEED_SUPERADMIN_EMAIL="superadmin@cyberautosuite.com"
SEED_SUPERADMIN_PASSWORD="SuperAdmin@123"
```

Works with a local `mongod` or MongoDB Atlas — only the URI changes.

### Demo logins (after seeding)

| Role | Email | Password |
|---|---|---|
| Super Admin | `superadmin@cyberautosuite.com` | `SuperAdmin@123` |
| Admin | `admin@cyberautosuite.com` | `Admin@123` |
| Manager | `manager@cyberautosuite.com` | `Manager@123` |
| Technician | `gurpreet.tech@cyberautosuite.com` | `Tech@123` |
| Customer | `customer@cyberautosuite.com` | `Customer@123` |

The login screen has one-tap buttons that fill these in.

### Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` / `npm start` | Production build and serve |
| `npm run lint` | ESLint |
| `npm run seed` | Upsert the essentials, keep existing transactional data |
| `npm run seed:fresh` | Wipe the collections and rebuild everything |
| `npm run clean:test-data` | Remove records created by smoke/E2E testing (seed data untouched) |

---

## Architecture

```
src/
├─ app/
│  ├─ (site)/            public marketing pages + loading boundary
│  ├─ (auth)/            login, register (split-screen layout)
│  ├─ admin/             back-office, guarded by layout + middleware
│  ├─ portal/            customer portal
│  └─ api/               route handlers (REST, JSON envelope)
├─ components/
│  ├─ ui/                Button, Field, Card, Badge, Modal, DataTable, Toast, Stat…
│  ├─ site/              header, footer, hero sections, booking + track + contact forms
│  ├─ admin/             AdminShell, charts, EntityPicker, JobCardForm, InvoiceView
│  ├─ portal/            PortalShell
│  └─ auth/              Login / Register forms
├─ lib/
│  ├─ db.ts              cached Mongoose connection (hot-reload safe)
│  ├─ auth.ts            bcrypt + JOSE JWT in an httpOnly cookie
│  ├─ rbac.ts            permission table and `can()`
│  ├─ api.ts             `route()` wrapper: DB, auth, permission, error → JSON
│  ├─ crud.ts            generic collection/item handler factory
│  ├─ validators.ts      Zod schemas shared by every endpoint
│  ├─ audit.ts           fire-and-forget audit trail
│  ├─ notifications.ts   email/SMS dispatch seam (logs today, swap in a provider)
│  └─ client.ts          typed fetch wrapper for the browser
├─ models/               11 Mongoose models
├─ server/               server-only query layer (analytics, settings, catalog, collections)
├─ hooks/useCollection   list fetching with debounced search, filters, pagination
└─ middleware.ts         edge guard for /admin, /portal and the auth pages
```

### Data model

`User` · `Customer` · `Vehicle` · `Service` · `Appointment` · `ServiceOrder` · `Part` ·
`Invoice` · `ContactMessage` · `AuditLog` · `Setting`

Money lives in one place: `ServiceOrder.recalculate()` and `Invoice.recalculate()` run on every
save, so labour, parts, discount, tax, paid and balance can never drift from the line items.

### The core workflow

```
Booking (PENDING) → confirm → convert → Job card
   OPEN → DIAGNOSING → AWAITING_PARTS → IN_PROGRESS → QUALITY_CHECK → READY → DELIVERED
                                                                  ↓
                                               Invoice (SENT → PARTIAL → PAID)
```

Delivering a job card is what updates the customer's visit count and lifetime spend, bumps the
vehicle's odometer and service history, and credits the technicians — one transition, one source
of truth.

### API conventions

Every endpoint answers with the same envelope:

```json
{ "success": true,  "data": { ... } }
{ "success": false, "error": "Human readable message", "details": [ { "path": "phone", "message": "…" } ] }
```

Validation failures come back as `422` with a field-level `details` array that the forms map
straight onto inputs. Auth is `401`, permissions `403`, duplicates `409`.

### Security notes

- Passwords: bcrypt, cost 11, `select: false` on the field.
- Sessions: HS256 JWT in an `httpOnly`, `sameSite=lax` cookie; `secure` in production.
- Guards are layered: edge middleware → server layout → per-route `permission` → ownership checks
  (a technician can only move their own job card; a customer can only touch their own vehicles).
- The last active super admin cannot be demoted, disabled or deleted.
- `/admin`, `/portal`, `/api` and the auth pages are excluded in `robots.ts`.

### Imagery

Photography lives in `public/images/` and is sourced from [Pexels](https://www.pexels.com)
(free for commercial use, no attribution required). Service photos are **data, not markup** — each
`Service` document carries an `image` path, so swapping a photo is an edit in
Admin → Services, not a code change. Every photo that carries text sits under a `.photo-scrim`
gradient so copy keeps its contrast in both light and dark themes.

To use your own workshop photos: drop them in `public/images/`, then point each service's `image`
field at the new path (and update the `GALLERY`/hero paths in `src/app/(site)/page.tsx`).

### Theming

Semantic CSS variables in `globals.css` (`--brand`, `--surface`, `--ink`, …) mapped into Tailwind
v4 via `@theme inline`. Light and dark are both first-class; the toggle writes to `localStorage`
and an inline script applies it before first paint, so there is no flash. Components only ever
reference tokens — never raw hex — so re-skinning the whole product means editing one block.

---

## Things deliberately left as seams

- **Notifications** — `src/lib/notifications.ts` reads the settings toggles and logs what it would
  send. Drop in Resend/SES/Twilio and the call sites keep working.
- **Payment gateway** — payments are recorded manually (cash/card/UPI/transfer). Add a gateway
  webhook that POSTs to `/api/invoices/[id]/payments`.
- **File uploads** — job cards reference photos conceptually; wire S3/UploadThing and store URLs.
