# PRD — Host Blacklist

## 1. Problem

Ubytovatelia (Airbnb, Booking, vlastné apartmány) nemajú spoľahlivý spôsob, ako zistiť, či potenciálny hosť má históriu problémov u iných ubytovateľov. Poškodený majetok, krádeže, rušenie nočného kľudu, podvody s platbami. Platformy ako Airbnb zobrazujú len pozitívne hodnotenia a nevarujú hostiteľov pred problémovými hosťami.

## 2. User

**Primárny:** Ubytovateľ (property manager, Airbnb/Booking host, vlastník apartmánu).
Spravuje 1-50+ nehnuteľností. Prijíma rezervácie od neznámych hostí. Potrebuje rýchly spôsob overiť hosťa pred potvrdením rezervácie.

## 3. Solution

Webová platforma, kde ubytovatelia zdieľajú a vyhľadávajú záznamy o problémových hosťoch. Komunita-driven databáza s overenými ubytovateľmi.

## 4. Aha Moment (60 sekúnd)

1. Ubytovateľ dostane rezerváciu od "Jan Novák" (email: jan.novak@email.com)
2. Otvorí Host Blacklist, zadá meno alebo email
3. Okamžite vidí: 2 záznamy od iných ubytovateľov, "poškodenie nábytku", "neoprávnení hostia"
4. Rozhodne sa rezerváciu odmietnuť

**Čas do hodnoty:** <60 sekúnd od prihlásenia.

## 5. User Stories (MVP)

| # | Story | Priority |
|---|-------|----------|
| US-1 | Ako ubytovateľ sa chcem zaregistrovať a prihlásiť, aby som mohol používať platformu | MUST |
| US-2 | Ako ubytovateľ chcem vyhľadať hosťa podľa mena alebo emailu, aby som zistil, či má záznamy | MUST |
| US-3 | Ako ubytovateľ chcem pridať záznam o problémovom hosťovi s popisom incidentu | MUST |
| US-4 | Ako ubytovateľ chcem vidieť detail záznamu vrátane dátumu, typu problému a popisu | MUST |
| US-5 | Ako ubytovateľ chcem spravovať svoje záznamy (editovať, zmazať) | SHOULD |
| US-6 | Ako ubytovateľ chcem vidieť dashboard s mojimi záznamami a poslednými vyhľadávaniami | SHOULD |
| US-7 | Ako ubytovateľ chcem nahlásiť nepravdivý záznam (report/flag) | COULD |

## 6. Data Model (Supabase)

### Tabuľky

#### `profiles`
Rozšírenie Supabase Auth users.

| Stĺpec | Typ | Popis |
|---------|-----|-------|
| id | uuid (PK, FK → auth.users) | User ID |
| full_name | text NOT NULL | Meno ubytovateľa |
| company_name | text | Názov firmy/apartmánu |
| city | text | Mesto |
| country | text | Krajina (ISO 3166-1) |
| properties_count | integer DEFAULT 1 | Počet spravovaných nehnuteľností |
| created_at | timestamptz | Registrácia |
| updated_at | timestamptz | Posledná zmena |

#### `guests`
Centrálna tabuľka hostí. Deduplikácia podľa email (ak je známy).

| Stĺpec | Typ | Popis |
|---------|-----|-------|
| id | uuid (PK) | Guest ID |
| full_name | text NOT NULL | Meno hosťa |
| email | text | Email (nullable, indexed, unique ak nie null) |
| phone | text | Telefón (nullable) |
| notes | text | Poznámka (interná) |
| reports_count | integer DEFAULT 0 | Počet záznamov (denormalizovaný) |
| created_at | timestamptz | Prvý záznam |
| updated_at | timestamptz | Posledná zmena |

**Indexy:** `idx_guests_full_name_trgm` (pg_trgm GIN pre fuzzy search), `idx_guests_email` (btree unique partial WHERE email IS NOT NULL)

#### `reports`
Záznamy o incidentoch.

| Stĺpec | Typ | Popis |
|---------|-----|-------|
| id | uuid (PK) | Report ID |
| guest_id | uuid (FK → guests) | Hosť |
| reporter_id | uuid (FK → profiles) | Kto nahlásil |
| incident_type | text NOT NULL | Typ: damage, theft, noise, fraud, no_show, other |
| incident_date | date | Dátum incidentu |
| severity | integer (1-5) | Závažnosť |
| description | text NOT NULL | Popis incidentu |
| property_name | text | Kde sa to stalo |
| platform | text | Airbnb, Booking, Direct, Other |
| created_at | timestamptz | Vytvorené |
| updated_at | timestamptz | Upravené |

**Constraint:** Jeden reporter môže mať max 1 report na jedného hosťa (unique: guest_id + reporter_id).

#### `flags`
Nahlásenia nepravdivých záznamov.

| Stĺpec | Typ | Popis |
|---------|-----|-------|
| id | uuid (PK) | Flag ID |
| report_id | uuid (FK → reports) | Nahlásený záznam |
| flagger_id | uuid (FK → profiles) | Kto nahlásil |
| reason | text NOT NULL | Dôvod |
| created_at | timestamptz | Vytvorené |

**Constraint:** Unique (report_id, flagger_id).

### Vzťahy
```
profiles 1 ←→ N reports (reporter_id)
guests   1 ←→ N reports (guest_id)
reports  1 ←→ N flags   (report_id)
profiles 1 ←→ N flags   (flagger_id)
```

### RLS (Row Level Security)
- `profiles`: user vidí len svoj profil, môže editovať len svoj
- `guests`: autentifikovaný user vidí všetkých (SELECT), INSERT/UPDATE cez server function
- `reports`: SELECT všetky (autentifikovaný), INSERT vlastné, UPDATE/DELETE len vlastné
- `flags`: INSERT vlastné, SELECT žiadne (admin only)

## 7. Pages (MVP — 5 stránok)

| # | Route | Názov | Popis |
|---|-------|-------|-------|
| 1 | `/` | Landing Page | Hero, value prop, CTA na registráciu. Existuje (TASK-003). |
| 2 | `/dashboard` | Dashboard | Moje záznamy, posledné vyhľadávania, quick search bar |
| 3 | `/search` | Search & Results | Vyhľadávanie hosťa (meno/email), výsledky s kartičkami |
| 4 | `/report/new` + `/report/[id]/edit` | Add/Edit Report | Formulár na pridanie/editáciu záznamu |
| 5 | `/settings` | Settings | Profil, zmena hesla, email preferences |

**Auth pages** (Supabase UI kit, nepočítajú sa ako stránky):
- `/login`, `/register`, `/forgot-password`

## 8. API Endpoints

Všetky cez Next.js API routes (`/api/...`), autentifikácia cez Supabase JWT.

| Method | Endpoint | Popis |
|--------|----------|-------|
| GET | `/api/guests/search?q=` | Fuzzy search podľa mena/emailu |
| GET | `/api/guests/[id]` | Detail hosťa + jeho reports |
| POST | `/api/reports` | Vytvoriť nový report (+ upsert guest) |
| PUT | `/api/reports/[id]` | Editovať vlastný report |
| DELETE | `/api/reports/[id]` | Zmazať vlastný report |
| POST | `/api/flags` | Nahlásiť nepravdivý report |
| GET | `/api/dashboard` | Dashboard data (moje reports, stats) |
| GET | `/api/profile` | Môj profil |
| PUT | `/api/profile` | Aktualizovať profil |

## 9. Tech Stack

| Vrstva | Technológia | Dôvod |
|--------|-------------|-------|
| Frontend | Next.js 14+ (App Router) | SSR, API routes, deployment na Vercel |
| Styling | Tailwind CSS + shadcn/ui | Rýchly vývoj, konzistentný design |
| Auth | Supabase Auth | Email/password, JWT, session management |
| Database | Supabase PostgreSQL | RLS, pg_trgm pre fuzzy search, realtime |
| Search | PostgreSQL pg_trgm | Trigram similarity pre fuzzy matching mien |
| Hosting | Vercel | Zero-config deploy pre Next.js |
| Payments | Stripe (BUDÚCNOSŤ) | Nie je v MVP, pripravená integrácia neskôr |

## 10. Anti-Scope (explicitne MIMO MVP)

- **Platobné brány / Stripe** — žiadne platby v MVP, všetko je free
- **OTA integrácie** — žiadne priame API na Airbnb/Booking
- **Mobilná aplikácia** — len responsive web
- **Automatické vybavovanie reklamácií** — manuálne cez flags
- **Admin panel** — admin operácie cez Supabase dashboard
- **Email notifikácie** — žiadne emaily okrem auth (registrácia, reset hesla)
- **Guest dispute/appeal proces** — hosť sa nemôže brániť (v1)
- **Bulk import hostí** — manuálne po jednom
- **Verifikácia ubytovateľov** — registrácia bez overenia (v1)
- **Multi-language** — len angličtina (v1)

## 11. Success Metrics (post-launch)

| Metrika | Cieľ (30 dní) |
|---------|----------------|
| Registrácie | 50+ |
| Reports vytvorené | 100+ |
| Searches vykonané | 500+ |
| DAU / MAU ratio | >20% |
| Avg. time to first search | <60s |
