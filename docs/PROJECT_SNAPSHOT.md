# PROJECT_SNAPSHOT.md — Host Blacklist

> Automaticky generovaný scan projektu.
> Dátum: 2026-03-06
> Produkcia: https://host-blacklist.vercel.app

---

## 1. Tech Stack

| Technológia | Verzia | Poznámka |
|-------------|--------|----------|
| Next.js | 16.1.6 | App Router (nie 14 ako pôvodne predpokladané) |
| React | 19.2.3 | React 19 s use() hook support |
| React DOM | 19.2.3 | — |
| TypeScript | ^5 | Strict mode enabled |
| Tailwind CSS | ^4 | V4 (CSS-first config, @import based) |
| shadcn/ui | ^3.8.5 (CLI) | new-york style, lucide icons |
| Supabase JS | ^2.98.0 | Client library |
| Supabase SSR | ^0.9.0 | Server-side auth helpers |
| Radix UI | ^1.4.3 + individual packages | Primitives for select, dialog, label, slot |
| Lucide React | ^0.577.0 | Icon library |
| CVA | ^0.7.1 | class-variance-authority |
| clsx | ^2.1.1 | Class name utility |
| tailwind-merge | ^3.5.0 | Tailwind class merging |
| tw-animate-css | ^1.4.0 | Animation utilities |
| ESLint | ^9 + eslint-config-next | Linting |
| Node.js | 22+ | Runtime |

### Chýbajúce závislosti (pre plánované features)
- **next-intl** — NIE je v package.json (i18n nie je implementované)
- **next-pwa** — NIE je v package.json (sw.js je statický, pravdepodobne ručne generovaný cez workbox)
- **tesseract.js** alebo OCR knižnica — NIE je (pre OCR Photo Upload)
- **@supabase/auth-helpers-nextjs** — nepoužíva sa, SSR verzia je novšia

---

## 2. Architecture Overview

### Folder Structure
```
host-blacklist/
├── public/
│   ├── sw.js                    # Service worker (workbox-generated, stale)
│   ├── workbox-4754cb34.js      # Workbox runtime
│   └── *.svg                    # Default Next.js icons
├── src/
│   ├── app/
│   │   ├── layout.tsx           # Root layout (AuthProvider, Navbar, Footer, Toaster)
│   │   ├── providers.tsx        # AuthContext provider
│   │   ├── globals.css          # Tailwind v4 + shadcn theme (light/dark)
│   │   ├── page.tsx             # Landing page (public)
│   │   ├── login/page.tsx       # Login form
│   │   ├── register/page.tsx    # Registration form
│   │   ├── dashboard/page.tsx   # User dashboard (stats, reports, quick search)
│   │   ├── search/page.tsx      # Guest search (fuzzy, debounced)
│   │   ├── guest/[id]/page.tsx  # Guest detail + reports
│   │   ├── report/new/page.tsx  # Create new report
│   │   ├── report/[id]/edit/page.tsx  # Edit/delete report
│   │   ├── settings/page.tsx    # Profile settings
│   │   ├── auth/callback/route.ts  # OAuth callback handler
│   │   └── api/                 # API routes (see section 5)
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Navbar.tsx       # Responsive navbar (desktop + mobile Sheet)
│   │   │   ├── Footer.tsx       # Simple copyright footer
│   │   │   └── ErrorBoundary.tsx # React error boundary
│   │   ├── search/
│   │   │   ├── SearchBar.tsx    # Search input with loading/clear
│   │   │   ├── GuestCard.tsx    # Guest result card
│   │   │   └── GuestList.tsx    # Results list with states
│   │   └── ui/                  # shadcn components (13 total)
│   │       ├── alert.tsx
│   │       ├── badge.tsx
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── dialog.tsx
│   │       ├── input.tsx
│   │       ├── label.tsx
│   │       ├── select.tsx
│   │       ├── sheet.tsx
│   │       ├── textarea.tsx
│   │       └── toast.tsx        # CUSTOM (nie shadcn) — global toast system
│   ├── lib/
│   │   ├── utils.ts             # cn() helper
│   │   ├── constants.ts         # INCIDENT_TYPES, PLATFORMS, SEVERITY_LABELS
│   │   ├── supabase/
│   │   │   ├── client.ts        # Browser client (createBrowserClient)
│   │   │   ├── server.ts        # Server client (createServerClient + cookies)
│   │   │   └── middleware.ts    # Session refresh + route protection
│   │   └── hooks/
│   │       ├── use-auth.ts      # Auth hook (signIn, signUp, signOut, profile)
│   │       └── use-debounce.ts  # Generic debounce hook
│   └── proxy.ts                 # ⚠️ PROBLÉM: middleware export, ale NIE je v src/middleware.ts
├── supabase/
│   └── migrations/
│       ├── 001_initial_schema.sql    # Tables, RLS, trigger
│       └── 002_search_functions.sql  # pg_trgm fuzzy search
├── next.config.ts               # PRÁZDNA konfigurácia
├── components.json              # shadcn config (new-york, neutral, cssVariables)
├── tsconfig.json                # Strict, path alias @/* → ./src/*
└── package.json
```

### Data Flow
```
Browser → Navbar (client) → Page (client, "use client")
  → fetch(/api/...) → API Route (server) → createClient(server)
  → Supabase (PostgreSQL + Auth) → Response → State update → Render
```

Všetky pages sú "use client" — žiadne Server Components pre fetching dát (všetko cez client-side fetch + API routes).

### Middleware
⚠️ **KRITICKÝ PROBLÉM:** `src/proxy.ts` exportuje middleware funkciu, ale Next.js očakáva `src/middleware.ts` (alebo `middleware.ts` v root). Middleware pre route protection **pravdepodobne nefunguje** v produkcii. Ochrana routes je fallback na client-side check v `useAuthContext`.

---

## 3. Current Features

### Implementované ✅
| Feature | Stav | Page/Route |
|---------|------|------------|
| Landing page | ✅ Funkčná | `/` |
| Email/Password registrácia | ✅ Funkčná | `/register` |
| Email/Password login | ✅ Funkčný | `/login` |
| OAuth callback handler | ✅ Pripravený | `/auth/callback` |
| Dashboard s statistikami | ✅ Funkčný | `/dashboard` |
| Quick search z dashboardu | ✅ Funkčný | `/dashboard` |
| Fuzzy vyhľadávanie hostí | ✅ Funkčné (pg_trgm) | `/search` |
| Guest detail so všetkými reportmi | ✅ Funkčný | `/guest/[id]` |
| Vytvorenie reportu | ✅ Funkčné | `/report/new` |
| Editácia vlastného reportu | ✅ Funkčná | `/report/[id]/edit` |
| Zmazanie vlastného reportu | ✅ Funkčné | `/report/[id]/edit` |
| Profile settings (meno, firma, mesto) | ✅ Funkčné | `/settings` |
| Flag report as false | ✅ Funkčný | `/guest/[id]` |
| Anonymizácia reporterov | ✅ Funkčná | API `/api/guests/[id]` |
| Email maskovanie | ✅ Funkčné | API `/api/guests/[id]` |
| Responsive mobile nav (Sheet) | ✅ Funkčná | Navbar |
| Error boundary | ✅ Funkčný | Layout |
| Custom toast system | ✅ Funkčný | Global |
| Skeleton loading states | ✅ Dashboard | Dashboard |
| Dark mode theme variables | ✅ Definované v CSS | globals.css |

### Čiastočne implementované ⚠️
| Feature | Stav | Poznámka |
|---------|------|----------|
| PWA | ⚠️ Stará cache | sw.js odkazuje na `[locale]` routing čo neexistuje, manifest.json v public ale žiadny link v layout |
| Dark mode | ⚠️ CSS vars ready | Chýba toggle, html lang="en" bez class="dark" |
| Middleware auth protection | ⚠️ Broken | `proxy.ts` namiesto `middleware.ts` — client-side fallback funguje |

### Neimplementované ❌
| Feature | Status |
|---------|--------|
| i18n (next-intl) | ❌ Žiadna závislosť, žiadna konfigurácia |
| OCR Photo Upload | ❌ |
| Facebook Integration | ❌ |
| Google OAuth | ❌ (callback handler existuje, ale OAuth provider nie je zapnutý) |
| Štatistiky (rozšírené) | ❌ Len basic my_reports_count + total_guests |
| Admin panel | ❌ |
| Notifikácie | ❌ |

---

## 4. Database Schema

### Tabuľky

#### `profiles` (extends auth.users)
| Stĺpec | Typ | Constraint |
|---------|-----|-----------|
| id | uuid | PK, FK → auth.users ON DELETE CASCADE |
| full_name | text | NOT NULL |
| company_name | text | nullable |
| city | text | nullable |
| country | text | nullable |
| properties_count | integer | DEFAULT 1 |
| created_at | timestamptz | DEFAULT now() |
| updated_at | timestamptz | DEFAULT now() |

#### `guests`
| Stĺpec | Typ | Constraint |
|---------|-----|-----------|
| id | uuid | PK, DEFAULT gen_random_uuid() |
| full_name | text | NOT NULL |
| email | text | nullable, UNIQUE WHERE NOT NULL |
| phone | text | nullable |
| notes | text | nullable |
| reports_count | integer | DEFAULT 0 |
| created_at | timestamptz | DEFAULT now() |
| updated_at | timestamptz | DEFAULT now() |

**Indexy:** `idx_guests_email` (unique partial), `idx_guests_full_name_trgm` (GIN), `idx_guests_email_trgm` (GIN)

#### `reports`
| Stĺpec | Typ | Constraint |
|---------|-----|-----------|
| id | uuid | PK, DEFAULT gen_random_uuid() |
| guest_id | uuid | NOT NULL, FK → guests ON DELETE CASCADE |
| reporter_id | uuid | NOT NULL, FK → profiles ON DELETE CASCADE |
| incident_type | text | NOT NULL, CHECK IN (damage, theft, noise, fraud, no_show, other) |
| incident_date | date | nullable |
| severity | integer | CHECK 1-5 |
| description | text | NOT NULL |
| property_name | text | nullable |
| platform | text | CHECK IN (airbnb, booking, direct, other) |
| created_at | timestamptz | DEFAULT now() |
| updated_at | timestamptz | DEFAULT now() |

**Indexy:** `idx_reports_guest_reporter` (unique composite — 1 report per host per guest)

#### `flags`
| Stĺpec | Typ | Constraint |
|---------|-----|-----------|
| id | uuid | PK, DEFAULT gen_random_uuid() |
| report_id | uuid | NOT NULL, FK → reports ON DELETE CASCADE |
| flagger_id | uuid | NOT NULL, FK → profiles ON DELETE CASCADE |
| reason | text | NOT NULL |
| created_at | timestamptz | DEFAULT now() |

**Indexy:** `idx_flags_report_flagger` (unique composite — 1 flag per user per report)

### RLS Policies

| Tabuľka | Policy | Rule |
|---------|--------|------|
| profiles | SELECT | auth.uid() = id |
| profiles | UPDATE | auth.uid() = id |
| profiles | INSERT | auth.uid() = id |
| guests | SELECT | authenticated |
| guests | INSERT | authenticated |
| guests | UPDATE | authenticated |
| reports | SELECT | authenticated |
| reports | INSERT | auth.uid() = reporter_id |
| reports | UPDATE | auth.uid() = reporter_id |
| reports | DELETE | auth.uid() = reporter_id |
| flags | INSERT | auth.uid() = flagger_id |

### Database Functions

#### `search_guests(query TEXT)`
- Fuzzy search cez `pg_trgm` extension
- Vracia: id, full_name, email, similarity_score
- Limit 20, ordered by similarity DESC
- Matchuje: `full_name % query` OR `email = query`

#### `handle_new_user()` (trigger)
- AFTER INSERT ON auth.users
- Auto-creates profile s full_name z metadata alebo email prefix

#### `increment_counter()` (RPC, may not exist)
- Volané v reports POST, s fallbackom na manual update

### ⚠️ DB Poznámky
- `reports.platform` CHECK constraint má lowercase hodnoty (airbnb, booking), ale frontend posiela CamelCase (Airbnb, Booking). **Potenciálny bug** — INSERT by mal zlyhať na CHECK constraint ak nie je case-insensitive.
- `guests` nemá DELETE RLS policy — nikto nemôže mazať hostí cez RLS
- `flags` nemá SELECT policy — flagy sa nedajú čítať (admin panel chýba)

---

## 5. API Endpoints

| Method | Path | Auth | Popis |
|--------|------|------|-------|
| POST | `/api/reports` | ✅ Required | Vytvorenie reportu (guest upsert + report insert) |
| GET | `/api/reports/[id]` | ✅ Own only | Načítanie reportu pre editáciu |
| PUT | `/api/reports/[id]` | ✅ Own only | Update reportu |
| DELETE | `/api/reports/[id]` | ✅ Own only | Zmazanie reportu + decrement count |
| GET | `/api/guests/search?q=` | ✅ Required | Fuzzy search (RPC search_guests) |
| GET | `/api/guests/[id]` | ✅ Required | Guest detail + all reports (anonymized) |
| GET | `/api/dashboard` | ✅ Required | User stats + recent reports |
| POST | `/api/flags` | ✅ Required | Flag report as false |
| GET | `/api/profile` | ✅ Required | Get own profile |
| PUT | `/api/profile` | ✅ Required | Update own profile |
| GET | `/auth/callback` | Public | OAuth code exchange + redirect |

### API Notes
- Všetky API routes používajú `createClient(server)` s cookie-based auth
- Validácia je v každom route (server-side)
- Error handling konzistentný: `{ error: string }` + HTTP status code
- Guest upsert logic: ak email match → existing guest, ak nie → nový guest

---

## 6. Components Inventory

### Layout Components
| Component | Path | Reusable | Props |
|-----------|------|----------|-------|
| Navbar | `components/layout/Navbar.tsx` | ✅ Global | — (uses useAuthContext) |
| Footer | `components/layout/Footer.tsx` | ✅ Global | — |
| ErrorBoundary | `components/layout/ErrorBoundary.tsx` | ✅ Global | children |

### Search Components
| Component | Path | Reusable | Props |
|-----------|------|----------|-------|
| SearchBar | `components/search/SearchBar.tsx` | ✅ | value, onChange, isLoading |
| GuestCard | `components/search/GuestCard.tsx` | ✅ | guest: Guest |
| GuestList | `components/search/GuestList.tsx` | ✅ | guests, isLoading, query, hasSearched |

### UI Components (shadcn/ui)
| Component | Typ | Poznámka |
|-----------|-----|----------|
| alert | shadcn | Alert + AlertDescription |
| badge | shadcn | Variant: outline + custom colors |
| button | shadcn | Variants: default, outline, ghost, secondary, destructive |
| card | shadcn | Card + CardContent + CardHeader + CardTitle + CardDescription + CardFooter |
| dialog | shadcn | Radix Dialog |
| input | shadcn | Standard input |
| label | shadcn | Radix Label |
| select | shadcn | Radix Select (full dropdown) |
| sheet | shadcn | Radix Sheet (mobile menu) |
| textarea | shadcn | Standard textarea |
| toast | **CUSTOM** | Global singleton, `toast(type, message)` function |

### Hooks
| Hook | Path | Popis |
|------|------|-------|
| useAuth | `lib/hooks/use-auth.ts` | Auth state + signIn/signUp/signOut + profile |
| useDebounce | `lib/hooks/use-debounce.ts` | Generic debounce for search |

### Inline Components (not extracted)
- `SeverityDots` — duplicated v dashboard aj guest detail
- `ReportCard` — len v guest/[id]/page.tsx
- `DashboardSkeleton` — inline v dashboard
- `LoginForm` — inline v login

---

## 7. Auth System

### Architektúra
```
Supabase Auth (hosted) → @supabase/ssr
  → createBrowserClient (client-side)
  → createServerClient (server-side, cookie-based)
```

### Auth Flow
1. **Registration:** `/register` → `signUp(email, password, fullName)` → Supabase Auth → trigger `handle_new_user()` → profile created
2. **Login:** `/login` → `signInWithPassword(email, password)` → session cookie set
3. **Session refresh:** `middleware.ts` (⚠️ broken, viď proxy.ts issue) → `supabase.auth.getUser()`
4. **Route protection:**
   - Server-side: middleware checks protected paths → redirect to `/login`
   - Client-side fallback: `useAuthContext()` check v každej page
5. **OAuth callback:** `/auth/callback` → `exchangeCodeForSession(code)` → redirect to dashboard

### Protected Routes (middleware config)
- `/dashboard`, `/search`, `/report/*`, `/settings` → vyžadujú auth
- `/login`, `/register` → redirect na `/dashboard` ak je user prihlásený

### Auth Provider Hierarchy
```
RootLayout → AuthProvider → useAuth() → AuthContext
  → All pages use useAuthContext()
```

### Čo chýba pre Google/Facebook OAuth
1. Supabase Dashboard: enable Google + Facebook providers
2. Frontend: pridať OAuth buttons na login/register pages
3. `supabase.auth.signInWithOAuth({ provider: 'google' })` / `'facebook'`
4. Callback handler **už existuje** (`/auth/callback/route.ts`)
5. Environment variables: `NEXT_PUBLIC_SUPABASE_URL` a `NEXT_PUBLIC_SUPABASE_ANON_KEY` sú jedine čo treba

---

## 8. i18n Setup

### Aktuálny stav: ❌ NEIMPLEMENTOVANÉ

- **Žiadna i18n knižnica** v package.json
- **Žiadne locale routing** v next.config.ts
- **Všetky texty sú hardcoded v angličtine** v JSX
- `html lang="en"` v layout.tsx
- sw.js referencuje `[locale]` routing — artefakt z predchádzajúceho pokusu, neaktuálne

### Plán pre implementáciu (Default Slovak)
1. Inštalácia `next-intl`
2. Konfigurácia v `next.config.ts` (defaultLocale: 'sk', locales: ['sk', 'en'])
3. Vytvorenie `messages/sk.json` a `messages/en.json`
4. Wrapping layout do `NextIntlClientProvider`
5. Zmena `html lang` na dynamickú
6. Migrácia všetkých hardcoded stringov do translation keys
7. **Rozsah:** ~200+ hardcoded stringov naprieč 12 stránkami a komponentami

### Kľúčové súbory na zmenu
- `src/app/layout.tsx` — provider, lang attribute
- `next.config.ts` — i18n config
- Všetky `page.tsx` a component files — string extraction
- `src/lib/constants.ts` — incident types, platforms, severity labels

---

## 9. Key Files Reference

### Core
| Súbor | Účel | Dôležitosť |
|-------|------|------------|
| `src/app/layout.tsx` | Root layout, providers, fonts | 🔴 Critical |
| `src/app/providers.tsx` | AuthContext wrapper | 🔴 Critical |
| `src/lib/supabase/client.ts` | Browser Supabase client | 🔴 Critical |
| `src/lib/supabase/server.ts` | Server Supabase client | 🔴 Critical |
| `src/lib/supabase/middleware.ts` | Session refresh + route guards | 🔴 Critical |
| `src/proxy.ts` | ⚠️ Broken middleware export | 🔴 Fix needed |
| `src/lib/constants.ts` | Incident types, platforms, severity | 🟡 Shared |
| `next.config.ts` | Empty config | 🟡 Will need i18n, PWA |

### Pages
| Súbor | Účel |
|-------|------|
| `src/app/page.tsx` | Public landing |
| `src/app/login/page.tsx` | Login form |
| `src/app/register/page.tsx` | Registration form |
| `src/app/dashboard/page.tsx` | Main dashboard |
| `src/app/search/page.tsx` | Guest search |
| `src/app/guest/[id]/page.tsx` | Guest detail (largest page, ~400 lines) |
| `src/app/report/new/page.tsx` | Create report form |
| `src/app/report/[id]/edit/page.tsx` | Edit/delete report form |
| `src/app/settings/page.tsx` | Profile settings |

### Database
| Súbor | Účel |
|-------|------|
| `supabase/migrations/001_initial_schema.sql` | Tables, RLS, trigger |
| `supabase/migrations/002_search_functions.sql` | pg_trgm + search function |

---

## 10. Integration Points

### Kde pripojiť nové features

#### OCR Photo Upload
- **Report form:** `src/app/report/new/page.tsx` — pridať photo upload field pred/po Guest Information section
- **API:** Nový endpoint `POST /api/ocr` alebo rozšíriť `POST /api/reports` o multipart/form-data
- **DB:** Nová tabuľka `report_photos` (report_id, url, extracted_text) alebo stĺpce v `reports`
- **Storage:** Supabase Storage bucket pre fotky
- **Dependencies:** `tesseract.js` (client-side OCR) alebo Supabase Edge Function + cloud OCR
- **Komplikácia:** Aktuálne API routes prijímajú JSON, nie FormData

#### Default Slovak Language
- **Config:** `next.config.ts` + `src/i18n.ts` (nový)
- **Layout:** `src/app/layout.tsx` — NextIntlClientProvider
- **Messages:** `messages/sk.json`, `messages/en.json` (nový adresár)
- **Routing:** Zmena folder structure na `src/app/[locale]/...` ALEBO middleware-based
- **Komplikácia:** Potrebuje refactor všetkých pages (string extraction), sw.js re-generácia

#### Facebook Integration
- **Login pages:** `src/app/login/page.tsx` + `src/app/register/page.tsx` — OAuth buttons
- **Supabase:** Enable Facebook provider v dashboard
- **Callback:** `/auth/callback/route.ts` už existuje, univerzálny
- **Komplikácia:** Facebook App Review process, Privacy Policy URL needed

#### Google OAuth
- **Rovnaký pattern ako Facebook** — len iný provider
- **Login pages:** OAuth buttons vedľa Facebook
- **Supabase:** Enable Google provider
- **Komplikácia:** Google Cloud Console setup, redirect URIs

#### Moderný GUI Redesign
- **Všetky pages** — hlavne landing (`page.tsx`), dashboard, search
- **Components:** `components/layout/Navbar.tsx` — nový design
- **Theme:** `src/app/globals.css` — color scheme, spacing
- **shadcn:** Môžu sa pridať: tabs, avatar, dropdown-menu, progress, skeleton
- **Komplikácia:** Dark mode toggle chýba, CSS vars sú ready ale nepoužívané

#### Rozšírené Štatistiky
- **Dashboard:** `src/app/dashboard/page.tsx` — rozšíriť stats section
- **API:** `GET /api/dashboard` — pridať aggregate queries (reports by type, by month, severity distribution)
- **Nová page:** `/stats` alebo `/dashboard/stats`
- **Charts:** Potrebná knižnica (recharts, chart.js)
- **DB:** Žiadne nové tabuľky, len aggregate queries nad existujúcimi

#### PWA Support (doplnenie)
- **sw.js:** Treba re-generovať — aktuálny je stale, referencuje neexistujúce `[locale]` routes
- **manifest.json:** Existuje v public, treba overiť obsah + link v layout.tsx
- **next.config.ts:** Pridať next-pwa plugin ALEBO Serwist
- **Layout:** `<link rel="manifest">` v `<head>`
- **Komplikácia:** sw.js je statický workbox output, nie dynamicky generovaný

---

## Playbook Warnings

PLAYBOOK.md je zatiaľ prázdny (žiadne aktívne anti-patterns). Ale zo skenu:

### Identifikované riziká
1. **proxy.ts namiesto middleware.ts** — route protection nefunguje server-side
2. **Platform case mismatch** — frontend posiela "Airbnb", DB CHECK constraint má "airbnb"
3. **SeverityDots duplicated** — rovnaký komponent v dashboard aj guest detail
4. **Všetky pages sú "use client"** — žiadne SSR/SSG, zbytočne veľký JS bundle
5. **sw.js stale** — references `[locale]` routing čo neexistuje
6. **Žiadna rate limiting** na API routes
7. **guests.notes** stĺpec existuje v DB ale nie je nikde v UI použitý

---

## Odporúčania pre implementáciu

### Priority poradie
1. **Fix middleware** — `proxy.ts` → `middleware.ts` (5 min, critical security)
2. **Fix platform case mismatch** — buď DB alebo frontend (10 min)
3. **Extract SeverityDots** do shared component (5 min)
4. **Google OAuth** — najmenší effort, callback ready (1-2h)
5. **Facebook OAuth** — rovnaký pattern, ale Facebook review process (1-2h code + days for review)
6. **Default Slovak** — veľký refactor, ~200 stringov (4-8h)
7. **GUI Redesign** — závisí od scope, minimal 8h
8. **OCR Photo Upload** — nový feature, storage + OCR (4-6h)
9. **Rozšírené Štatistiky** — charts + aggregate queries (3-5h)
10. **PWA** — re-generácia sw.js, manifest link (2-3h)
