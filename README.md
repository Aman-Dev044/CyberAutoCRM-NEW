# CyberAutoSuite CRM

An advanced auto-service-center platform: public marketing site, online booking, a role-scoped
back-office CRM, and a customer portal — built on **Next.js 15 (App Router) + MongoDB**.

No Docker. One `npm install`, one `npm run seed`, one `npm run dev`.
Runs on **:2552 (web UI)** and **:2442 (API)** — locally and on the VPS alike.

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

# 4. run — starts BOTH instances
npm run dev
#   web UI  → http://localhost:2552
#   API     → http://localhost:2442/api/...
```

Prefer a single process instead of the split? `npm run dev:single` serves the UI **and** the API
from `:2552` — then clear `NEXT_PUBLIC_API_BASE` and `CORS_ALLOWED_ORIGINS` in `.env.local`.

### Environment

```ini
MONGODB_URI="mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/cyberautocrm-Ai?retryWrites=true&w=majority"
JWT_SECRET="a-long-random-string-at-least-32-chars"
JWT_EXPIRES_IN="7d"
COOKIE_SECURE="false"                 # plain HTTP — true once HTTPS is in front
NEXT_PUBLIC_APP_NAME="CyberAutoSuite"
NEXT_PUBLIC_APP_URL="http://localhost:2552"

# Split ports (omit both to run everything on :2552)
NEXT_PUBLIC_API_BASE="http://localhost:2442"
CORS_ALLOWED_ORIGINS="http://localhost:2552"

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
| `npm run dev` | Both dev instances — API :2442 + web :2552, separate build folders |
| `npm run dev:api` / `npm run dev:web` | Just one side of the split |
| `npm run dev:single` | One dev process serving UI **and** API on :2552 |
| `npm run build` / `npm start` | Production build, then serve on :2552 |
| `npm run lint` | ESLint |
| `npm run seed` | Upsert the essentials, keep existing transactional data |
| `npm run seed:fresh` | Wipe the collections and rebuild everything |
| `npm run clean:test-data` | Remove records created by smoke/E2E testing (seed data untouched) |
| `npm run start:api` | Serve the app on :2442 (API instance in a split-port deploy) |
| `npm run start:web` | Serve the app on :2552 (web instance in a split-port deploy) |

---

## Deploying on a VPS

### One `.env`, not two

There is a single env file at the project root: **`.env.local`**. There is no separate
frontend `.env`, because there is no separate frontend server — Next.js serves the UI and
`/api/*` from the same process.

What decides whether a variable reaches the browser is its **name**:

| Prefix | Who sees it | Variables here |
|---|---|---|
| `NEXT_PUBLIC_*` | baked into the browser bundle — **public, never put a secret here** | `NEXT_PUBLIC_APP_NAME`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_API_BASE` |
| everything else | server only, never sent to the browser | `MONGODB_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `COOKIE_SECURE`, `CORS_ALLOWED_ORIGINS`, `SEED_*` |

`NEXT_PUBLIC_*` values are read at **build time**, so changing one means rebuilding.

### Clone and run

```bash
git clone https://github.com/Aman-Dev044/CyberAutoCRM-NEW.git
cd CyberAutoCRM-NEW

npm ci                       # or: npm install
cp .env.example .env.local   # then edit it (see below)

npm run seed:fresh           # first time only — builds the demo workshop
npm run build
```

Minimum `.env.local` on the VPS:

```ini
MONGODB_URI="mongodb+srv://USER:PASS@CLUSTER.mongodb.net/cyberautocrm-Ai?retryWrites=true&w=majority"
JWT_SECRET="<run: openssl rand -base64 48>"
COOKIE_SECURE="false"        # plain http://IP — flip to true once HTTPS is on
NEXT_PUBLIC_APP_URL="http://YOUR_VPS_IP:2552"
```

> Whitelist the VPS IP in **Atlas → Network Access**, or nothing will connect.

### Option A — one port (recommended)

One process, UI and API together. This is how Next.js is meant to run.

```bash
npm start                    # already pinned to :2552
# UI   → http://YOUR_VPS_IP:2552
# API  → http://YOUR_VPS_IP:2552/api/...
```

With PM2 so it survives reboots:

```bash
npm i -g pm2
pm2 start npm --name cas-app -- start
pm2 save && pm2 startup
```

### Option B — API on :2442, UI on :2552

If the two ports are a hard requirement, run **two instances of the same build**. Both talk to
the same database; the browser is told to send API calls to `:2442`.

Add to `.env.local` **before building** (the first one is baked into the bundle):

```ini
NEXT_PUBLIC_API_BASE="http://YOUR_VPS_IP:2442"
CORS_ALLOWED_ORIGINS="http://YOUR_VPS_IP:2552"
```

Then:

```bash
npm run build

pm2 start npm --name cas-api -- run start:api   # :2442  — serves /api/*
pm2 start npm --name cas-web -- run start:web   # :2552  — serves the UI
pm2 save && pm2 startup
```

Open **http://YOUR_VPS_IP:2552**. The UI loads from `:2552` and every API call goes to `:2442`.

Why this works: session cookies are scoped per **host** and ignore the port, so a login issued
by `:2442` is sent back on requests from `:2552`. CORS still has to be granted explicitly,
because an origin *does* include the port — that is what `CORS_ALLOWED_ORIGINS` is for.

Open the firewall for both:

```bash
sudo ufw allow 2442/tcp && sudo ufw allow 2552/tcp
```

### Behind a domain (do this when you can)

Put Nginx in front, serve one origin over HTTPS, and set `COOKIE_SECURE="true"`:

```nginx
server {
    listen 80;
    server_name crm.example.com;

    location / {
        proxy_pass http://127.0.0.1:2552;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Then `sudo certbot --nginx -d crm.example.com`. With a single origin you can drop
`NEXT_PUBLIC_API_BASE` and `CORS_ALLOWED_ORIGINS` entirely and go back to Option A.

### Deployment gotchas

- **Never run `npm run build` while `npm run dev` is running** — `build` writes to `.next/` and
  the dev server starts serving broken chunks. Stop dev, build, restart. (The two dev instances
  are safe together: they use `.next-api` and `.next-web`.)
- `npm ci` needs the committed `package-lock.json`; it is in the repo.
- After changing any `NEXT_PUBLIC_*` value, **rebuild** — those are compile-time.
- Change `JWT_SECRET` from the example value, and rotate the Atlas password before going live.

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
