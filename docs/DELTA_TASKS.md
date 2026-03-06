# DELTA_TASKS.md — Host Blacklist v2

> Iteration plan pre 7 nových/zmenových features.
> Vychádza z PROJECT_SNAPSHOT.md — všetky rozhodnutia sú podložené analýzou existujúceho kódu.

---

## 📋 Prehľad

| ID | Feature | Typ | Est. čas | Závislosti |
|----|---------|-----|----------|------------|
| BUG-001 | Fix middleware (proxy.ts → middleware.ts) | Bugfix | 10 min | — |
| BUG-002 | Fix platform case mismatch | Bugfix | 15 min | — |
| BUG-003 | Re-generate PWA service worker | Bugfix | 30 min | — |
| TASK-101 | Google OAuth | Feature | 2h | BUG-001 |
| TASK-102 | Facebook Integration | Feature | 3h | BUG-001 |
| TASK-103 | i18n Setup + Default Slovak | Change | 6h | — |
| TASK-104 | PWA Support (full) | Feature | 3h | BUG-003 |
| TASK-105 | OCR Photo Upload | Feature | 6h | — |
| TASK-106 | Rozšírené Štatistiky | Feature | 4h | — |
| TASK-107 | Moderný GUI Redesign | Change | 8h | TASK-103 |

**Celkový odhad:** ~30 hodín (4-5 dní s 1 Coderom)

---

## 🔧 BUG FIXES (kritické)

### BUG-001: Fix middleware routing
**Stav:** `src/proxy.ts` exportuje middleware, ale Next.js očakáva `src/middleware.ts`
**Dopad:** Route protection nefunguje server-side (iba client-side fallback)

**Riešenie:**
```bash
mv src/proxy.ts src/middleware.ts
```
+ overiť import paths v middleware.ts

**Test:** 
- Skúsiť pristúpiť na `/dashboard` bez prihlásenia → redirect na `/login`
- Skúsiť pristúpiť na `/login` keď som prihlásený → redirect na `/dashboard`

---

### BUG-002: Fix platform case mismatch
**Stav:** Frontend posiela "Airbnb", "Booking", "Direct", "Other" (CamelCase)
**DB CHECK constraint:** `platform IN ('airbnb', 'booking', 'direct', 'other')` (lowercase)
**Dopad:** INSERT reportu zlyhá na CHECK constraint

**Riešenie:**
V `src/lib/constants.ts` zmeniť:
```typescript
export const PLATFORMS = [
  { value: 'airbnb', label: 'Airbnb' },
  { value: 'booking', label: 'Booking.com' },
  { value: 'direct', label: 'Direct' },
  { value: 'other', label: 'Other' }
];
```

**Test:**
- Vytvoriť report s platform=Airbnb → musí prejsť
- Overiť v DB že hodnota je lowercase

---

### BUG-003: Re-generate PWA service worker
**Stav:** `public/sw.js` je stale, referencuje neexistujúce `[locale]` routes
**Dopad:** PWA nefunguje správne, cache je broken

**Riešenie:**
1. Nainštalovať `next-pwa` alebo `@serwist/next`
2. Konfigurovať v `next.config.ts`
3. Vygenerovať nový sw.js

**Test:**
- Chrome DevTools → Application → Service Workers → musí byť aktívny
- Offline mode → stránka sa načíta z cache

---

## 🚀 FEATURES

---

### TASK-101: Google OAuth
**Acceptance Criteria:**
- [ ] Google login button na `/login` a `/register`
- [ ] Funkčné prihlásenie cez Google účet
- [ ] Po prihlásení redirect na `/dashboard`
- [ ] Profile sa automaticky vytvorí (trigger už existuje)

**Implementation:**
1. Supabase Dashboard → Authentication → Providers → Google ON
2. Google Cloud Console → OAuth 2.0 credentials
3. Pridať redirect URIs: `https://host-blacklist.vercel.app/auth/callback`
4. Frontend: `supabase.auth.signInWithOAuth({ provider: 'google' })`
5. Callback handler už existuje (`/auth/callback/route.ts`)

**Files:**
- `src/app/login/page.tsx` — pridať Google button
- `src/app/register/page.tsx` — pridať Google button
- `src/components/auth/OAuthButtons.tsx` — nový shared component

**Depends on:** BUG-001 (middleware musí fungovať pre auth flow)

---

### TASK-102: Facebook Integration
**Acceptance Criteria:**
- [ ] Facebook login button na `/login` a `/register`
- [ ] Funkčné prihlásenie cez Facebook
- [ ] Nové reporty sa postujú do FB Group/Page
- [ ] Post obsahuje iba verejné info (žiadne osobné údaje)

**Implementation — Auth:**
1. Supabase Dashboard → Authentication → Providers → Facebook ON
2. Facebook Developers → App → OAuth settings
3. Frontend: `supabase.auth.signInWithOAuth({ provider: 'facebook' })`

**Implementation — Auto-post:**
1. Nový environment variable: `FB_ACCESS_TOKEN`, `FB_GROUP_ID`
2. Nový API endpoint: `POST /api/social/share`
3. Volanie po vytvorení reportu (v `POST /api/reports`)
4. Facebook Graph API: `POST /{group-id}/feed`

**Post content (bez osobných údajov):**
```
Nový report na Host Blacklist
Typ: [incident_type]
Závažnosť: [severity]/5
[link na guest detail]
```

**Files:**
- `src/app/login/page.tsx` — Facebook button
- `src/app/register/page.tsx` — Facebook button
- `src/app/api/social/share/route.ts` — nový endpoint
- `src/app/api/reports/route.ts` — volať share po vytvorení
- `src/lib/facebook.ts` — FB Graph API client

**Depends on:** BUG-001

---

### TASK-103: i18n Setup + Default Slovak Language
**Acceptance Criteria:**
- [ ] Default jazyk je Slovenčina (SK)
- [ ] Fallback jazyk je Angličtina (EN)
- [ ] Všetky UI texty sú preložené
- [ ] Jazyk sa dá zmeniť (dropdown v navbar)
- [ ] URL obsahuje locale: `/sk/dashboard`, `/en/dashboard`

**Implementation:**

1. **Install dependencies:**
```bash
npm install next-intl
```

2. **Config:**
- `next.config.ts` — pridať `i18n` config (defaultLocale: 'sk', locales: ['sk', 'en'])
- `src/i18n.ts` — nový config file
- `src/middleware.ts` — locale detection + routing (merge s auth middleware!)

3. **Messages:**
- `messages/sk.json` — všetky slovenské preklady
- `messages/en.json` — všetky anglické preklady

4. **Layout:**
- `src/app/layout.tsx` — wrap do `NextIntlClientProvider`
- Dynamický `html lang` atribút

5. **Migrate all strings:**
Zoznam files na zmenu (~200 stringov):
- `src/app/page.tsx` — landing page
- `src/app/login/page.tsx`
- `src/app/register/page.tsx`
- `src/app/dashboard/page.tsx`
- `src/app/search/page.tsx`
- `src/app/guest/[id]/page.tsx`
- `src/app/report/new/page.tsx`
- `src/app/report/[id]/edit/page.tsx`
- `src/app/settings/page.tsx`
- `src/components/layout/Navbar.tsx`
- `src/components/layout/Footer.tsx`
- `src/components/search/SearchBar.tsx`
- `src/components/search/GuestCard.tsx`
- `src/components/search/GuestList.tsx`
- `src/lib/constants.ts` — INCIDENT_TYPES, PLATFORMS, SEVERITY_LABELS

6. **Language switcher:**
- `src/components/layout/LanguageSwitcher.tsx` — nový component v navbar

**Files:**
- `next.config.ts` — i18n config
- `src/i18n.ts` — nový
- `messages/sk.json` — nový
- `messages/en.json` — nový
- `src/middleware.ts` — locale routing (MERGE s existujúcim auth middleware!)
- `src/app/layout.tsx` — provider
- All page files — string extraction
- `src/components/layout/LanguageSwitcher.tsx` — nový

**Note:** Middleware merge je kritický — musí fungovať aj auth protection aj locale routing.

---

### TASK-104: PWA Support (full)
**Acceptance Criteria:**
- [ ] manifest.json s správnymi hodnotami
- [ ] Service worker pre offline fallback
- [ ] Icons: 192x192, 512x512
- [ ] Add to Home Screen funguje na mobile
- [ ] Lighthouse PWA audit pass

**Implementation:**

1. **Install:**
```bash
npm install next-pwa
```

2. **next.config.ts:**
```typescript
import withPWA from 'next-pwa'

const nextConfig = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
})({
  // existing config
})
```

3. **manifest.json:**
```json
{
  "name": "Host Blacklist",
  "short_name": "HostBL",
  "description": "Platforma pre zdieľanie čiernej listiny nevhodných hostí",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#000000",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

4. **Icons:**
- Vygenerovať `/public/icon-192.png`
- Vygenerovať `/public/icon-512.png`
- Môže byť simple — logo HB na pozadí

5. **Layout link:**
```html
<link rel="manifest" href="/manifest.json" />
<meta name="theme-color" content="#000000" />
```

6. **Delete stale files:**
- `public/sw.js` (old)
- `public/workbox-*.js` (old)

**Files:**
- `next.config.ts` — PWA config
- `public/manifest.json` — nový/upraviť
- `public/icon-192.png` — nový
- `public/icon-512.png` — nový
- `src/app/layout.tsx` — manifest link
- Delete: `public/sw.js`, `public/workbox-*.js`

**Depends on:** BUG-003 (stale SW treba odstrániť)

---

### TASK-105: OCR Photo Upload
**Acceptance Criteria:**
- [ ] User môže uploadnúť fotku rezervácie
- [ ] OCR extrahuje: meno hosťa, email, dátumy pobytu
- [ ] Preview extrahovaných dát pred confirm
- [ ] Po confirm → prefill do report formu
- [ ] Podporované formáty: JPG, PNG, PDF

**Implementation:**

1. **Dependencies:**
```bash
npm install tesseract.js
# alebo pre lepšiu presnosť:
# npm install @google-cloud/vision
```

**Rozhodnutie:** Použiť `tesseract.js` (client-side) pre jednoduchosť.
Alternatíva: Supabase Edge Function + Google Cloud Vision API (presnejšie, ale viac setupu).

2. **Supabase Storage:**
- Vytvoriť bucket: `reservation-photos`
- Policy: authenticated users môžu uploadovať

3. **New components:**
- `src/components/ocr/PhotoUpload.tsx` — drag & drop upload
- `src/components/ocr/OCRPreview.tsx` — preview extrahovaných dát
- `src/components/ocr/OCRPrompt.tsx` — modal/prompt pre upload

4. **New API:**
- `POST /api/ocr` — prijme image, vráti extracted data
- Alebo: client-side OCR priamo v komponente

5. **OCR flow:**
```
User → Click "Nahrať fotku rezervácie" → Select file 
→ Upload to Supabase Storage → OCR processing
→ Show preview: Meno: [___] Email: [___] Check-in: [___] Check-out: [___]
→ User confirms → Prefill report form
```

6. **Extract regex patterns (pre rezervácie):**
```typescript
const PATTERNS = {
  fullName: /(?:Guest|Hosť|Name|Meno)[\s:]+([A-Z][a-z]+\s+[A-Z][a-z]+)/i,
  email: /[\w.-]+@[\w.-]+\.\w+/,
  checkIn: /(?:Check[\s-]?in|Arrival|Príchod)[\s:]+(\d{1,2}[.\/]\d{1,2}[.\/]\d{2,4})/i,
  checkOut: /(?:Check[\s-]?out|Departure|Odchod)[\s:]+(\d{1,2}[.\/]\d{1,2}[.\/]\d{2,4})/i,
}
```

**Files:**
- `src/components/ocr/PhotoUpload.tsx` — nový
- `src/components/ocr/OCRPreview.tsx` — nový
- `src/components/ocr/OCRPrompt.tsx` — nový
- `src/app/api/ocr/route.ts` — nový (alebo client-side)
- `src/lib/ocr.ts` — OCR utils, regex patterns
- `src/app/report/new/page.tsx` — integrovať OCR upload button

**Note:** OCR nie je 100% presný — vždy ukázať preview s možnosťou editácie.

---

### TASK-106: Rozšírené Štatistiky
**Acceptance Criteria:**
- [ ] Dashboard zobrazuje posledný pridaný záznam (globálne)
- [ ] Počet záznamov za: dnes, týždeň, mesiac, rok
- [ ] Top aktívni reportéri (top 5)
- [ ] Trend graf — záznamy za posledných 30 dní
- [ ] Responsive grafy

**Implementation:**

1. **Dependencies:**
```bash
npm install recharts
```

2. **DB migrations:**
```sql
-- Funkcia pre časové štatistiky
CREATE OR REPLACE FUNCTION get_report_stats(
  period TEXT -- 'day', 'week', 'month', 'year'
)
RETURNS TABLE (
  period_start DATE,
  report_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    DATE_TRUNC(period, created_at)::DATE as period_start,
    COUNT(*) as report_count
  FROM reports
  WHERE created_at >= NOW() - INTERVAL '1 year'
  GROUP BY DATE_TRUNC(period, created_at)
  ORDER BY period_start;
END;
$$ LANGUAGE plpgsql;

-- Funkcia pre top reportérov
CREATE OR REPLACE FUNCTION get_top_reporters(limit_count INT DEFAULT 5)
RETURNS TABLE (
  reporter_id UUID,
  full_name TEXT,
  report_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.reporter_id,
    p.full_name,
    COUNT(*) as report_count
  FROM reports r
  JOIN profiles p ON r.reporter_id = p.id
  GROUP BY r.reporter_id, p.full_name
  ORDER BY report_count DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;
```

3. **API update:**
Rozšíriť `GET /api/dashboard`:
```typescript
interface DashboardStats {
  // existujúce
  myReportsCount: number;
  totalGuests: number;
  recentReports: Report[];
  
  // nové
  lastGlobalReport: Report | null;
  reportsToday: number;
  reportsThisWeek: number;
  reportsThisMonth: number;
  reportsThisYear: number;
  topReporters: TopReporter[];
  trendData: TrendPoint[]; // 30 dní
}
```

4. **New components:**
- `src/components/stats/StatsCard.tsx` — jedna štatistická karta
- `src/components/stats/TrendChart.tsx` — line chart (recharts)
- `src/components/stats/TopReporters.tsx` — list top 5

5. **Dashboard page update:**
- Nová sekcia "Štatistiky" s kartami (dnes, týždeň, mesiac, rok)
- Line chart pod kartami
- Sidebar s top reportérmi
- "Posledný záznam" highlight

**Files:**
- `supabase/migrations/003_stats_functions.sql` — nové funkcie
- `src/app/api/dashboard/route.ts` — rozšíriť stats
- `src/components/stats/StatsCard.tsx` — nový
- `src/components/stats/TrendChart.tsx` — nový
- `src/components/stats/TopReporters.tsx` — nový
- `src/app/dashboard/page.tsx` — integrovať nové komponenty

---

### TASK-107: Moderný GUI Redesign
**Acceptance Criteria:**
- [ ] Linear/Notion/Vercel štýl — čisté, veľké typography
- [ ] Subtle gradients, moderné farby
- [ ] Zachovaná prehľadnosť a rýchlosť
- [ ] Dark mode toggle
- [ ] Lepšia mobile experience
- [ ] Animations (subtle, nie rušivé)

**Design System:**

1. **Colors:**
```css
/* globals.css update */
:root {
  --background: 0 0% 100%;
  --foreground: 240 10% 3.9%;
  --card: 0 0% 100%;
  --card-foreground: 240 10% 3.9%;
  --popover: 0 0% 100%;
  --popover-foreground: 240 10% 3.9%;
  --primary: 240 5.9% 10%;
  --primary-foreground: 0 0% 98%;
  --secondary: 240 4.8% 95.9%;
  --secondary-foreground: 240 5.9% 10%;
  --muted: 240 4.8% 95.9%;
  --muted-foreground: 240 3.8% 46.1%;
  --accent: 240 4.8% 95.9%;
  --accent-foreground: 240 5.9% 10%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 0 0% 98%;
  --border: 240 5.9% 90%;
  --input: 240 5.9% 90%;
  --ring: 240 5.9% 10%;
  --radius: 0.625rem;
}

.dark {
  --background: 240 10% 3.9%;
  --foreground: 0 0% 98%;
  /* ... */
}
```

2. **Typography:**
- Headings: väčšie, tučnejšie
- Body: čitateľnejšie line-height
- Gradient text pre nadpisy (subtle)

3. **Components redesign:**
- **Navbar** — glassmorphism effect, lepšia mobile nav
- **Cards** — subtle shadow, hover effects
- **Buttons** — väčšie padding, lepšie states
- **Inputs** — moderné focus states

4. **Pages redesign priority:**
1. Landing page (`page.tsx`) — hero section, CTA
2. Dashboard — stats layout, grids
3. Search — cleaner results, lepšie filtre
4. Guest detail — prehľadnejšie reporty

5. **Dark mode:**
- Toggle v navbar
- CSS variables už existujú v globals.css
- Pridať `class="dark"` na `<html>` keď zapnuté
- Uložiť preferenciu do localStorage

6. **Animations:**
```bash
npm install framer-motion
```
- Page transitions
- Card hover effects
- Toast animations (vylepšiť)
- Loading skeletons (už existujú, vylepšiť)

**Files:**
- `src/app/globals.css` — color system
- `src/components/layout/Navbar.tsx` — redesign + dark mode toggle
- `src/components/ui/*` — vylepšiť štýly
- `src/app/page.tsx` — landing redesign
- `src/app/dashboard/page.tsx` — layout redesign
- `src/app/search/page.tsx` — redesign
- `src/app/guest/[id]/page.tsx` — redesign
- `src/components/theme/ThemeProvider.tsx` — nový
- `src/components/theme/DarkModeToggle.tsx` — nový

**Depends on:** TASK-103 (i18n musí byť hotové pred redesign — inak sa musia stringy extrahovať 2x)

---

## 📊 Poradie implementácie

### Fáza 1: Bugfixes (1 deň)
1. BUG-001 — Fix middleware
2. BUG-002 — Fix platform case
3. BUG-003 — Re-generate SW

### Fáza 2: Core Features (2 dni)
4. TASK-101 — Google OAuth
5. TASK-102 — Facebook Integration
6. TASK-104 — PWA Support

### Fáza 3: Localization (1-2 dni)
7. TASK-103 — i18n + Default Slovak

### Fáza 4: Advanced Features (2-3 dni)
8. TASK-105 — OCR Photo Upload
9. TASK-106 — Rozšírené Štatistiky

### Fáza 5: Polish (1-2 dni)
10. TASK-107 — Moderný GUI Redesign

---

## 🔗 Integration Checklist

Pred deployom overiť:
- [ ] Všetky 3 bugfix-y sú aplikované
- [ ] Google OAuth funguje na produkcii
- [ ] Facebook OAuth funguje na produkcii
- [ ] i18n routing funguje (`/sk/`, `/en/`)
- [ ] PWA manifest je platný (Lighthouse audit)
- [ ] OCR funguje s testovacími fotkami
- [ ] Štatistiky sa zobrazujú správne
- [ ] Dark mode toggle funguje
- [ ] Všetky stringy sú preložené do SK

---

## 📝 Environment Variables

Nové premenné potrebné:

```bash
# Facebook Integration
FB_ACCESS_TOKEN=...
FB_GROUP_ID=...

# Google OAuth (už by mali byť v Supabase, nie v .env)
# GOOGLE_CLIENT_ID=...
# GOOGLE_CLIENT_SECRET=...

# OCR (ak použijeme Google Cloud Vision miesto tesseract.js)
# GOOGLE_CLOUD_VISION_API_KEY=...
```

---

*Vytvorené:* 2026-03-06
*Založené na:* PROJECT_SNAPSHOT.md
