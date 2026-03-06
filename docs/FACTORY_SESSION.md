# FACTORY_SESSION — Host Blacklist

## A. Project Brief
**Názov:** Host Blacklist SaaS  
**Cieľ:** Platforma pre zdieľanie čiernej listiny nevhodných hostí medzi ubytovateľmi  
**Problém:** Hostitelia nemajú spoľahlivý spôsob, ako zistiť, či hosť má históriu problémov  
**Aha moment:** Užívateľ zadá meno/email hosťa a okamžite vidí hodnotenia od iných hostiteľov  
**Anti-scope:** Platobné brány, OTA integrácie, mobilná appka  

**Trello Board:** https://trello.com/b/CssVD6Pz/new-saas  
**Board ID:** 69a96646d0161b280d84f2af  
**GitHub:** https://github.com/VladoAdmin/host-blacklist  
**Projekt path:** /home/clawd/Projects/host-blacklist/  
**Tech Stack:** Next.js 14 (App Router) + Supabase + Tailwind + shadcn/ui + Vercel  

## B. Decision Log
| Dátum | Rozhodnutie | Dôvod | Kto |
|-------|-------------|-------|-----|
| 2026-03-05 | Migrácia na nový board New SaaS | Cistenie backlogu | Františka |
| 2026-03-05 | PRD schválené | Vlado potvrdil | Vlado |
| 2026-03-05 | Factory pipeline v3 | maxSpawnDepth=3, autonómny tím | Vlado/Františka |
| 2026-03-05 | QA review passed | 3 bugy opravené, build clean | Factory Tester |

## C. Sub-Agent Runs
| Task | Agent | Label | Status | Commit/Výstup |
|------|-------|-------|--------|---------------|
| PRD | Architect | architect-host-blacklist | ✅ Done | PRD.md, TASKS.md |
| TASK-004 Auth flow | Coder | coder-TASK-004-v1 | ✅ Done | bf5cba1, 5c7c625 |
| TASK-005 Profile/settings | Coder | coder-TASK-005 | ✅ Done | 4019cf1 |
| TASK-006 DB search functions | Coder | coder-TASK-006 | ✅ Done | 56ca3aa, 4019cf1 |
| TASK-007 Search UI | Coder | coder-TASK-007 | ✅ Done | 4019cf1 |
| QA Review | Tester+Coder | factory-orch-qa-test | ✅ Done | 6dc04b2 (3 bugy opravené) |
| TASK-008 Guest detail | Coder | coder-TASK-008-v1 | ✅ Done | ef7456e |
| TASK-013 Layout/nav | Coder | coder-TASK-013-v1 | ✅ Done | d00bc41 |
| TASK-012 Flag report | Coder | coder-TASK-012-v1 | ✅ Done | a7f8ffb |
| TASK-009 Add Report | Coder | coder-TASK-009-v1 | ✅ Done | 8da440f |
| TASK-010 Edit/Delete | Coder | coder-TASK-010-v1 | ✅ Done | e132c2f |
| TASK-011 Dashboard | Coder | coder-TASK-011-v1 | ✅ Done | 4174ba1 |
| TASK-014 Vercel deploy | Coder | coder-TASK-014-v1 | ✅ Done | host-blacklist.vercel.app |
| TASK-015 E2E QA | Tester | tester-TASK-015-v1 | ✅ PASS WITH NOTES | 1 ESLint fix (c10ff03) |

## D. Escalations
| Z | Na | Dôvod | Výsledok |
|---|-----|-------|----------|
| — | — | — | — |

## E. Active Phase
**Fáza:** BUILD — Core Sprint (pokračovanie)  
**Status:** DONE  
**Aktívny task:** DONE — všetky tasky dokončené  
**Zostávajúce:** TASK-008 → TASK-015 (8 taskov)  
**Next Gate:** QA_GATE (po TASK-013)  
**Gate status:** await  

**Dependency chain:**
- TASK-008 (Guest detail) → závisí na TASK-007 ✅
- TASK-009 (Add Report) + TASK-012 (Flag) → paralelne po TASK-008
- TASK-010 (Edit/Delete) → po TASK-009
- TASK-011 (Dashboard) → po TASK-010
- TASK-013 (Layout/nav) → paralelne s TASK-005 ✅
- TASK-014 (Deploy) → po TASK-011 + TASK-013
- TASK-015 (E2E test) → po TASK-014

## F. Current Gate
**Gate:** N/A (v Build Sprint)  

## G. Gate Decisions Log
| Gate | Rozhodnutie | Poznámka | Dátum |
|------|-------------|----------|-------|
| PRD_APPROVAL | APPROVED | Vlado schválil | 2026-03-05 13:00 |

## H. Final Delivery (v1)
**Status:** DONE
**URL:** https://host-blacklist.vercel.app
**Final Commit:** c10ff03

---

## I. ITERATE MODE — Host Blacklist v2
**Status:** IN_PROGRESS
**Spawned:** 2026-03-06
**Scope:** 7 nových/zmenových bodov

### I.1 Delta Features (zadanie od Vlada)
1. **OCR Photo Upload** — upload fotky rezervácie → OCR extrahuje meno, email, dátumy
2. **Default Slovak Language** — zmena z EN na SK default, EN ako fallback
3. **Facebook Integration** — postovanie nových záznamov do FB Group/Page
4. **Moderný GUI Redesign** — Linear/Notion/Vercel štýl, čistý, profesionálny
5. **Rozšírené Štatistiky** — dashboard: last global record, počty (dnes/týždeň/mesiac/rok), top reportéri, trend graf
6. **PWA Support** — manifest, service worker, icons (192x192, 512x512)
7. **Google OAuth** — prihlásenie cez Google účet

### I.2 Critical Bugs Found by Scanner
- **BUG-001:** `src/proxy.ts` namiesto `middleware.ts` — route protection nefunguje server-side
- **BUG-002:** Platform case mismatch — frontend "Airbnb" vs DB CHECK "airbnb"
- **BUG-003:** sw.js stale — referencuje neexistujúce `[locale]` routes

### I.3 Sub-Agent Runs (v2)
| Task | Agent | Label | Status | Commit/Výstup |
|------|-------|-------|--------|---------------|
| PROJECT_SNAPSHOT | Scanner | scanner-host-blacklist-v2 | ✅ Done | PROJECT_SNAPSHOT.md |
| TASK-101 Google OAuth | Coder | coder-TASK-101-v1 | ✅ Done | commit 3e6699e |
| TASK-102 Facebook Integration | Coder | coder-TASK-102-v1 | ✅ Done | commit ccb68a9 |
| TASK-103 i18n Default SK | Coder | coder-TASK-103-v1 | 🔄 In Progress | runId: 3d59a77a-e997-47c2-ba0f-6fd8b51835f5 |

### I.4 Current Gate
**Gate:** DELTA_APPROVAL — ✅ SCHVÁLENÉ 2026-03-06
**Rozhodnutie:** APPROVED
**Poznámka:** Vlado schválil všetkých 7 delta features + 3 bugfixy. Postupovať podľa plánu fáz.

### I.5 Next Steps
1. ✅ Schválenie DELTA_TASKS.md (Františka/Vlado) — DONE
2. ✅ Bugfix sprint (BUG-001, BUG-002, BUG-003) — DONE (commits b52d3ec, a1bd990, 6f0a7e7)
3. 🔄 Build sprint — delta features — IN PROGRESS
   - ✅ TASK-101: Google OAuth — DONE (commit 3e6699e)
   - 🔄 TASK-102: Facebook Integration — IN PROGRESS (Factory Coder spawned)
   - ⏳ TASK-103: i18n Default SK
   - ⏳ TASK-104: PWA Full Support
   - ⏳ TASK-105: OCR Photo Upload
   - ⏳ TASK-106: Rozšírené Štatistiky
   - ⏳ TASK-107: Moderný GUI Redesign
4. ⏳ E2E + Deploy  
**URL:** https://host-blacklist.vercel.app  
**Final Commit:** c10ff03  
**QA Result:** PASS WITH NOTES  

### Delivered Features:
- ✅ Landing page (public)
- ✅ Auth flow (register, login, logout)
- ✅ Profile settings
- ✅ Fuzzy search (pg_trgm)
- ✅ Search UI with debounced input
- ✅ Guest detail view with reports listing
- ✅ Add Report form + API (guest upsert)
- ✅ Edit/Delete own reports
- ✅ Dashboard (stats, recent reports, quick search)
- ✅ Flag report (nahlásenie nepravdivého záznamu)
- ✅ Shared layout, navigation, responsive design
- ✅ Vercel production deploy
- ✅ E2E smoke test passed

### Known TODO:
- ⚠️ Supabase Auth redirect URLs: pridať `https://host-blacklist.vercel.app/**` do Supabase Dashboard → Authentication → URL Configuration → Redirect URLs
- 💡 Rate limiting, CAPTCHA, email verification (post-MVP)

### Git Log (TASK-008 → TASK-015):
| Commit | Message |
|--------|---------|
| c10ff03 | fix: ESLint prefer-const + FACTORY_SESSION update |
| 4174ba1 | feat: TASK-011 dashboard |
| e132c2f | feat: TASK-010 edit and delete own reports |
| 8da440f | feat: TASK-009 add report form and API |
| a7f8ffb | feat: TASK-012 flag report functionality |
| d00bc41 | feat: TASK-013 shared layout, navigation, responsive |
| ef7456e | feat: TASK-008 guest detail view with reports listing |

---
*Aktualizované: 2026-03-05 19:25 UTC*
