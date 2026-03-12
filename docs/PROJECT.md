# Host Blacklist (Sentinel HostGuard) — PROJECT.md

## Aktuálny stav
- **Fáza:** LIVE + v2 features complete
- **Posledná aktivita:** 2026-03-12
- **URL:** https://host-blacklist.vercel.app
- **GitHub:** https://github.com/VladoAdmin/host-blacklist

## Čo je hotové ✅

### MVP (v1)
- Landing page, Auth flow (email/password), Profile/settings
- Fuzzy search (pg_trgm), Search UI, Guest detail view
- Add/Edit/Delete report, Dashboard, Flag report
- Layout, navigation, responsive design
- Vercel deploy, E2E smoke test

### v2 Features
- BUG-001/002/003 opravené (middleware, platform case, PWA)
- TASK-101: Google OAuth
- TASK-102: Facebook Integration (OAuth + auto-post)
- TASK-103: i18n (SK default, EN fallback)
- TASK-104: PWA Support (Serwist)
- TASK-105: OCR Photo Upload (OpenAI Vision GPT-4o)
- TASK-106: Rozšírené štatistiky (trend chart, top reporters, period counts)
- TASK-107: Moderný GUI Redesign (glassmorphism, gradient text, card hover effects)
- Community features: Chat, Suggestions board, Nickname

## Zostáva
- Supabase Auth redirect URLs (production)
- E2E testy nových features (authenticated flow)
- Rate limiting, CAPTCHA
- Vercel deploy nových commitov

## Tech Stack
- Next.js (App Router), Supabase, Tailwind CSS v4, shadcn/ui
- next-intl (i18n), Serwist (PWA), recharts (charts)
- OpenAI Vision (OCR), Google Drive (photo upload)

## Linky
- **GitHub:** https://github.com/VladoAdmin/host-blacklist
- **Trello:** karty s prefixom HTB03-
- **Local:** /home/clawd/Projects/host-blacklist
