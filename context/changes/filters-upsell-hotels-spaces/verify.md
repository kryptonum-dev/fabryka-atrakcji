---
schema_version: 1
change_id: filters-upsell-hotels-spaces
created: 2026-11-02
updated: 2026-11-02
run: 1
status: findings-open
---
<!-- VERIFY-REPORT -->
# Verification — filters-upsell-hotels-spaces

## Summary

WCAG and SCSS audits of the changed filter components ran on 2026-11-02, on production first and on a local dev server after the fixes. The audits found 10 defects worth fixing, and all 10 are fixed: F1 to F10. Two findings stay open on purpose: F11 is duplicated filter styling that the audit rules say not to extract automatically, and F12 is a contrast failure outside the filter components.

The semantics and SEO lanes were excluded, because plan Phase 10 scopes the audit to WCAG and SCSS. SEO behaviour of filter routes is covered by `verify.sh`. No ledger stamp was written, because `context/foundation/views.md` does not exist.

This report states which checks ran and how. It does not claim conformance.

## Coverage

- **Source:** branch `main`, footprint below, content hash `7da92fdb91c3be2d` (sha256 of the concatenated files, first 16 characters), taken after fixes.
- **Runtime before fixes:** production `https://www.fabryka-atrakcji.com`, build `3296abc`.
- **Runtime after fixes:** local `astro dev` on port 4321 with the repo `.env`. Production recheck is recorded under History.
- **Selection:** the plan's "changed filter components". There is no `views.md`, so the two views below are local ids, not ledger rows.
- **Exclusions:** semantics and SEO lanes, as `--skip semantics,seo`.
- **Locales:** PL and EN.
- **States:** default listing, filtered, filtered with address point, empty radius result, no results with disabled groups, drawer open, combobox open with mocked suggestions, error and empty suggestion states.
- **Viewports:** 1440, 375, and 320 for reflow.
- **Tools:** `a11y-runtime.mjs` with axe 4.11 and `--no-overlays`, plus a scripted Playwright probe for overlays and interactions, with `/api/contact`, `/api/newsletter`, `/api/s3d` and `/api/analytics` aborted and `/api/geocode` mocked. Cookie banner answered with "Tylko niezbędne". `ast-grep` 0.45 for the CSS Module class proof.
- **Footprint:** `apps/astro/src/components/ui/SelectFilter.astro`, `apps/astro/src/components/hotels/DistanceFilter.astro`, `apps/astro/src/components/event-spaces/AddressFilter.tsx`, `apps/astro/src/components/event-spaces/AddressFilter.module.scss`, `apps/astro/src/components/hotels/Listing.astro`, `apps/astro/src/components/event-spaces/Listing.astro`, `apps/astro/src/components/ui/HotelCard.astro`, `apps/astro/src/utils/filter-drawer.ts`.

| View | WCAG | SCSS | Semantics | SEO |
| --- | --- | --- | --- | --- |
| hotels-listing — Hotele, listing i filtry | fail (F12 open, outside filter components) | fail (F11 open) | skipped | skipped |
| event-spaces-listing — Przestrzenie eventowe, listing i filtry | pass | fail (F11 open) | skipped | skipped |

## Views

<a id="view-hotels-listing"></a>
### hotels-listing — Hotele, listing i filtry

URLs: `/pl/hotele/`, `/en/hotels/`, `/pl/hotele/filtr/?overnight=101-200&amenities=basen&city=warszawa&radius=150`, `/pl/hotele/filtr/?location=mazury-i-pojezierze&city=krakow&radius=25`. Polish pass: not recorded.

| Check | Result | Evidence |
| --- | --- | --- |
| axe, filters region, drawer open at 375 | pass | 0 violations on the filtered URL after fixes. Incomplete: colour contrast on two selects with a background image. Text `#45051c` on `#fffbfb` is 15.55:1 by hand, and a disabled select is exempt. |
| axe, `main`, 1440 and 375, production before fixes | fail, then fixed except F12 | link-name 16, nested-interactive 3, color-contrast 6 |
| Tab walk through filters | pass | 44 stops before fixes included 3 invisible stops. After fixes all stops are visible. |
| Focus ring on hidden inputs | pass | The label `::before` draws a 2px ring. The script's "no focus style" rows for these inputs are a false positive. |
| Show more | pass | `aria-expanded` flips, 4 options become 8, focus stays on the button. |
| Drawer open, Escape, close, background | pass after F4 | Focus moves to the close button, Escape closes, focus returns to "Filtruj", background is inert. |
| Focus not obscured, 1440 | pass after F5 | 5 stops fully behind the sticky bar before, 0 after. Measured after smooth scroll settled. |
| Reflow 320 | pass | Document width 320. Body scroll width 843 comes from a decorative absolute SVG and the logo marquee, clipped by `overflow-x: clip`, with no 2-D scrolling. |
| Text spacing, 375 | pass after F6 | No clipped labels. |
| Reduced motion | pass | 0 running animations. |
| Star option names, PL and EN | pass after F1 | "5 gwiazdek 7", "5 stars 3". |
| Disabled groups exposed | pass after F8 | `aria-disabled="true"` on 6 groups of the no-results URL. |
| axe, hero and content blocks outside filters | fail | F12 |
| SCSS: unused classes, tokens, conventions, hygiene | pass after F10 | Selector scan of each `<style>` block against its markup and scripts. |
| SCSS: duplication | fail | F11 |

<a id="view-event-spaces-listing"></a>
### event-spaces-listing — Przestrzenie eventowe, listing i filtry

URLs: `/pl/przestrzenie-eventowe/`, `/en/event-spaces/`, `/pl/przestrzenie-eventowe/filtr/?lat=52.233&lng=20.985&radius=5`, `/pl/przestrzenie-eventowe/filtr/?lat=50.061&lng=19.937&radius=1`, `/en/event-spaces/filter/?spaceType=mixed`. Polish pass: not recorded.

| Check | Result | Evidence |
| --- | --- | --- |
| axe, filters region, drawer open at 375, EN | pass | 0 violations after fixes. Incomplete: contrast on `.value` with a pseudo-element and on `.clear-filters`, same token pair as above. |
| axe, combobox open | pass | 0 violations, 0 incomplete. |
| Combobox keyboard, PL and EN | pass | Arrow keys move `aria-activedescendant`, Enter selects, Escape closes and shows the hint, Tab reaches the clear button. |
| Combobox messages | pass | Count, hint, empty and error text all reach the `role="status"` element. |
| Address chip | pass after F3 and F9 | Summary name reads "Odległość od adresu Wybrany punkt, 5 km". Mouse clear works and leaves the group closed. |
| Drawer, reflow, text spacing, reduced motion | pass | Same results as hotels-listing. |
| CSS Module classes | pass | All 11 classes in `AddressFilter.module.scss` have a `styles.*` use by `ast-grep`, no computed access, one importer. |
| SCSS: duplication | fail | F11 |

## Findings

### [F1] High · low · confirmed — Star options had only a number as their name
- Status: fixed
- Lanes / checks / affected views: wcag, Standard filter names, hotels-listing
- Locations: `apps/astro/src/components/hotels/Listing.astro`
- Evidence: aria snapshot read `checkbox "7"`, the result count, with the stars as nameless images.
- Reference: 1.1.1 Non-text Content (A), 4.1.2 Name, Role, Value (A)
- Impact and proposed fix: a screen reader user could not tell the options apart. Stars are now hidden from the tree, next to visually hidden text with Polish plural forms.
- History: 2026-11-02 found on production, fixed, rechecked in PL and EN.

### [F2] High · low · confirmed — Hotel card link had no name
- Status: fixed
- Lanes / checks / affected views: wcag, axe link-name, hotels-listing
- Locations: `apps/astro/src/components/ui/HotelCard.astro:133`
- Evidence: axe link-name, 90 nodes across runs. The attribute was misspelled `aira-label`.
- Reference: 2.4.4 Link Purpose (A), 4.1.2 (A)
- Impact and proposed fix: one word. Every card in filter results had an unnamed link.
- History: 2026-11-02 fixed.

### [F3] High · low · confirmed — Selected-value chip was an invisible Tab stop inside a summary
- Status: fixed
- Lanes / checks / affected views: wcag, keyboard and axe nested-interactive, both views
- Locations: `SelectFilter.astro`, `DistanceFilter.astro`, `AddressFilter.tsx`
- Evidence: Tab stopped on `BUTTON.selected-value` at opacity 0 in open groups. Clearing it by keyboard dropped focus to `BODY`. axe reported nested-interactive, serious. `tabindex="-1"` did not satisfy axe.
- Reference: 2.4.7 Focus Visible (AA), 2.4.3 Focus Order (A), 4.1.2 (A)
- Impact and proposed fix: the chip is now a plain span with a click handler, a mouse shortcut. Keyboard users clear through the options, the city select or the address field, and the chip text stays in the summary's name. The handler now calls `preventDefault`, otherwise a click would also toggle the group.
- History: 2026-11-02 first attempt with `tabindex="-1"` failed axe, replaced, rechecked.

### [F4] High · low · confirmed — Mobile drawer did not manage focus
- Status: fixed
- Lanes / checks / affected views: wcag, overlay probe, both views
- Locations: new `apps/astro/src/utils/filter-drawer.ts`, both `Listing.astro` files
- Evidence: opening left focus on "Filtruj" and the next Tab reached "Sortowanie" behind the overlay. Escape did nothing. Closing dropped focus to `BODY`. `aria-hidden="true"` stayed on the sidebar after a resize to desktop, where it is visible.
- Reference: 2.4.3 Focus Order (A), 2.1.1 Keyboard (A), 4.1.2 (A)
- Impact and proposed fix: one helper now gives both listings the same dialog behaviour, with `inert` on everything outside. A first version focused after two animation frames and lost the race on hotels, so it retries until the button takes focus.
- History: 2026-11-02 fixed, rechecked 6 runs in a row.

### [F5] Medium · low · confirmed — Sticky action bar covered focused filters
- Status: fixed
- Lanes / checks / affected views: wcag, focus obscured, both views
- Locations: `.filters-content` in both `Listing.astro` files
- Evidence: 5 stops fully hidden at 1440×900, for example a 44 px option at y 825–869 under a bar at 819–900.
- Reference: 2.4.11 Focus Not Obscured (Minimum) (AA)
- Impact and proposed fix: `scroll-margin-bottom` on the focusable controls. 0 hidden stops after the fix.
- History: 2026-11-02 fixed. An early measurement was wrong because of smooth scrolling, so the probe now waits for it.

### [F6] Medium · low · confirmed — Long labels were cut off in the drawer
- Status: fixed
- Lanes / checks / affected views: wcag, reflow and text spacing, both views
- Locations: `SelectFilter.astro`, `DistanceFilter.astro`, `AddressFilter.module.scss`
- Evidence: at 320, 8 option labels ended in an ellipsis with no way to read them, for example "Premiera / pokaz / event promocyjny" 213/133 px. Long headings pushed the chevron out of its box.
- Reference: 1.4.10 Reflow (AA), 1.4.12 Text Spacing (AA)
- Impact and proposed fix: labels wrap, headings can shrink, and the chip gives way first.
- History: 2026-11-02 fixed, 0 clipped at 320 and with text spacing applied.

### [F7] Medium · low · confirmed — Close button was named in English on Polish pages
- Status: fixed
- Lanes / checks / affected views: wcag, names, both views
- Locations: both `Listing.astro` files
- Evidence: `aria-label='Close filters'` on `/pl/` routes.
- Reference: 3.1.2 Language of Parts (AA), 2.4.6 Headings and Labels (AA)
- Impact and proposed fix: label now comes from the translation table.
- History: 2026-11-02 fixed.

### [F8] Low · low · confirmed — Disabled filter groups were not exposed as disabled
- Status: fixed
- Lanes / checks / affected views: wcag, states, both views
- Locations: `SelectFilter.astro`, `DistanceFilter.astro`, `AddressFilter.tsx`
- Evidence: a disabled summary stayed focusable and silent.
- Reference: 4.1.2 (A)
- Impact and proposed fix: `aria-disabled` on the summary.
- History: 2026-11-02 fixed.

### [F9] Medium · low · confirmed — Address chip name hid its visible text
- Status: fixed
- Lanes / checks / affected views: wcag, names, event-spaces-listing
- Locations: `AddressFilter.tsx`
- Evidence: `aria-label="Wyczyść adres"` on a chip showing the address and radius.
- Reference: 2.5.3 Label in Name (A)
- Impact and proposed fix: the label is gone, so the summary reads the chosen address. `title` keeps the hint for mouse users.
- History: 2026-11-02 fixed.

### [F10] Low · zero · confirmed — SCSS hygiene
- Status: fixed
- Lanes / checks / affected views: scss, both views
- Locations: filter components and both `Listing.astro` files
- Evidence: `transition: all`, colour and opacity transitions without `linear` or with spatial easing, `0rem`, a duplicated `display`/`place-items` pair, undefined `--primary-300`, dead `[data-zero-count]` and `.stars-row` rules on spaces, commented-out declarations, and token fallbacks in the two new files, one of which did not match its token.
- Reference: `kryptonum-styling` section 4, `scss-audit` scopes A, B and E
- Impact and proposed fix: all removed or corrected. `--primary-300` set a background on an element that only shows on hover or selection, where other rules set it, so removing it changes nothing on screen.
- History: 2026-11-02 fixed. Decorative SVG icons also left the accessibility tree.

### [F11] Low · high · confirmed — Filter group styles repeated in three files
- Status: open
- Lanes / checks / affected views: scss scope D, both views
- Locations: `SelectFilter.astro`, `DistanceFilter.astro`, `AddressFilter.module.scss`
- Evidence: `summary`, `.selected-value` and `.icon` rules are the same in all three, about 100 lines each.
- Reference: `scss-audit` scope D, which says to flag and not extract
- Impact and proposed fix: a change to the group header must be made three times. A shared SCSS mixin would fix it, which the plan's "no generic filter framework" rule does not forbid but also did not ask for. Left for a later cleanup.
- History: 2026-11-02 recorded, not extracted.

### [F12] Medium · needs-review · confirmed — Contrast failure in a content block on hotel listings
- Status: open
- Lanes / checks / affected views: wcag, axe color-contrast, hotels-listing
- Locations: `.item > h2 > strong`, a content block on `/pl/hotele/` and `/en/hotels/`, 6 nodes
- Evidence: axe serious in every hotel run. The block is not a filter component and this change did not touch it.
- Reference: 1.4.3 Contrast (Minimum) (AA)
- Impact and proposed fix: a design decision about a brand colour, outside this audit's scope, so it was left alone.
- History: 2026-11-02 recorded.

## Fixes and decisions

- F1 to F10 fixed as authorised by the Phase 10 task, which asked to fix what the audit finds.
- F11 and F12 stay open, and their checks stay failed. Neither was accepted by the owner.
- `context/foundation/views.md` is missing, so no ledger row exists and no stamp was written. The skill asks for seeding through `10x-roadmap`, which needs a person.

## Limitations

- No screen reader ran. Names and roles were read from the accessibility tree, not heard.
- Axe is a floor. Automated tools find a fraction of accessibility problems.
- `--no-overlays` was used on purpose, because that probe presses Enter on buttons and the page has real forms. The overlay checks ran through the Playwright probe with form requests aborted.
- The script's "unreached" list contains header links and the closed sort menu. Those are outside the filters, and the script starts its walk after the consent banner. Not investigated further.
- axe incomplete items outside the filters stayed unresolved: `aria-prohibited-attr` on `.response-badge` and `.logo-marquee`, and `duplicate-id-aria` in the contact form's phone field.
- The chip's mouse target is under 24 px tall. It passes the 2.5.8 equivalent-control exception, because the same action is available through 44 px controls.
- Forms were never submitted. Suggestions in the keyboard probe were mocked.

## History

- 2026-11-02, run 1: first audit on production at `3296abc`, fixes on a local dev server.
