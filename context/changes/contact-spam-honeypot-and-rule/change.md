---
change_id: contact-spam-honeypot-and-rule
title: Honeypot blocks real leads — require BotID agreement before rejecting
status: new
created: 2026-07-29
updated: 2026-07-29
archived_at: null
---

## Notes

Follow-up to `3b6367e` (fix(contact-spam): honeypot + timing gate, BotID in log-only mode,
deployed to prod 2026-07-27 16:42, `dpl_Dnj4udrYy5WkbQnXfQCzzpA6sNYv`). That commit claimed
the honeypot carried "zero false-positive risk". It does not.

### What the 2-day check (2026-07-29) found

Vercel runtime-log retention is ~1 day, not 2 — the oldest `[BOTLOG]` line available on
2026-07-29 was from 2026-07-28 22:33. So the observation window is ~19h, not 48h. Every
`[BOTLOG]` event in that window maps 1:1 to a Google Sheet row (`/api/s3d` beacon fires
~3s before the `/api/contact` POST), so the window is complete but short.

All 6 events in the window:

| Time (CEST) | Verdict | Reason | elapsedMs | BotID | Email |
|---|---|---|---|---|---|
| 07-28 22:33 | 400 | honeypot | 31s | `isBot: true` | yamili@targetparkusa.com |
| 07-29 08:57 | 200 | passed | 4m38s | `isHuman: true` | zofia.wlodarczyk1@gmail.com |
| 07-29 10:01 | 400 | **honeypot** | 6m35s | **`isHuman: true`** | **karolina.rojek@ifb-poland.pl** |
| 07-29 10:01 | 400 | **honeypot** | 6m52s | **`isHuman: true`** | **karolina.rojek@ifb-poland.pl** (retry) |
| 07-29 11:13 | 400 | **honeypot** | 4m42s | **`isHuman: true`** | **olga.las@simon-kucher.com** |
| 07-29 15:12 | 200 | passed | — | `isHuman: true` | e.deren@ideosoftware.com |

**Honeypot scoreboard: 4 rejections, 3 of them false positives (75%).** Of the 4 real leads
on 2026-07-29, 2 were blocked — a 50% loss rate.

Two real B2B leads were dropped (rows exist in the Sheet with full content; no email was
ever sent):
- **IFB International Freightbridge Poland** — karolina.rojek@ifb-poland.pl, ~55 people,
  asking about availability. Submitted twice, got the generic 400 both times, gave up.
- **Simon Kucher & Partners** — olga.las@simon-kucher.com, coach from Mordor + team activities.

### Root cause

Chrome/Edge ignore `autocomplete="off"` for address-profile autofill. The honeypot field was
named `companyWebsite`; Chromium's `kCompanyRe` heuristic matches the `company` substring and
classifies it as COMPANY_NAME. When the user accepts an autofill suggestion on the name/email
field, the browser fills *every* field it classified in that form — including the honeypot.

Supporting evidence (inference, not proof — the honeypot value was never logged): both blocked
leads have a company name in the Sheet's "Imię / Firma" column (`IFB INTERNATIONAL FREIGHTBRI…`,
`Simon Kucher & Partners`), i.e. their Chrome profile had an organization value to write. Both
were Chrome/Edge on Windows desktop. The one lead that passed on mobile (Zofia, iPhone Safari)
was unaffected — Safari maps fields differently.

Ruled out: programmatic prefill. `InquiryForm.tsx` and `FaqForm/Form.tsx` have no `setValue`,
no `defaultValues`, no localStorage restore — only `reset()` after a successful submit. The
value comes from outside the app.

### BotID behaved the opposite way

6/6 correct, 0 false positives, `headerPresent: true` on every request. The April failure mode
(`c17a8ea` — a missing `x-is-human` header treated as proof of a bot) did not reproduce. Caveat:
the bot sample is n=1, so this is a trend, not a proof.

### Spam: inconclusive

Sheet rows are *attempts*, not successes (the `/api/s3d` beacon fires client-side before
`/api/contact`, so a blocked bot still writes a row). Pre-deploy 07-20→07-26: ~38 rows (~6.4/day).
Post-deploy: 07-27 → 3, 07-28 → 7, 07-29 → 0. Attempt volume essentially unchanged; one clean day
is not a signal. Burst *shape* did change: pre-deploy bursts were 3–5 submissions, by the evening
of 07-28 they had shrunk to 1 — consistent with the bot getting a 400 and giving up. No spam
reached email during the observation window.

Operational note: the Sheet keeps getting polluted regardless of blocking, because the beacon
fires first. `STATUS` is `NOWY` on all 128 July rows, so that column carries no signal.

### Decision

Rename alone was rejected as the fix — it can't be verified without exposing real leads for
another day, and the honeypot's track record is 1 bot caught vs 3 leads lost. Instead:

1. **Reject only when both signals agree**: `honeypotTripped && botid.isBot === true`. Strict
   `=== true` so `null`/unknown BotID verdicts fall through to accept, preserving the fail-open
   posture from `3b6367e`. Against the observed data this rule saves all 3 real leads and still
   blocks yamili.
2. **Harden the honeypot field anyway** (cleaner logs): neutral `name`/`id` with no
   `company`/`website`/`url` token, drop the "Strona firmowa" label text, add `readonly`
   (Chrome skips readonly fields for autofill; readonly fields are still submitted, unlike
   `disabled`, which would never send the value and would make the honeypot inert).
   Do **not** use `autocomplete="new-password"` — that invites password managers to target it.
3. **Log a truncated honeypot value** (32 chars) so the Chrome-autofill hypothesis becomes a
   fact rather than an inference on the next check.

Timing gate (`MIN_FILL_MS = 3000`) never fired in the window and stays as-is.

### When coming back in ~2 days (≈ 2026-07-31)

Check, in this order:

- `vercel logs --scope kryptonum --project fabryka-atrakcji --since 1d --limit 500 --query "BOTLOG" --json -x`
  (retention is ~1 day — anything older is gone; do not plan on a 2-day lookback again).
- Any line with `verdict: rejected` where `botid.isHuman === true` → the AND rule leaked; escalate.
- Any `honeypotTripped: true` with `botid.isBot: false` → confirms Chrome autofill is still
  filling the hardened field; read `honeypotValue` to see what it wrote.
- Any `verdict: accepted` with `botid.isBot: true` → spam getting through; BotID may be ready
  to become the primary gate on its own.
- Cross-check against the Sheet: every Sheet row should still have exactly one `/api/contact`
  POST ~3s later.

Longer term: if BotID holds up over several days it is the real gate and the honeypot becomes
redundant. Retention is the binding constraint on this whole rollout — without a log drain or
Observability Plus, these checks have to happen daily, not every other day.

Open item unrelated to the code: lead **Monika Bukowska / Romgos** (m.bukowska@romgos.pl,
2026-07-28 08:06) falls outside log retention. Whether an email went out can only be confirmed
in the `lukasz@fabryka-atrakcji.com` mailbox.
