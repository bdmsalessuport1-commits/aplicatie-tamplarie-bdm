# BDM Tâmplărie – Sistem Ofertare

Aplicație web profesională pentru ofertare sisteme de tâmplărie PVC + Aluminiu.

## Stack

- **Next.js 15** (App Router, TypeScript)
- **PostgreSQL** + **Prisma ORM**
- **NextAuth.js v5** (credentials, JWT)
- **@react-pdf/renderer** (PDF generation)
- **pdf-lib** (PDF merge)
- **Google Sheets API v4** (read-only, Service Account)
- **Tailwind CSS** + **Recharts** + **Lucide React**

## Setup Rapid

### 1. Instalare dependențe

```bash
npm install
```

### 2. Configurare bază de date

Copiați `.env.example` în `.env.local` și completați:

```bash
cp .env.example .env.local
```

```
DATABASE_URL="postgresql://user:password@localhost:5432/tamplarie_bdm"
NEXTAUTH_SECRET="min-32-chars-random-string"
NEXTAUTH_URL="http://localhost:3000"
```

### 3. Migrare + seed

```bash
npm run db:push      # aplică schema
npm run db:seed      # date inițiale (produse, extraopțiuni, useri demo)
```

**Credențiale demo:**
- Admin: `admin@bdm.ro` / `Admin@2024!`
- Agent: `agent@bdm.ro` / `Agent@2024!`

### 4. Configurare Google Sheets (opțional, M3)

1. Creați un Service Account în Google Cloud Console
2. Activați Google Sheets API
3. Descărcați JSON-ul și adăugați în `.env.local`:
   ```
   GOOGLE_SERVICE_ACCOUNT_KEY='{"type":"service_account",...}'
   ```
4. Adăugați email-ul service account-ului ca **Viewer** în sheet-ul Google

### 5. Pornire development

```bash
npm run dev
```

Deschideți [http://localhost:3000](http://localhost:3000)

## Milestones

| M | Status | Conținut |
|---|--------|----------|
| M1 | ✅ | Auth + DB + user management + seed date |
| M2 | ✅ | Offers CRUD + dashboard KPI + wizard creare |
| M3 | ✅ | Extras + mappings + Google Sheets sync |
| M4 | ✅ | PDF generation (@react-pdf) + merge tablou (pdf-lib) |
| M5 | 🔄 | Polish + Docker + deployment |

## Structura Folder

```
src/
├── app/
│   ├── (auth)/login/         ← pagina autentificare
│   ├── (dashboard)/          ← layout protejat
│   │   ├── dashboard/        ← KPI + charts
│   │   ├── offers/           ← CRUD oferte
│   │   └── settings/         ← Admin settings
│   └── api/                  ← REST API routes
├── components/               ← UI components
├── lib/                      ← utilities (prisma, auth, sheets, pdf)
├── types/                    ← TypeScript types
└── middleware.ts             ← auth guard
```

## API Endpoints

| Method | Path | Descriere |
|--------|------|-----------|
| GET | /api/offers | Listă oferte (cu filtre) |
| POST | /api/offers | Creare ofertă |
| GET | /api/offers/:id | Detalii ofertă |
| PUT | /api/offers/:id | Actualizare/status change |
| DELETE | /api/offers/:id | Ștergere (doar DRAFT) |
| PUT | /api/offers/:id/extras | Actualizare extraopțiuni |
| POST | /api/offers/:id/sync-sheet | Sincronizare prețuri din Sheet |
| POST | /api/offers/:id/upload | Upload tablou PDF |
| GET | /api/offers/:id/pdf | Generare + download PDF |
| GET | /api/products | Lista produse cu prețuri |
| PUT | /api/products/:id/price | Setare preț produs (Admin) |
| GET | /api/extra-options | Lista extraopțiuni |
| GET/PUT | /api/mappings | Mapare celule Sheet |
| GET/POST | /api/users | Utilizatori (Admin) |
| PUT/DELETE | /api/users/:id | Edit/dezactivare user (Admin) |
| GET | /api/dashboard | KPI + charts data |
