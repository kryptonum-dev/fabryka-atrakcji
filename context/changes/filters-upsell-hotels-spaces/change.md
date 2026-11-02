---
change_id: filters-upsell-hotels-spaces
title: Przebudowa filtrów hoteli i przestrzeni eventowych (upsell, multi-select, odległość)
status: implementing
created: 2026-11-02
updated: 2026-11-02
implementation_base: 55af545ab4e0eb3ab2efd3b31ec3981825a9a74c
archived_at: null
views: []
---

## Notes

Upsell uzgodniony ze Łukaszem (Fabryka Atrakcji) na Slacku, wątek w #fabryka-atrakcji:
https://kryptonumworkspace.slack.com/archives/C098Z6V0CJ2/p1791191046692849

Wycena: 1200 zł netto, zaakceptowana 16.10.2026 ("zapisuj pierwsza wolna chwile i lecimy"). Start najwcześniej od 26.10.

Zakres jest zapisany w `research.md`, sekcja "Zakres uzgodniony z klientem". Źródłem prawdy jest odpowiedź Oliwiera z 16.10 — tam, gdzie różni się od prośby Łukasza z 12.10, wygrywa odpowiedź Oliwiera (np. przedziały zamiast konkretnej liczby uczestników).

Strony SEO typu "Hotele nad morzem" są poza zakresem: wracamy do nich osobno po wdrożeniu filtrów.

Geoapify (2026-11-02): repo-root `.env` holds a working `GEOAPIFY_API_KEY`, read from the Geoapify dashboard. The value in Vercel (Production and Preview) is invalid and returns 401. Do not change Vercel env vars: Oliwier replaces the value himself. Until then, prove suggestions on a local server with the `.env` key, and expect production `/api/geocode` to return the provider error path. The input, origin and radius checks in `verify.sh` do not depend on the key.
