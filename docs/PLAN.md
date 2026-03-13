# PLAN.md — HTB Backlog Tasks

**Project:** Host Blacklist (HTB03)  
**Tasks:** HTB-012, HTB-014  
**Created:** 2026-03-13  
**Status:** READY FOR IMPLEMENTATION

---

## Task Overview

### HTB-012: Duplikát detekcia (vylepšenie)
**Priority:** Medium  
**Estimate:** 4-5h

**Requirements:**
- Vylepšená duplikát detekcia pri vytváraní nového záznamu
- Fuzzy match na meno (Levenshtein distance alebo trigram similarity)
- Exact match na email a telefón
- Zobrazenie existujúcich záznamov pri vytváraní (modal/alert)
- Používateľ môže pokračovať aj napriek nájdeným duplikátom

**Technical approach:**
- Použiť `pg_trgm` extension v Supabase (už je nainštalovaný)
- SQL: `SELECT * FROM black_list WHERE similarity(full_name, $1) > 0.6 OR email = $2 OR phone = $3`
- Nový API endpoint: `POST /api/guests/check-duplicates`
- Frontend: Modal pri submit formulára, ak sú nájdené duplikáty

**Acceptance criteria:**
- [ ] Pri vytváraní záznamu sa kontrolujú duplikáty
- [ ] Fuzzy match na meno funguje (test: "Jan Novak" ~ "Ján Novák")
- [ ] Exact match na email/telefón
- [ ] Zobrazenie nájdených duplikátov v UI
- [ ] Používateľ môže pokračovať aj s duplikátom

---

### HTB-014: E2E Testing
**Priority:** High  
**Estimate:** 6-8h

**Requirements:**
- Playwright E2E testy pre kritické user flows
- Testy musia bežať proti lokálnemu aj produkčnému prostrediu

**Test scenarios:**
1. **Registrácia:** Nový používateľ sa vie zaregistrovať
2. **Prihlásenie:** Existujúci používateľ sa vie prihlásiť
3. **Vyhľadanie:** Vyhľadanie hosťa podľa mena
4. **Pridanie záznamu:** Vytvorenie nového blacklist záznamu
5. **Hlasovanie:** Prihlásený používateľ môže hlasovať za report
6. **Chat:** Odoslanie správy v komunite

**Technical approach:**
- Inštalácia Playwright: `npm init playwright@latest`
- Testy v `e2e/` adresári
- Page Object Model pre hlavné stránky
- Test data: použitie testovacieho používateľa (seed v Supabase)
- Config: `playwright.config.ts` s env variables pre base URL

**Acceptance criteria:**
- [ ] Playwright nainštalovaný a nakonfigurovaný
- [ ] Všetky 6 test scenarios implementované
- [ ] Testy prechádzajú lokálne (`npm run test:e2e`)
- [ ] GitHub Actions workflow pre E2E (optional)
- [ ] Test report generovaný

---

## Implementation Order

1. **HTB-012 (Duplikát detekcia)** — 4-5h
   - Backend: SQL query + API endpoint
   - Frontend: Modal component + API integration
   - Test: Manuálne testovanie scenárov

2. **HTB-014 (E2E Testing)** — 6-8h
   - Setup: Playwright inštalácia, config
   - Auth tests: registrácia, prihlásenie
   - Core tests: vyhľadanie, pridanie záznamu
   - Community tests: hlasovanie, chat

**Total estimate:** ~12h

---

## Validation Strategy

### Unit/Integration tests (coder)
- API endpoint pre duplikáty funguje
- Fuzzy match SQL query vracia správne výsledky

### E2E tests (tester after coder)
- Všetky Playwright testy prechádzajú
- Žiadne console errors počas testov
- Screenshot na konci každého testu

---

## Notes

- HTB projekt beží na Next.js + Supabase
- PWA je už nakonfigurovaná (Serwist)
- i18n je nastavené (next-intl)
- Aktuálna URL: https://host-blacklist.vercel.app
