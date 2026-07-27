---
change_id: archivo-font-swap
title: Replace unlicensed fonts (PF Grand Gothik, Neue Haas Unica) with Archivo
status: implementing
created: 2026-07-27
updated: 2026-07-27
archived_at: null
---

## Notes

Source: Slack #fabryka-atrakcji-wewnetrznie — Oliwier's question (2026-07-24) + Sasha's analysis (2026-07-26).

**Sytuacja:** Font Radar (działa na zlecenie Parachute — realna firma, nie phishing) wysłał do Łukasza wezwanie ws. braku licencji webowej na PF Grand Gothik. Nikt w Kryptonum nie kupował licencji (Bogumił: Damian/Pati prawdopodobnie użyli cracka). Na stronie są **dwa** płatne fonty bez licencji:

- **PF Grand Gothik** (Parachute) — nagłówki; o nim jest mail od Font Radar
- **Neue Haas Unica** (Monotype) — paragrafy; maila jeszcze nie ma, ale Monotype prowadzi własny enforcement — robimy oba naraz

**Dlaczego podmiana, nie zakup:** licencje webowe u obu dostawców są **roczne** (Parachute: ~€65/styl, 1 domena + 5 subdomen, 50k pageviews/msc; Monotype: webfont wyceniany od pageviews, osobna licencja Digital Ad na kreacje Meta). Stały koszt roczny u dwóch–trzech dostawców. Adobe Fonts odpada — wymagałby subskrypcji CC po stronie klienta.

**Rekomendacja Sashy: Archivo** (Google Fonts, OFL) — zmienna waga 100–900 + oś szerokości, pełna polska diakrytyka, self-hosting bez ograniczeń. Jedna rodzina zastępuje oba fonty: Expanded 900 na nagłówki, 400 na body. Mniej plików, lepszy LCP. Uwaga: to **nie jest podmiana 1:1** — trzeba przejść całą typografię i wszystkie breakpointy, nie tylko H1.

**Plan działania (z wątku):**

1. Grep po repo — pełna lista fontów i plików (może wyjść trzeci font)
2. Podmiana na Archivo: typografia + wszystkie breakpointy; stare pliki fontów usunąć z `public/` **i z historii gita**, przepłukać cache CDN
3. Odpowiedź do Font Radar w tym tygodniu, nie czekając na pkt 2 (font usunięty od [data], prośba o potwierdzenie mandatu od Parachute i dowody skanu) — poza zakresem repo
4. Audyt materiałów klienta — Unica jako font brandowy pewnie jest też tam — poza zakresem repo

Zakres tej zmiany w repo: punkty 1–2. Deadline z wezwania: 7 dni (pozycja negocjacyjna, ale szybka podmiana zamyka temat).
