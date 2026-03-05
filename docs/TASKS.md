# TASKS.md — Host Blacklist MVP

## Completed Tasks

| Task | Názov | Status |
|------|-------|--------|
| TASK-001 | Projekt scaffolding (Next.js + Supabase init) | ✅ Done |
| TASK-002 | Supabase schema (tabuľky, RLS) | ✅ Done |
| TASK-003 | Landing page | ✅ Done |

---

## Phase 1: Setup (Foundation)

### TASK-004: Auth flow (registrácia, login, logout)
**Odhad:** 1.5h  
**Dependencies:** TASK-001, TASK-002  
**Popis:** Implementovať kompletný auth flow pomocou Supabase Auth.  
**Acceptance Criteria:**
- [ ] Registrácia cez email/password funguje
- [ ] Login/logout flow funguje
- [ ] Po registrácii sa vytvorí profil v `profiles` tabuľke (trigger alebo on-signup hook)
- [ ] Protected routes redirectujú na `/login` ak user nie je prihlásený
- [ ] Auth context/provider je dostupný v celej app
- [ ] Middleware chráni `/dashboard`, `/search`, `/report/*`, `/settings`

### TASK-005: Profil a settings stránka
**Odhad:** 1h  
**Dependencies:** TASK-004  
**Popis:** Stránka `/settings` kde user môže upraviť svoj profil.  
**Acceptance Criteria:**
- [ ] Formulár: full_name, company_name, city, country, properties_count
- [ ] Ukladá sa do `profiles` tabuľky
- [ ] Validácia (full_name je povinné)
- [ ] Success/error toast notifikácie
- [ ] Stránka je prístupná len prihláseným userom

---

## Phase 2: Core (Hlavná funkcionalita)

### TASK-006: Database functions pre fuzzy search
**Odhad:** 1h  
**Dependencies:** TASK-002  
**Popis:** PostgreSQL funkcie pre vyhľadávanie hostí cez pg_trgm.  
**Acceptance Criteria:**
- [ ] Extension `pg_trgm` je zapnutý v Supabase
- [ ] SQL function `search_guests(query text)` vracia guests s `similarity()` score
- [ ] Vyhľadávanie funguje podľa mena aj emailu
- [ ] Výsledky sú zoradené podľa relevantnosti (similarity DESC)
- [ ] Threshold na similarity je nastavený na 0.2 (loose match pre MVP)
- [ ] Function je callable cez Supabase RPC

### TASK-007: Search stránka (UI + API)
**Odhad:** 2h  
**Dependencies:** TASK-004, TASK-006  
**Popis:** Hlavná search stránka `/search` - srdce celej aplikácie.  
**Acceptance Criteria:**
- [ ] Search bar s debounced input (300ms)
- [ ] API route `GET /api/guests/search?q=` volá Supabase RPC funkciu
- [ ] Výsledky zobrazené ako karty: meno, email (maskovaný), počet reportov, severity
- [ ] Prázdny stav ak žiadne výsledky
- [ ] Loading stav počas vyhľadávania
- [ ] Kliknutím na výsledok sa zobrazí detail hosťa s jeho reportmi (inline alebo modal)
- [ ] Stránka je prístupná len prihláseným userom

### TASK-008: Guest detail view (reports listing)
**Odhad:** 1h  
**Dependencies:** TASK-007  
**Popis:** Detail view hosťa so všetkými jeho reportmi.  
**Acceptance Criteria:**
- [ ] API route `GET /api/guests/[id]` vracia hosťa + jeho reports (joined)
- [ ] UI zobrazuje: meno, email (maskovaný), počet reportov
- [ ] Zoznam reportov: incident_type badge, dátum, severity (stars/dots), popis, reporter (anonymizovaný), platforma
- [ ] Zoradené od najnovšieho
- [ ] Ak hosť nemá žiadne reporty: "No reports found"

### TASK-009: Add Report formulár + API
**Odhad:** 2h  
**Dependencies:** TASK-004, TASK-006  
**Popis:** Formulár na pridanie nového reportu o hosťovi.  
**Acceptance Criteria:**
- [ ] Stránka `/report/new` s formulárom
- [ ] Polia: guest_name, guest_email (optional), guest_phone (optional), incident_type (select), incident_date, severity (1-5 slider/select), description (textarea), property_name, platform (select)
- [ ] API route `POST /api/reports`: upsert guest (ak email match), create report
- [ ] Guest upsert logika: ak existuje guest s rovnakým emailom, pripoj report k nemu. Ak nie, vytvor nového.
- [ ] Validácia: guest_name, incident_type, description sú povinné
- [ ] Po úspešnom uložení redirect na detail hosťa
- [ ] Constraint: max 1 report per guest per reporter

### TASK-010: Edit/Delete vlastného reportu
**Odhad:** 1h  
**Dependencies:** TASK-009  
**Popis:** Editácia a mazanie vlastných reportov.  
**Acceptance Criteria:**
- [ ] Stránka `/report/[id]/edit` s predvyplneným formulárom
- [ ] API route `PUT /api/reports/[id]` — len vlastné reporty (RLS)
- [ ] API route `DELETE /api/reports/[id]` — len vlastné reporty (RLS)
- [ ] Delete s konfirmačným dialogom
- [ ] Po editácii/zmazaní redirect na dashboard
- [ ] Ak user nie je vlastník reportu: 403

---

## Phase 3: Polish (UX + doplnky)

### TASK-011: Dashboard stránka
**Odhad:** 1.5h  
**Dependencies:** TASK-009  
**Popis:** Dashboard `/dashboard` ako hlavná stránka po prihlásení.  
**Acceptance Criteria:**
- [ ] API route `GET /api/dashboard` vracia: moje reporty, celkový počet guests v DB, moje stats
- [ ] UI: quick search bar (rovnaký ako na /search), moje posledné reporty (max 10), stats karty (moje reports, celkovo guests)
- [ ] Kliknutie na report → detail hosťa
- [ ] Kliknutie na "Add Report" → `/report/new`
- [ ] Responsive layout (mobile-friendly)

### TASK-012: Flag report (nahlásenie nepravdivého záznamu)
**Odhad:** 1h  
**Dependencies:** TASK-008  
**Popis:** Možnosť nahlásiť report ako nepravdivý/neférový.  
**Acceptance Criteria:**
- [ ] Tlačidlo "Report as false" na každom cudzom reporte (nie na vlastných)
- [ ] Modal s dôvodom (textarea, povinné)
- [ ] API route `POST /api/flags`: vytvorí flag
- [ ] Constraint: max 1 flag per report per user
- [ ] Success toast: "Thank you, we'll review this report"
- [ ] Flagy sú viditeľné len v Supabase dashboard (admin)

### TASK-013: Layout, navigation, responsive design
**Odhad:** 1.5h  
**Dependencies:** TASK-004  
**Popis:** Hlavný layout s navigáciou, konzistentný design.  
**Acceptance Criteria:**
- [ ] Shared layout s navbar: logo, Search, Dashboard, Add Report, Settings, Logout
- [ ] Mobile: hamburger menu
- [ ] Active link highlighting
- [ ] Footer s copyright
- [ ] Loading states (skeleton screens)
- [ ] Error boundary s user-friendly message
- [ ] Konzistentné spacing, typography (Tailwind + shadcn/ui)

---

## Phase 4: Deploy

### TASK-014: Vercel deploy + environment setup
**Odhad:** 1h  
**Dependencies:** TASK-011, TASK-013  
**Popis:** Deploy na Vercel s production environment.  
**Acceptance Criteria:**
- [ ] Projekt je pushnutý na GitHub
- [ ] Vercel projekt vytvorený a prepojený s GitHub repom
- [ ] Environment variables nastavené (SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY)
- [ ] Build prebehne bez errorov
- [ ] Production URL funguje (HTTPS)
- [ ] Auth flow funguje na production (Supabase redirect URLs nakonfigurované)

### TASK-015: E2E smoke test + final QA
**Odhad:** 1.5h  
**Dependencies:** TASK-014  
**Popis:** End-to-end test celého flow na production.  
**Acceptance Criteria:**
- [ ] Registrácia nového usera funguje
- [ ] Login/logout funguje
- [ ] Vyhľadávanie hosťa funguje (aj keď DB je prázdna: správny empty state)
- [ ] Pridanie reportu funguje (vytvorí sa guest + report)
- [ ] Editácia reportu funguje
- [ ] Delete reportu funguje
- [ ] Flag reportu funguje
- [ ] Dashboard zobrazuje správne dáta
- [ ] Settings stránka ukladá profil
- [ ] Mobile responsive funguje (Chrome DevTools)
- [ ] Žiadne console errory
- [ ] Lighthouse score >80 (Performance, Accessibility)

---

## Dependency Graph

```
TASK-001 (Done) ─┐
TASK-002 (Done) ─┤
TASK-003 (Done) ─┘
                  │
            TASK-004 (Auth)
           ┌──────┼──────────┐
     TASK-005  TASK-006   TASK-013
     (Profile) (DB funcs) (Layout)
               │
         TASK-007 (Search)
               │
         TASK-008 (Guest detail)
           │         │
     TASK-009     TASK-012
     (Add Report) (Flag)
           │
     TASK-010 (Edit/Delete)
           │
     TASK-011 (Dashboard)
           │
     TASK-014 (Deploy)
           │
     TASK-015 (E2E test)
```

## Parallelization Notes

- **TASK-005, TASK-006, TASK-013** môžu bežať paralelne (všetky závisia len na TASK-004)
- **TASK-007** závisí na TASK-006 (DB funkcie pre search)
- **TASK-009** a **TASK-012** môžu bežať paralelne (oba závisia na TASK-008)
- **Critical path:** 004 → 006 → 007 → 008 → 009 → 010 → 011 → 014 → 015

## Time Estimate

| Fáza | Tasky | Odhad |
|------|-------|-------|
| Setup | TASK-004, TASK-005 | 2.5h |
| Core | TASK-006 až TASK-010 | 7h |
| Polish | TASK-011 až TASK-013 | 4h |
| Deploy | TASK-014, TASK-015 | 2.5h |
| **Celkom** | **12 taskov** | **~16h** |

Pri paralelizácii (Factory pipeline) reálne: **~10-12h elapsed time**.
