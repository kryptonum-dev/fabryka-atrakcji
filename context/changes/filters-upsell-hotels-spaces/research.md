---
date: 2026-11-02T08:52:41+01:00
researcher: Claude
git_commit: 55af545ab4e0eb3ab2efd3b31ec3981825a9a74c
branch: main
repository: kryptonum-dev/fabryka-atrakcji
topic: "Przebudowa filtrów hoteli i przestrzeni eventowych: stan kodu, danych i produkcji wobec zakresu uzgodnionego z klientem"
tags: [research, filters, hotels, event-spaces, sanity, geo, isr, upsell]
status: complete
last_updated: 2026-11-02
last_updated_by: Claude
last_updated_note: "Dodano decyzje Oliwiera i zakres końcowy, sekcja Follow-up Research"
---

# Research: przebudowa filtrów hoteli i przestrzeni eventowych

**Data**: 2026-11-02 08:52 CET
**Researcher**: Claude
**Git Commit**: 55af545 (lokalny `main` jest 8 commitów przed `origin/main`, więc referencje są ścieżkami względnymi, nie permalinkami)
**Branch**: main
**Repository**: kryptonum-dev/fabryka-atrakcji

## Research Question

Co trzeba wiedzieć, żeby zaplanować upsell filtrów uzgodniony ze Łukaszem na Slacku: jak filtry działają dziś, czy dane i produkcja pozwalają zrobić to, co obiecano, i co jest jeszcze nierozstrzygnięte.

## Zakres uzgodniony z klientem

Źródło: [wątek w #fabryka-atrakcji](https://kryptonumworkspace.slack.com/archives/C098Z6V0CJ2/p1791191046692849), 5–16.10.2026.

- 5.10: Łukasz prosi o przebudowę filtrów hoteli. Najbardziej zależy mu na multi-selekcie.
- 12.10: dokłada filtry przestrzeni eventowych.
- 16.10: Oliwier odsyła propozycję i wycenę **1200 zł netto**, start od 26.10.
- 16.10: Łukasz akceptuje: „zapisuj pierwsza wolna chwile i lecimy".

Źródłem prawdy jest odpowiedź Oliwiera z 16.10.

**Reguły wspólne**
- W każdym filtrze można zaznaczyć kilka opcji (OR): dwa regiony to hotele z jednego albo drugiego.
- Filtry łączą się ze sobą (AND).
- Wyjątek: udogodnienia i zaplecze działają jak AND wewnątrz filtra. SPA + basen pokazuje obiekty z obiema cechami. Oliwier dopytał „Tak to widzisz?", Łukasz odpowiedział akceptacją całości, bez odniesienia do tego punktu.

**Hotele**

| # | Filtr | Uzgodnienie |
|---|---|---|
| 1 | Region | bez zmian, z multi-selectem |
| 2 | Odległość | miasto z listy + promień 25 / 50 / 100 / 150 km, od centrum, w linii prostej; listę miast klient rozszerza w Sanity |
| 3 | Liczba uczestników | zamiast pokoi: nocleg, konferencja, bankiet; przedziały, multi-select |
| 4 | Standard | jak teraz + „Bez oficjalnej kategoryzacji" |
| 5 | Udogodnienia | 7–8 najważniejszych, 4 widoczne, reszta pod „Pokaż więcej" |
| 6 | Otoczenie | nowy: Góry; Nad jeziorem / wodą; Nad morzem; Las / puszcza; Miasto; Natura / na uboczu. Klient uzupełnia przy każdym hotelu |

**Przestrzenie eventowe**

| # | Filtr | Uzgodnienie |
|---|---|---|
| 1 | Lokalizacja | „Warszawa i okolice", „Kraków i okolice" itd. |
| 2 | Odległość od adresu | adres z podpowiedziami jak w Google Maps, promień 1 / 3 / 5 / 10 / 20 / 30 km, sortowanie od najbliższej, km na karcie |
| 3 | Rodzaj przestrzeni | wnętrze / plener / wnętrze + plener |
| 4 | Liczba uczestników | osobno wnętrze i plener, przedziały zamiast konkretnej liczby |
| 5 | Typ wydarzenia | Konferencja / szkolenie; Gala / bankiet / wigilia; Integracja / impreza firmowa; Warsztaty; Premiera / pokaz / event promocyjny |
| 6 | Charakter przestrzeni | Industrialna / loftowa; Elegancka / reprezentacyjna; Zabytkowa / historyczna; Nowoczesna / designerska; Naturalna / rustykalna |
| 7 | Zaplecze i możliwości | np. możliwość wyłączności, zaplecze techniczne, zaplecze kuchenne / kulinarne |

**Poza zakresem:** strony SEO typu „Hotele nad morzem". Wracamy do nich po wdrożeniu filtrów.

## Summary

Wszystko, co obiecano, da się zrobić. Trzy rzeczy zmieniają jednak obraz projektu.

1. **Filtry przestrzeni na produkcji nie działają wcale.** `/pl/przestrzenie-eventowe/filtr/?minCapacity=500` zwraca 13 przestrzeni z cache, a wersja bez końcowego ukośnika poprawny 1 wynik. Sprawdzone ponownie 2026-11-02. Bez naprawy tego połowa upsellu będzie niewidoczna dla użytkowników.
2. **Multi-select nie jest usterką, tylko nigdy nie istniał.** Działają wyłącznie udogodnienia hoteli i cechy przestrzeni, oba jako AND. Region, standard, pokoje, lokalizacja, metraż i pojemność to radio: serwer czyta jedną wartość, a GROQ porównuje przez `==`.
3. **Główny koszt leży w danych, nie w kodzie.** W surowej postaci zakres oznacza około 1070 edycji w Sanity. Dla przestrzeni nie ma pojemności wnętrze/plener, a oferta nie mówi, kto je uzupełni. Dane EN są częściowo zepsute. Opisane niżej decyzje zmniejszają to do około 150 edycji po stronie klienta.

Obietnica „pojemności masz już uzupełnione przy wszystkich hotelach" jest prawdziwa: 125/125.

Założenie Łukasza o danych do odległości też się potwierdza, ale współrzędne istnieją tylko jako tekst w URL-u mapy Google. Strukturalnego pola nie ma nigdzie.

### Obietnice wobec stanu faktycznego

| Co powiedziano klientowi | Stan 2026-11-02 |
|---|---|
| „Pojemności masz już uzupełnione przy wszystkich hotelach" | Prawda: 125/125 dla noclegu, konferencji i bankietu. 7 par PL/EN ma różne wartości, najgorzej Folwark Łochów: 1077 PL, 309 EN |
| Obecne profile mają większość danych do odległości | Prawda częściowa: brak pola geo. 143/143 URL-i embedów zawiera współrzędne, ale to środek widoku mapy, nie pinezka. Około 6 dokumentów wymaga sprawdzenia, w próbce błąd sięgnął 60 km (Dwór Elizy) |
| „Ograniczeń technicznych nie widzę" | Prawda, pod warunkiem naprawy tras przestrzeni i podjęcia decyzji o dostawcy adresów |
| Rodzaj przestrzeni: wnętrze / plener / oba | Model zna dwie wartości. Trzecia złamie `offer/Hero.astro:463`, gdzie ternary traktuje ją jak plener |
| Pojemność osobno wnętrze i plener | Pole `maxPeople` jest jedno, innych danych nie ma. BezSłowa ma 1000 osób, 2500 m² (opisane jako teren zielony) i `outdoor`. Pojemności wnętrza brak także w treści |
| „Warszawa i okolice", „Kraków i okolice" | Wszystkie 18 przestrzeni wskazuje jeden dokument `warszawa-i-mazowsze`. Żadna nie leży poza Mazowszem, więc „Kraków i okolice" byłoby puste |
| Udogodnienia: 7–8 z listy klienta | Klient zaczął edycję 2.10–5.10, ale nowy dokument „SPA / Wellness" ma 2 hotele, a stary „Spa" 80. Filtr na nowym dałby 2 wyniki |
| Standard „Bez oficjalnej kategoryzacji" | 0 hoteli tak oznaczonych, walidacja wymaga 1–5. Klient musi wskazać obiekty |
| Typ wydarzenia, charakter, zaplecze „1:1" | Tych pól nie ma. Dzisiejsze `features` mieszają wszystko, 6 przestrzeni ma identyczny zestaw, Reduta Banku Polskiego jest oznaczona jako „Loft". Dane nie nadają się do przeniesienia |

## Detailed Findings

### 1. Stan produkcji i warunek wstępny

Tabela z 2026-11-02, dwa różne query stringi na trasę:

| Trasa | Cache | Czy filtruje |
|---|---|---|
| `/pl/hotele/filtr/` | MISS | tak: `stars=5` 7 wyników, `stars=3` 23 |
| `/en/hotels/filter/` | MISS | tak: 3 i 14 |
| `/pl/przestrzenie-eventowe/filtr/` | **HIT** | **nie**, identyczny hash |
| `/en/event-spaces/filter/` | **HIT** | **nie**, identyczny hash |
| `/pl/integracje/filtr/` | MISS | filtry tak, search tylko zmienia kolejność |
| `/en/activities/filter/` | MISS | jw. |

**Przyczyna**
- Wykluczenie ISR w adapterze generuje regex `^/pl/.../filtr$` bez końcowego ukośnika (`.vercel/output/config.json`, trasy 512–527, `astro.config.ts:36-39`).
- Aplikacja zawsze buduje `/filtr/` (`event-spaces/Listing.astro:1222`, `hotels/Listing.astro:1554`, `search-navigation.ts:15,22`).
- Taki URL trafia więc do trasy ISR `[slug]`, a jej `allowQuery` zawiera tylko `x_astro_path`, więc query string znika.
- Działa tylko to, co ma ręczny rewrite w `apps/astro/vercel.json`. Dla przestrzeni nie ma żadnego wpisu.
- Lokalny build pochodzi z 20.09 i jest bez `vercel.json`, więc scalenie obu warstw wnioskujemy z zachowania na żywo.

**Nowe względem notatki z sierpnia:** `/pl/przestrzenie-eventowe/strona/:page/filtr/` i `/en/event-spaces/page/:page/filter/` zwracają status 404 z poprawnie wyrenderowaną treścią. Dziś to niewidoczne, bo przestrzeni jest 13 PL i 5 EN przy 16 na stronę.

**Aktualizacja starych notatek**
- Commit 41edae0 (20.09) dodał rewrity dla EN hoteli i aktywności, więc „cały EN jest zepsuty" już nie obowiązuje.
- `vercel.json` nadal zawiera błędne wpisy: `/en/hotels/page/:page/filtr/` (dwukrotnie, linie 40 i 56) oraz `/en/integracje/...` (linie 44 i 60). Brakuje `/en/activities/page/:page/filter/`.
- `Pagination.astro:37` i `fetchEmbeddings`, cytowane w planie `filter-crawl-trap`, już nie istnieją.
- Canonical na `https://localhost/...` nadal jest na produkcji, na wszystkich testowanych trasach filtrowych. W `src/pages` zostały 32 trafienia `Astro.url.origin`.

### 2. Filtry hoteli dziś

Pliki: `apps/astro/src/components/hotels/Listing.astro` (HL), `apps/astro/src/utils/filters.ts` (F), `apps/astro/src/components/ui/SelectFilter.astro` (SF).

| Filtr | URL | UI | GROQ |
|---|---|---|---|
| Lokalizacja | `location` | radio, HL:521 | `location->slug.current == $location`, HL:178 |
| Gwiazdki | `stars` | radio, HL:527 | `stars == $stars`, HL:189 |
| Pokoje | `minRooms`, `maxRooms` | radio, HL:534 | HL:193-194 |
| Udogodnienia | `amenities=a,b` | checkbox, HL:540 | `count(...[@ in $amenities]) == count($amenities)`, HL:182-185 |
| Cena | `minPrice`, `maxPrice` | PriceRangeFilter, HL:547 | HL:197-198, wymaga `pricing.pricingVisible` |
| Szukaj | `search` | SearchBar, HL:570 | `_id in $embeddingResults[]...`, HL:204 |

**Dlaczego multi-select „nie działa"**, zweryfikowane na produkcji:

| URL | Wynik | Powód |
|---|---|---|
| `?location=jura-i-wyzyny,mazury-i-pojezierze` | 0 | porównane jako jeden slug |
| `?location=a&location=b` | 15 | czytana pierwsza wartość |
| `?amenities=spa,basen` | 40 | AND działa |
| `?amenities=spa&amenities=basen` | 47 | czytana pierwsza wartość (F:73) |
| `?minRooms=150` | 73 z 73, choć ≥150 pokoi ma 20 hoteli | F:97-99 zeruje `minRooms`, gdy nie ma `maxRooms`, a UI pokazuje „150+" jako wybrane |

Ostatni przypadek to prawdziwy błąd. Jest prawdopodobnym źródłem wrażenia Łukasza, ale tego nie wiemy na pewno. Parser `parseFilters` jest wspólny dla hoteli, ActivitiesPage i CategoriesPage. Otwarte górne przedziały nie mogą iść tą samą logiką.

**Mechanika**
- Liczniki liczone są serwerowo przy każdej nawigacji, nie zmieniają się przy klikaniu. Filtry radio wykluczają same siebie, udogodnienia nie (HL:231-293).
- Opcje z zerem są ukryte (SF:31), `allowZeroCount` nie ma wywołań.
- Stan klienta na sztywno zakłada, że multi-select to tylko udogodnienia: HL:1391, 1427, 1570 i SF:34. Samo dodanie `isMulti` do lokalizacji zapisze string, a potem wywoła na nim `.join` (HL:1410, 1502, wnioskowane).
- UI to SSR Astro i inline `<script>`, bez wysp. „Zastosuj" robi pełną nawigację `window.location.href` (HL:1557). Filtry nie działają bez JS, a jedna struktura DOM służy obu rozmiarom ekranu (drawer od 69,3125rem, HL:987-1051).
- Paginacja zachowuje parametry, „Zastosuj" wraca na stronę 1, a sortowanie jedzie przez `buildFilterUrl`, który ma sztywną listę parametrów (F:269-287).
- „Pokaż więcej" w grupach filtrów nie istnieje. Najbliższy wzorzec to `TableOfContent.astro:105,401-408`. Zmiany `categories-show-more` i `activities-show-more` dotyczą kart i świadomie pominęły hotele.

Kod aktywności można potraktować jako wzorzec (`{label, min, max}`, generowane zapytania liczników), nie jako komponent do użycia. Hotele nie ładują `init-listing-filters.ts`.

### 3. Filtry przestrzeni dziś

Plik: `apps/astro/src/components/event-spaces/Listing.astro` (SL), parametry parsowane inline w `templates/.../EventSpacesPage.astro:32-46`.

| Filtr | URL | GROQ |
|---|---|---|
| Lokalizacja | `location` | SL:80 |
| Cechy | `features` | AND, SL:82-85 |
| Metraż | `minArea`, `maxArea` | SL:88-89, przedziały z `EventSpaces_Page.areaFilterOptions` |
| Pojemność | `minCapacity`, `maxCapacity` | SL:92-93, przedziały z `capacityFilterOptions` |
| Szukaj | `search` | `name match $searchPattern`, SL:95 |

- `isIndoor` jest w schemacie, ale nie w filtrze ani w zapytaniu karty.
- Sortowanie działa w GROQ po projekcji, przed slice'em (SL:158-160), więc JS widzi jedną stronę.
- **Błąd:** `EventSpaceCardQuery` nie projektuje `popularityIndex`, `publishedDate` ani `_createdAt`, więc „Polecane" i „Od najnowszych" sortują po nullach. Wszystkie 13 PL ma ukryte ceny, więc dziś każde sortowanie daje tę samą kolejność.
- `ui/EventSpaceCard.astro` to czysty SSR, propsy idą przez `{...item}` (SL:431-432). Pole `km` dodane do projekcji dotrze do karty po dopisaniu destrukturyzacji w SL:83. Miejsce jest w `.address` (:378+).
- Hotele i przestrzenie mają osobne `Listing.astro` (1306 i 1668 linii) z osobnymi skryptami. Wspólne są SelectFilter, SearchBar, Dropdown i Pagination.
- Różnice utrudniające spójność: parser, źródło przedziałów (hardcode w hotelach, Sanity w przestrzeniach), search (dataset vs `match`).
- Strategia z archiwum zabraniała wciskania przestrzeni do `getHotelFilters` i odrzuciła generyczny framework filtrów ze względu na budżet (`event-spaces-implementation-strategy.md:709-716`). `getHotelFilters` nie ma już wywołań.

### 4. Dane w Sanity

Dataset `production`, zapytania bez tokena, 0 draftów.

**Hotele: 125 dokumentów (73 PL, 52 EN)**

Pojemności PL (`maxPeople`, `Hotels_Collection.ts:232-274`):

| Pole | Wypełnione | Min–max | 1–100 | 101–200 | 201–300 | 301–500 | 501+ |
|---|---|---|---|---|---|---|---|
| nocleg | 73/73 | 39–1300 | 12 | 26 | 15 | 11 | 9 |
| konferencja | 73/73 | 60–1200 | 4 | 20 | 16 | 23 | 10 |
| bankiet | 73/73 | 60–1000 | 7 | 33 | 17 | 12 | 4 |

- **Standard:** 3★ 23, 4★ 43, 5★ 7 (PL). Null ani 0 nie występują, walidacja to `required().min(1)` (`Hotels_Collection.ts:217`). `Array.from({length: stars})` na karcie przy 0 nie renderuje gwiazdek. `StarRating.tsx:37` to input Studio, który przy braku wartości pokazuje 3, a nic nie zapisuje.
- **Udogodnienia:** 64 dokumenty, 956 referencji, 706 poza listą klienta. Referencje są mocne i `amenities` wymaga min. 1 elementu, więc usuwanie dokumentów to 706 ręcznych kliknięć. Referencje z `amenities[]` czyta tylko filtr; blok „Amenities" na stronie hotelu to osobny tekst (`hotel/Amenities.ts:23-40`).
- **Lista klienta** (PL / EN hoteli): Basen 50/34, Grill 49/29, Zaplecze sportowe 19/11, Parking 16/13, Klub 10/5, Teren outdoor 6/1, Możliwość wyłączności 4/0, SPA / Wellness 2/0, Nad jeziorem / plaża 1/0.
- **Pułapki listy:** stary „Spa" trzyma 80 hoteli (potwierdzone), „Dostęp do jeziora" 13. „Teren outdoor" to przerobiony dokument „basen zewnętrzny", więc 7 hoteli ma tę cechę za basen, a twin EN nadal mówi „Outdoor pool". Dwa nowe dokumenty nie mają twinów EN.
- **Region:** referencja do `Locations_Collection`, która poza nazwą i slugiem nic nie ma. Z 50 dokumentów wiele jest nieużywanych, slugi są nieaktualne (`gory-i-poludnie` to Dolny Śląsk), a „Warszawa i Mazowsze" występuje w dwóch dokumentach (19 + 1). Pięć hoteli EN wskazuje dokumenty PL.
- **Otoczenie:** pola brak, a nieużywane dokumenty EN („By the sea", „Forest") nie mapują się na hotele bez ręcznej oceny.
- **Cena:** `pricing.pricingVisible` ma 5 z 73 PL i 10 z 52 EN, więc dzisiejszy filtr ceny obejmuje mniejszość obiektów. Klient nie wymienił go na swojej liście.

**Przestrzenie: 18 dokumentów (13 PL, 5 EN)**
- Wariantów ze skryptu `create-event-space-variants.ts` na produkcji nie ma (0). Wszystkie 18 to osobne obiekty.
- Brak geopointów, embedy 18/18 z dokładnością do 4,5 km widoku.
- `maxPeople` 80–1000, `isIndoor` PL: 10 wnętrz, 3 plenery; EN: 3 i 2. Miasta: Warszawa, Rasztów.
- Cechy: 9 dokumentów, wszystkie PL, 0 EN, więc filtr cech na EN jest pusty, a lokalizacji też (EN przestrzenie wskazują dokument PL). Pola zaplecza nie ma.

**Lokalizacja:** PL i EN to osobne dokumenty połączone `translation.metadata`, bez żadnej synchronizacji. Każda liczba jest zapisana dwa razy.
- Hotele: 51 par, 22 tylko PL, 1 osierocony duplikat EN (Głęboczek).
- Przestrzenie: 5 par, 8 tylko PL.
- Dodatkowo 45 z 52 hoteli EN wskazuje amenities PL (360 z 411 referencji), a opcje filtra ładują tylko `language == en` (HL:258). „Sauna" w EN znajduje 5 hoteli, choć 31 kolejnych ją ma.

**Studio:** nigdzie nie ma typu `geopoint` ani `@sanity/google-maps-input`. Natywny input to pola liczbowe lat/lng/alt (wnioskowane). Klient dziś wkleja link i embed, 143/143.

**Wprowadzanie danych, w edycjach**

| Pozycja | Surowo | Po decyzjach z sekcji Open Questions |
|---|---|---|
| Otoczenie | 125 | 73 PL + skrypt na EN |
| Współrzędne hotelu i przestrzeni | 143 | skrypt + przegląd około 6 odstających |
| Przebudowa udogodnień (Spa, jezioro) | 93 | skrypt |
| Usunięcie pozostałych udogodnień | 706 | 0, bo kurujemy listę zamiast kasować |
| Pola przestrzeni | 108 | 65 PL (5 pól × 13) + skrypt na EN |
| Dokumenty opcji | 26 | 0, jeśli listy idą jako `options.list` |
| Lista miast | 14 | 7 |
| Bez kategoryzacji | nieznane | zależy od klienta |

Razem z około 1070 do około 150 edycji klienta.

### 5. Odległość i adresy

**Liczenie**
- `geo::distance` działa na obecnym `apiVersion` 2024-10-15 (`constants.ts:79`), zwraca metry i przyjmuje zwykłe `{lat, lng}`.
- Filtrowanie, `order(geo::distance(...))` i projekcja km zadziałały na 125 hotelach z punktami wyciągniętymi z embedów, w 23 ms.
- GROQ pasuje lepiej niż Haversine w JS, bo paginacja jest w zapytaniu. Różnica Warszawa–Kraków to 282 m na 252 km.
- Dokument bez punktu zwraca null, czyli wypada z wyników filtra bez ostrzeżenia.

**Hotele nie potrzebują zewnętrznego API.** Miasta z współrzędnymi siedzą w Sanity. API jest potrzebne tylko dla adresu w przestrzeniach.

**Autocomplete adresu.** Na żywo testowano tylko Photon i GUGiK, bo Google, Mapbox i Geoapify wymagają klucza.

| Opcja | Polskie adresy | Koszt | Uwaga |
|---|---|---|---|
| Geoapify | nietestowane, baza OSM jak Photon | [3000 kredytów dziennie, także komercyjnie](https://www.geoapify.com/pricing/) | hosting w UE, [retencja 24 h](https://www.geoapify.com/privacy-policy/), wymagany link i atrybucja OSM; warunki cache niejasne |
| Google Places (New) | nietestowane, spodziewane najlepsze | [10 tys. żądań gratis](https://developers.google.com/maps/billing-and-pricing/pricing) | [EEA: współrzędne cache maks. 30 dni](https://cloud.google.com/terms/maps-platform/eea/maps-service-terms), konto rozliczeniowe |
| Mapbox | nietestowane | [500 sesji gratis](https://www.mapbox.com/pricing) | [Geocoding tylko z mapą Mapbox](https://docs.mapbox.com/api/search/geocoding/), praktycznie odpada |
| Photon | 23/25 trafień, mediana 22 m | gratis | [bez gwarancji dostępności, throttling](https://photon.komoot.io/) |
| Nominatim | nietestowane | gratis | [autocomplete zabroniony](https://operations.osmfoundation.org/policies/nominatim/) |
| GUGiK UUG | wymaga miasta, „Prosta 51 Warszawa" daje 0 | gratis | [bez autocomplete](https://services.gugik.gov.pl/uug/opis.html); pomoc do backfillu |

Założony ruch: około 95 sesji i 760 żądań miesięcznie, w wariancie ×5 około 475 sesji i 3800 żądań. Mieści się w każdym darmowym limicie. Jedyne ryzyko kosztowe to boty, bo żadna trasa nie ma inbound rate limitingu, a BotID chroni tylko `/api/contact` (`BotIdInit.astro:6`).

Rekomendacja: **Geoapify na darmowym planie**, po teście około 20 prawdziwych adresów biurowych. Rezerwa: Google Places.

**Promienie w praktyce** (13 PL, punkty z embedów):

| Skąd | 1 km | 3 km | 5 km | 10 km | 20 km | 30 km |
|---|---|---|---|---|---|---|
| Rondo ONZ | 2 | 5 | 10 | 12 | 12 | 13 |
| Domaniewska | 0 | 1 | 2 | 12 | 12 | 12 |
| Kraków | 0 | 0 | 0 | 0 | 0 | 0 |

Puste wyniki będą częste i potrzebują osobnego stanu.

**Prywatność:** parametry URL trafiają do Mety (`track-event.ts:620`, `analytics/meta/index.ts:229,281`), Google Sheets (`InquiryForm.tsx:117,149`, `google-sheets.ts:138`) i logów `[BOTLOG]` (`contact.ts:145,148`), a także do GA4 i Vercela (wnioskowane). Trzy miejsca po przecinku dają dokładność około 100 m.

CSP nie blokuje skryptu ani fetcha (`apps/astro/vercel.json:101-102`).

**Ograniczenia:** adres wpisany bez wyboru podpowiedzi nie ma współrzędnych, więc nie może trafić do URL-a (`applyFilters`, SL:1165-1166). URL ma limit 14 KB, multi-select slugów go nie osiągnie.

### 6. Wydajność i crawl

- Hotele: 198–223 KB po kompresji, 0,64–1,74 s; search około 2,5 s przy 3 MB.
- Limit na stronę 16 kart, więc multi-select nie zwiększy strony.
- **Jeden SVG gwiazdki (14 275 B) powtórzony 96 razy to 1,37 MB, 51% HTML-a** (`HotelCard.astro:137,185`).
- Ryzyko skalowania to liczniki: każda opcja to osobny `count(*[...])` (HL:234-286). Same przedziały uczestników dadzą 15 kolejnych. Czasu po stronie Sanity nie zmierzono.
- Filtry hoteli i przestrzeni nawigują przez JS, więc nowe parametry nie dodają linków. Rozlewają się jednak przez istniejące kotwice: sort, czyszczenie, paginacja (`Dropdown.astro:154`, `filters.ts:232`, `Pagination.astro:47,65,85,99`). W kodzie i na produkcji nie ma ani jednego `rel=nofollow`, `robots.txt` nie ma reguły dla filtrów.
- Bramka Search Console z `filter-crawl-trap` nierozwiązana.
- Search nie zawęża: `DATASET_QUERY` bierze top 50 bez progu (`dataset-provider.ts:5-8`), więc `zzzqqqxyz` daje 50 wyników. Najlepszy wynik dla „kajaki" to `fotobudka-ai`. To istniejący problem, poza tą zmianą.

### 7. Zasięg zmian

| Pole | Główni konsumenci | Ryzyko |
|---|---|---|
| Hotel `numberOfRooms` | tylko filtr (`Listing.astro:193-194,265-308`) | niskie, pole może zostać |
| Hotel `maxPeople.*` | `HotelCard.astro:19,178`, `offer/Hero.astro:553-585`, `FeaturedHotelsList.astro:13`, blogowe `Cta.astro:45` | dodawać obok, nie zmieniać |
| Hotel `stars` | karta, Hero, filtr, `filters.ts:76-77`, `SelectFilter.astro:518` | wymaga zmiany walidacji i parsera |
| Hotel `amenities` | filtr | nie kasować dokumentów |
| `location` | obie karty, oba listingi, `ContactForm/index.astro:97,200` | jedna kolekcja dla hoteli, przestrzeni i formularza, więc zmiana nazwy dotyka wszystkich |
| Przestrzeń `maxPeople` | karta, Hero:529, `SingleEventSpacePage.astro:47,144`, `EventSpacesPage.astro:85,135` | dodawać obok |
| Przestrzeń `isIndoor` | `Hero.astro:463`, `SingleEventSpacePage.astro:48,145` | trzecia wartość psuje wyświetlanie |
| Przestrzeń `features` | tylko filtr | najniższe |

- Bez zależności (grep): maile, Sheets, Meta/GA, JSON-LD, warianty InquiryForm, podglądy Studio, sitemapa. Koszyk i wyceny już nie istnieją.
- Embeddingi nie korzystają z tych pól, reindeks nie jest potrzebny. Pułapka: `dataset-embeddings.ts:64-71` pisze plik z flagą `wx`, a plik już istnieje, więc `enable --apply` by padł (wnioskowane).
- Nowy typ dokumentu rejestruje się w trzech miejscach: `sitemap-index.xml.ts:15-29`, `revalidation-map.ts:134`, `structure/schema-types.ts` + `structure/index.tsx`. Bez tego lista filtra może być przestarzała do godziny (ISR), a sitemapa może reklamować 404.
- Nagłówki filtrów są hardcodowane w każdym komponencie, nie ma wspólnego słownika. Wersje EN dla Otoczenia, typu wydarzenia, charakteru, zaplecza i „Bez oficjalnej kategoryzacji" trzeba dopiero napisać.
- Testów filtrów nie ma, istnieje tylko `tests/search/*`. Typy są ręczne.
- Studio: CI wdraża produkcyjne Studio także przy pushu na `dev` (`.github/workflows/sanity-deploy.yml`), a dataset jest jeden. Zmiany schematu muszą więc najpierw być kompatybilne wstecz.

## Code References

- `apps/astro/src/components/hotels/Listing.astro:178-204` - klauzule GROQ filtrów hoteli
- `apps/astro/src/components/hotels/Listing.astro:231-293` - liczniki opcji
- `apps/astro/src/components/hotels/Listing.astro:1391,1427,1570` - hardcode multi-selectu dla udogodnień
- `apps/astro/src/components/event-spaces/Listing.astro:80-95` - klauzule GROQ filtrów przestrzeni
- `apps/astro/src/components/event-spaces/Listing.astro:158-160` - order i paginacja w GROQ
- `apps/astro/src/components/ui/SelectFilter.astro:31,34,88-125` - zera, stan, opcje
- `apps/astro/src/utils/filters.ts:72-99` - parser, błąd `minRooms`
- `apps/astro/src/utils/filters.ts:269-287` - lista parametrów `buildFilterUrl`
- `apps/astro/src/components/ui/EventSpaceCard.astro:24-52` - propsy karty
- `apps/astro/src/components/offer/Hero.astro:463` - ternary `isIndoor`
- `apps/astro/vercel.json:16-80` - ręczne rewrity
- `apps/astro/astro.config.ts:36-39` - wykluczenia ISR
- `apps/sanity/schema/collectionTypes/Hotels_Collection.ts:209-274` - gwiazdki, pokoje, pojemności
- `apps/sanity/schema/collectionTypes/EventSpaces_Collection.ts:190-243` - `maxPeople`, `isIndoor`
- `apps/sanity/schema/singleTypes/EventSpaces_Page.ts:76,121` - przedziały filtrów w Sanity
- `apps/sanity/constants.ts:27,79` - dataset i `apiVersion`

## Architecture Insights

- `/filtr/` istnieje po to, żeby strony bazowe zostały na ISR, a dynamika była zamknięta w jednej trasie. Pełny rewrite po stronie klienta odrzucono (`filtering-refractor-plan.md:9-30`). Nowe filtry wpasowują się w ten układ i nie wymagają wysp.
- Spójność hoteli i przestrzeni kończy się na współdzielonych komponentach UI. Logika zapytań jest podwojona celowo. Tańsza droga to rozszerzyć SelectFilter o generyczny multi-select i zostawić dwa osobne Listingi, bo framework filtrów był już odrzucony z powodu budżetu.
- Konwencja: stałe listy idą inline przez `options.list` (`isIndoor`, `voivodeship`), listy edytowalne jako kolekcja z `language`, `name`, `slug`. Inline omija problem PL/EN, który zepsuł dziś amenities i features.
- Konwencja migracji: skrypty `@sanity/client` z dry-run i `--apply`, nowe pole dodawane obok starego, stare ukrywane jako `readOnly` (`per-category-activity-management`).
- Parametry multi w URL mają już wzorzec: lista po przecinku (`amenities=a,b`). Powtarzane parametry nie są obsługiwane.

## Historical Context (from prior changes)

- `context/archive/filtering-refractor-plan.md:170-197` - znane pułapki: podwójne `/filtr/`, utrata parametrów paginacji, reset strony, stary `vercel.json`.
- `context/archive/event-spaces-implementation-strategy.md:672-675` - obiecane MVP: lokalizacja, cechy, m², pojemność.
- `context/archive/event-spaces-implementation-strategy.md:420-438` - obiekt wielu pojemności był rozważany, wdrożono jedną liczbę.
- `context/archive/event-spaces-implementation-strategy.md:1218` - ponowne użycie amenities oznaczono jako ryzyko.
- `context/archive/sanity-bandwidth-optimization` - koszty Sanity to głównie obrazy, API CDN 23,4 GB tygodniowo w maju 2026.
- `context/archive/per-category-activity-management` - wzorzec: stare pola ukrywamy, nie kasujemy.

## Related Research

- `context/changes/filter-route-cache-bypass/change.md` - status `new`, blokuje przestrzenie, hipoteza z sierpnia potwierdzona i doprecyzowana w sekcji 1.
- `context/changes/filter-crawl-trap/plan.md` - status `planned`, wszystkie pola otwarte, częściowo nieaktualny. Dotyka `Dropdown.astro`, `Pagination.astro`, `filters.ts`, `robots.txt.ts`.
- `context/changes/soft-404-locale-routes/plan.md` - w realizacji, nie może naruszać canonicali `/filtr`.
- `context/changes/sanity-dataset-embeddings-migration/research.md` - ścieżka searcha hoteli.

Niezacommitowana zmiana w `activites/category/Listing.astro` przestawia ładowanie skryptu filtrów aktywności i nie dotyczy tej zmiany.

`context/foundation/lessons.md` nie istnieje.

## Czego nie sprawdzono

- Google, Mapbox i Geoapify nie były testowane na polskich adresach.
- Czas zapytań Sanity dla liczników nie został zmierzony.
- Search Console poza zasięgiem, stan URL-i filtrowych nieznany.
- Nie wiemy, który listing Łukasz testował, gdy pisał, że multi-select nie działa.
- Warunki Google dla współrzędnych z embedów to pytanie prawne, nie zweryfikowany wniosek.

## Open Questions

Stan pytań zmienił się 2026-11-02. Poniższe rekomendacje to zapis sprzed decyzji, a obowiązuje sekcja „Follow-up Research 2026-11-02". Dotyczy to też szacunku „około 150 edycji klienta" z Summary i sekcji 4: zasada oddania kompletu danych go zastępuje.

### 1. Czy 1200 zł netto dalej obejmuje wszystko, co wyszło w researchu?

Wycena jest zaakceptowana, ale zakres okazał się szerszy: osobna naprawa tras przestrzeni, nowe pola w dwóch językach, migracje danych, dostawca adresów. Klient nie wie też jeszcze, ile danych musi wprowadzić.

**Rekomendacja:** trzymać cenę, a spisać granice: naprawa tras na nasz koszt, dane uzupełnia klient, porządki w danych EN i dodatki poza listą wyceniane osobno. Cena jest już przyjęta, a umowna granica chroni czas lepiej niż renegocjacja.

### 2. Czy naprawiamy trasy przestrzeni przed tą zmianą?

Filtry przestrzeni na produkcji zwracają zawsze ten sam wynik z cache, a więc każda nowa opcja też nic nie zmieni. Naprawa ma już własny folder, `filter-route-cache-bypass`.

**Rekomendacja:** zrobić ją najpierw jako osobną zmianę, z obsługą 404 na paginacji filtrowej. To blokuje weryfikację połowy upsellu.

### 3. Co ma znaczyć wybór przedziału uczestników?

Hotel ma w danych maksimum, np. bankiet 500 osób. Jeśli filtr „101–200" sprawdza to maksimum dosłownie, hotel na 500 osób nie pokaże się grupie 150 osób, choć ją zmieści.

**Rekomendacja:** przedziały w UI zostają, ale obiekt pasuje, gdy jego maksimum jest co najmniej dolną granicą przedziału. Użytkownik szuka miejsca dla swojej grupy, nie obiektu o dokładnie takim maksimum. Potwierdzić z Łukaszem.

### 4. Kto i kiedy uzupełni dane przestrzeni?

Oferta mówi, że Otoczenie uzupełnia klient, ale przy przestrzeniach nie mówi nic. Pojemności wnętrze/plener, typ wydarzenia, charakter i zaplecze trzeba wpisać przy 13 obiektach, a pojemności wnętrza BezSłowa nie ma nigdzie.

**Rekomendacja:** klient, tak jak przy hotelach, przed wdrożeniem na produkcję. Tylko on zna te liczby, a filtry bez danych będą puste.

### 5. Jak zrobić skróconą listę udogodnień?

Klient chce 7–8 pozycji, ale hotele mają 706 referencji do pozostałych, a nowe „SPA / Wellness" ma 2 hotele przy 80 na starym „Spa". Usuwanie dokumentów to setki kliknięć, a filtr SPA w tej chwili byłby prawie pusty.

**Rekomendacja:** uporządkowana lista referencji w `Hotels_Page` (pierwsze 4 widoczne), bez kasowania dokumentów, plus skrypt przepinający Spa i jezioro. Kolejność daje klientowi kontrolę nad „Pokaż więcej". Wymaga też decyzji, co z 7 hotelami, które mają „Teren outdoor" za basen zewnętrzny.

### 6. Jak zapisać „Bez oficjalnej kategoryzacji" i które hotele to są?

Dziś każdy hotel ma 3–5 gwiazdek i walidacja nie pozwala na nic innego. Bez listy od klienta opcja w ogóle się nie pokaże, bo opcje z zerem są ukryte.

**Rekomendacja:** wartość `0` i zmiana inputu w Studio, a klient wskazuje hotele. Pole zostaje wymagane, więc nikt nie pominie go przez przypadek, a karta przy 0 po prostu nie rysuje gwiazdek.

### 7. Skąd wziąć współrzędne obiektów i jak klient doda kolejne?

Współrzędne są tylko w URL-ach embedów, czasem to środek widoku, a warunki Google mogą ograniczać ich wydobywanie. Nowy hotel bez punktu po cichu wypadnie z filtra odległości.

**Rekomendacja:** geokodować adresy przez dostawcę opartego na OSM, odchylenia ponad 1 km względem embeda przejrzeć ręcznie, zapisać do pola `geopoint`. W Studio pole wymagane z instrukcją „prawy klik w Google Maps, skopiuj współrzędne". Dane OSM można przechowywać, a pole wymagane chroni przed cichym znikaniem obiektów.

### 8. Który dostawca adresów i na czyim koncie?

Hotele nie potrzebują API, tylko adres w przestrzeniach. Geoapify jest darmowy i hostowany w UE, ale wymaga widocznej atrybucji i nie testowaliśmy polskich adresów. Google jest prawdopodobnie najlepszy, ale wymaga konta rozliczeniowego i ogranicza przechowywanie współrzędnych do 30 dni.

**Rekomendacja:** Geoapify po teście 20 adresów, na koncie Fabryki Atrakcji, przez nasz proxy w `/api`. Administratorem danych odwiedzających jest klient, a proxy chowa klucz i pozwala ograniczyć boty. Klient musi zaakceptować link „Powered by Geoapify".

### 9. Co z adresem w URL-u?

Filtry trzymają stan w URL-u, a URL trafia do Mety, Google Sheets i logów. Adres biura w linku to zbędna ekspozycja, szczególnie u jednoosobowej firmy prowadzonej z domu.

**Rekomendacja:** w URL-u tylko współrzędne zaokrąglone do 3 miejsc (około 100 m), tekst adresu w `sessionStorage`, parametry usuwane przed wysyłką do analityki i Sheets. Polityka prywatności do uzupełnienia o dostawcę. Link da się dalej udostępnić, a adres nigdzie nie wycieka.

### 10. Jakie lokalizacje ma pokazać filtr przestrzeni?

Wszystkie 18 przestrzeni jest w okolicach Warszawy, więc filtr będzie miał jedną opcję, a „Kraków i okolice" nie ma czego pokazać. Kolekcja lokalizacji jest też wspólna z hotelami i formularzem kontaktowym.

**Rekomendacja:** nowy dokument „Warszawa i okolice" zamiast zmiany nazwy, przepięcie 18 przestrzeni, filtr widoczny dopiero od dwóch opcji z danymi. Zmiana nazwy zmieniłaby też etykiety w formularzu.

### 11. Czy angielska wersja jest w zakresie i na jakim poziomie?

Oferta o EN milczy. Dziś filtry EN cech i lokalizacji przestrzeni są puste, a 45 z 52 hoteli EN wskazuje udogodnienia PL.

**Rekomendacja:** kod i etykiety EN w zakresie, nowe pola przez skrypt z PL na twiny EN, naprawa starych referencji amenities tylko dla listy z pytania 5. Pełne porządki EN osobno. Wersja EN działa tym samym kodem, więc pomijanie jej nic nie oszczędza, ale historycznych danych nie ma w tej cenie.

### 12. Czy zostają filtry spoza listy klienta?

Hotele mają filtr ceny, a przestrzenie filtr metrażu. Żadnego z nich nie ma na liście Łukasza, a cenę pokazuje tylko 5 z 73 hoteli PL.

**Rekomendacja:** usunąć oba z UI, dane zostają. Lista miała „uporządkować" filtry, a filtr ceny obejmuje dziś 7% hoteli. Do potwierdzenia z Łukaszem jednym zdaniem.

### 13. Czy rodzaj przestrzeni trzeba wpisywać osobno?

Trzecia wartość „wnętrze + plener" wymaga zmiany pola i wyświetlania na stronie obiektu. Skoro każda przestrzeń dostanie osobne pojemności, to rodzaj wynika z nich.

**Rekomendacja:** wyliczać go z pojemności: jest wnętrze, jest plener, są oba. Obiekt mieszany pokazywać też przy samym „Wnętrze" i samym „Plener", bo spełnia oba warunki. Oszczędza 13 edycji i wyklucza sprzeczne dane.

### 14. Jaki punkt reprezentuje Trójmiasto?

Promień liczymy od jednego punktu, a Gdańsk i Gdynia są oddalone o 20 km. Przy 25 km wynik mocno zależy od wybranego miejsca.

**Rekomendacja:** Sopot jako jeden punkt, bo leży 9–11 km od obu. Klient może go zmienić w Sanity, a kilka punktów komplikuje zapytanie bez wyraźnego zysku.

### 15. Czy odległość w hotelach to jedno miasto i bez km na karcie?

Oferta obiecuje sortowanie i km na karcie tylko przy przestrzeniach, a „każdy filtr z multi-selectem" dotyczy też odległości. Dwa miasta z dwoma promieniami byłyby trudne do pokazania.

**Rekomendacja:** jedno miasto i jeden promień, bez km na karcie i bez zmiany sortowania, dokładnie jak w ofercie. Zgodne z umową, reszta to ewentualny kolejny upsell.

### 16. Czy lista zaplecza jest kompletna?

Łukasz napisał „np." i podał trzy pozycje, a przy udogodnieniach hoteli podobne hasło zmieniało się w trakcie. Bez ostatecznej listy nie zaprojektujemy pola ani etykiet EN.

**Rekomendacja:** poprosić Łukasza o zamkniętą listę przed planem i zrobić ją inline. To jedno pytanie na Slacku, a zmiana listy po wdrożeniu kosztuje nową publikację Studio.

## Follow-up Research 2026-11-02: decyzje i zakres końcowy

Decyzje podjął Oliwier 2026-11-02. Mają pierwszeństwo przed rekomendacjami z sekcji Open Questions.

### Zasady

1. **Cena.** Pełny zakres, razem z oboma naprawami z etapu 1, mieści się w 1200 zł netto. Niczego nie ucinamy.
2. **Sanity przede wszystkim.** Co się da, edytor ustawia sam, bez dewelopera.
3. **Oddajemy komplet.** Klient dostaje gotowy upsell z pełnymi danymi. Czego nie wiemy, wpisujemy jako dane robocze i wskazujemy je klientowi. Łukasz przegląda dane w Sanity i sam je zmienia, my nie mamy już nic do zrobienia. Nie czekamy na niego przed wdrożeniem. Arkusz z sekcji o podziale prac odpada.
4. **Wielojęzyczność.** Każdy dokument ma wersję PL i EN, zgodnie z obecną konwencją. Łukasz dostaje informację, żeby tak je tworzyć.

### Decyzje

| Temat | Decyzja |
|---|---|
| Naprawy tras i `filter-crawl-trap` fazy 1–2 | pierwszy etap tej zmiany, po aktualizacji planu `filter-crawl-trap` |
| Dokumenty opcji | osobne dokumenty PL i EN połączone tłumaczeniem, nie jeden dokument z dwiema nazwami |
| Rodzaj i pojemność przestrzeni | lista par: rodzaj (dokument) + pojemność. „Wnętrze + plener" działa automatycznie dla obiektów z dwoma rodzajami, nazwa w Sanity. Nowy rodzaj dostaje własny filtr pojemności bez dewelopera |
| Przedziały uczestników | obiekt pasuje, gdy jego maksimum sięga co najmniej dolnej granicy przedziału. Potwierdził Oliwier, Łukasz nie jest potrzebny |
| Dane przestrzeni | wypełniamy my, niepewne jako robocze |
| Udogodnienia | uporządkowana lista w `Hotels_Page`, przepięcie Spa i jeziora skryptem, 7 hoteli z „Teren outdoor" przechodzi na „Basen". Łukasz koryguje później w Sanity |
| Bez oficjalnej kategoryzacji | wartość `0`, nazwa w Sanity. Hotele Łukasz oznacza sam. Opcja pokaże się po oznaczeniu pierwszego hotelu, bo opcje z zerem są ukryte |
| Współrzędne | robimy sami, autonomicznie: geokodowanie po OSM, przegląd odchyleń ponad 1 km od embeda, wymagane pole w Studio z instrukcją |
| Dostawca adresów | Geoapify po teście 20 adresów, na koncie Fabryki Atrakcji, przez endpoint w `/api`, rezerwa Google Places |
| Adres w URL-u | współrzędne zaokrąglone do 3 miejsc, tekst w `sessionStorage`, parametry usuwane przed analityką i Sheets |
| Lokalizacje przestrzeni | nowy dokument „Warszawa i okolice", przepięcie 18 przestrzeni, filtr widoczny od dwóch opcji z danymi |
| EN | naprawiamy wszystko, co dotyka nowych filtrów. Tłumaczenie 22 hoteli i 8 przestrzeni bez wersji EN zostaje poza zmianą |
| Filtr ceny hoteli | wypada |
| Filtry metrażu i cech przestrzeni | wypadają z frontu i z Sanity, zakres niżej |
| Odległość w hotelach | jedno miasto, jeden promień, bez km na karcie i bez zmiany sortowania |
| Trójmiasto | Sopot, do zmiany w Sanity |
| Udogodnienia i zaplecze | wszystkie zaznaczone naraz (AND). Potwierdził Oliwier |
| Lista zaplecza | start od trzech pozycji Łukasza, kolejne dodaje sam w Sanity |

### Zakres końcowy

**Etap 1, naprawy.** `filter-route-cache-bypass` z 404 na filtrowanej paginacji, potem `filter-crawl-trap` fazy 1–2.

**Etap 2, Sanity.**
- Dokumenty PL i EN: Otoczenie, rodzaj, typ wydarzenia, charakter, zaplecze, miasta ze współrzędnymi.
- W `Hotels_Page` i `EventSpaces_Page`: przedziały, promienie, kolejność opcji, nagłówki filtrów, liczba widocznych udogodnień, nazwy opcji specjalnych.
- Nowe pola: `geopoint`, Otoczenie, lista par rodzaj + pojemność, typ, charakter, zaplecze.
- Pola referencji pokazują tylko dokumenty w języku edytowanego obiektu, żeby nie powtórzyć błędu z amenities.
- Rejestracja nowych typów w `revalidation-map.ts`, `sitemap-index.xml.ts` i `structure/`.

**Etap 3, hotele.** Filtry po zmianie: region, standard, udogodnienia, szukaj, odległość, liczba uczestników, Otoczenie. Wypadają pokoje i cena.

**Etap 4, przestrzenie.** Filtry po zmianie: lokalizacja, szukaj, pojemność, odległość od adresu, rodzaj, typ wydarzenia, charakter, zaplecze. Wypadają metraż i cechy. Do tego naprawa sortowania „Polecane" i „Od najnowszych", km na karcie, sortowanie od najbliższej i stan pustych wyników.

**Etap 5, migracja danych skryptami z dry-run.**
- Startowe dokumenty: 21 opcji i 7 miast, razem 56 z wersjami EN.
- Współrzędne wszystkich 143 obiektów. Do jednorazowego geokodowania wystarczy Photon i GUGiK, klucz Geoapify nie jest potrzebny.
- Otoczenie 73 hoteli na podstawie opisu, miasta i regionu, oznaczone jako robocze.
- Typ, charakter, zaplecze i rodzaj 13 przestrzeni na podstawie treści, oznaczone jako robocze.
- Pojemności: `maxPeople` jako pierwsza para według `isIndoor`, a dla 8 kandydatów na obiekt mieszany druga para z wartością roboczą.
- Przepięcia udogodnień i lokalizacji.
- EN: przeniesienie nowych pól na 51 par hoteli i 5 par przestrzeni, referencje do dokumentów EN, poprawa 5 hoteli EN z lokalizacją PL, wyrównanie 7 par o różnych pojemnościach do wartości PL (robocze, m.in. Folwark Łochów 1077 i 309).

**Etap 6, prywatność.** Dopisujemy dostawcę do `PrivacyPolicy_Page`, PL i EN, oraz link „Powered by Geoapify". Polityka jest dokumentem w Sanity, więc robimy to sami, a zapis trafia na listę do sprawdzenia przez klienta.

**Etap 7, przekazanie.** Wiadomość do Łukasza z listą danych roboczych, instrukcją tworzenia dokumentów PL i EN, opisem dodawania współrzędnych oraz informacją o opcji „Bez oficjalnej kategoryzacji".

### Co dokładnie znika z Sanity

Sprawdzone w kodzie 2026-11-02.

- **Cechy przestrzeni:** usuwamy pole `features`, kolekcję `EventSpaceFeatures_Collection` i jej 9 dokumentów oraz wpisy w `structure/`, `schema-types.ts`, `revalidation-map.ts:114` i `sitemap-index.xml.ts:24`. Korzysta z nich tylko filtr. Kolejność: najpierw front, potem pole, potem dokumenty, bo referencje są mocne. Zastępuje to konwencję „stare pole ukrywamy", na wyraźne życzenie Oliwiera.
- **Metraż:** usuwamy `areaFilterOptions` z `EventSpaces_Page.ts:121` i filtr. Pole `areaM2` zostaje, bo wyświetlają je karta (`EventSpaceCard.astro:180`) i strona obiektu (`offer/Hero.astro:497`).
- **Pokoje i cena hoteli:** znikają tylko filtry. `numberOfRooms` i `pricing` zostają jako dane obiektu.

### Dane do budowy danych roboczych (Sanity, odczyt 2026-11-02)

- 73/73 hoteli PL ma tekst, minimum 975 znaków, mediana 1890. Słowa kluczowe nie wystarczą: 4 hotele bez trafień, 57 z dwoma lub więcej Otoczeniami, więc propozycje wymagają czytania opisów.
- 13/13 przestrzeni PL ma tekst, „Miejsce - przestrzeń eventowa" tylko 319 znaków.
- Kandydaci na obiekt mieszany, 8 z 13: Waldorffa 25, Kwadrat Praski, Art Bistro Stalowa52, Stodoła Rasztów, Piękno, Restauracja „Na Cyplu", Akademia Kulinarna GoCook (sygnały w tekście) i BezSłowa (wskazana przez Łukasza).

### Otwarte

**Kto zakłada konto Geoapify?** Klucz jest potrzebny do testu 20 adresów, a konto ma należeć do Fabryki Atrakcji. Założyć je musi człowiek.
