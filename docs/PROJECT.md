# 写道3 — Host Blacklist

## Aktuálny stav
- **Fáza：** LIVE (vercel.app)
- **Posledná aktivita：** 2026-03-05
- **URL：** https://host-blacklist.vercel.app

## Čo je hotové ✅
- 15 core taskov
- OAuth kód
- i18n SK
- PWA setup
- 404 záznamov migrovaných z Google Drive

## Čo ide teraz 🔄
- Supabase Auth redirect URLs
- OCR pre blacklist záznamy
- Štatistiky (dashboard)
- GUI Redesign

## Blockers ⏳
- Supabase OAuth provider credentials (čakáme)

## Rozhodnutia
- Singleton Supabase client — module-level, nie useMemo v hooks
- 404 záznamov z CSV → Supabase `black_list` tabuľka

## Linky
- **GitHub：** https://github.com/VladoAdmin/host-blacklist
- **Trello：** karty s prefixom `HTB03-`
- **Local：** /home/clawd/Projects/host-blacklist
