# Analytics & Cookie Consent Implementation Guide

This document outlines the architecture of the custom analytics system used in this project, specifically designed for Astro (SPA-like behavior) with strict GDPR compliance and support for GA4 Consent Mode (Cookieless Pings) and robust Meta Pixel/CAPI synchronization.

## Core Architecture

The system is built around three main components:
1.  **`CookieConsent.client.tsx`**: Manages the UI, user choices, and script initialization.
2.  **`track-event.ts`**: A unified API for dispatching events to multiple providers (GA4, Meta Pixel, Meta CAPI).
3.  **`analytics-user-storage.ts`**: Manages persistent user identity (hashed PII) for Advanced Matching.

---

## 1. Cookie Consent & Initialization (`CookieConsent.client.tsx`)

The consent manager handles the loading of external scripts (`gtag.js`, `fbevents.js`) based on user permissions.

### Key Features:
*   **Default Denied State**: All categories are denied by default.
*   **GA4 Consent Mode (Cookieless Pings)**:
    *   On initial load (before user choice), the GA4 script (`gtag`) is **always loaded** but initialized with `consent: default denied`.
    *   This allows GA4 to send "cookieless pings" (G100 events) for basic metrics like Page Views without storing cookies, ensuring compliance while preserving data quality.
    *   **Critical Implementation Detail**: When no consent cookie exists, we explicitly call `initializeTracking({ ...DEFAULT_SELECTIONS })` to ensure the script loads immediately.
*   **Meta Pixel Strict Blocking**:
    *   Unlike GA4, Meta Pixel does **not** have a safe "denied" mode that we trust for this implementation.
    *   Meta scripts and events are strictly blocked until the user explicitly grants `marketing` consent.

---

## 2. Event Dispatching (`track-event.ts`)

The `trackEvent` function is the single entry point for all analytics. It handles queuing, validation, and dispatching.

### Workflow:
1.  **Event Creation**: Events are assigned a unique `eventId` immediately. This ID is shared between Pixel and CAPI for deduplication.
2.  **Consent Gating**:
    *   **For GA4**: Events are processed **immediately**. If consent is denied, `gtag` handles it by sending a ping. If granted, it sends a full event.
    *   **For Meta**: Events are **queued** if consent is unknown. They wait for the `cookie_consent_updated` event. If denied, they are dropped.
3.  **Readiness Gating**: Both providers wait for `analytics_ready` signal, ensuring scripts are loaded before firing events.

### Code Example (Simplified):
```typescript
trackEvent({
  meta: { eventName: 'PageView', params: { ... } },
  ga4: { eventName: 'page_view', params: { ... } }
})
```

---

## 3. Advanced Matching & Data Quality

### Meta Advanced Matching
*   **Problem**: The standard `fbq('set', 'userData')` is often unreliable in SPAs due to race conditions.
*   **Solution**: We directly inject user data into the Pixel's internal state object: `window.fbq.instance.pixelsByID[id].userData`. This guarantees that the very next event fired (e.g., 'Lead') carries the fresh user data (email, phone) without needing a page reload.

### Meta CAPI (Server-Side)
*   **Reliability**: We use `navigator.sendBeacon` where available to ensure events (like 'Purchase' or 'Lead') are sent even if the user closes the tab immediately.
*   **Deduplication**: The `event_id` generated in `trackEvent` matches the one sent to the Pixel, allowing Meta to merge the two signals.

---

## Tips for Future Developers

1.  **Do Not Remove "Default Denied" Initialization**:
    The line `initializeTracking({ ...DEFAULT_SELECTIONS })` in the "no stored consent" block is crucial. Without it, GA4 scripts won't load until the user clicks a button, causing you to lose 100% of the "bounce" traffic data.

2.  **Meta User Data Injection**:
    If you need to debug Advanced Matching, look at `applyMetaPixelUserData` in `track-event.ts`. Do not revert to using `fbq('init', id, userData)` for updates, as it re-initializes the pixel and can cause duplicate PageViews or lost state.

3.  **Queuing Logic**:
    The split queuing logic in `trackEvent` is intentional.
    *   `GA4` = Fire immediately (trusting `gtag` to handle privacy).
    *   `Meta` = Wait for explicit consent (trusting our code to block it).
    *   **Do not merge these paths** unless Meta introduces a GDPR-compliant "ping" mode similar to Google's.

4.  **Testing Cookieless Pings**:
    *   Open Network Tab.
    *   Clear Cookies.
    *   Reload Page.
    *   Look for requests to `google-analytics.com/g/collect`.
    *   Check the payload: `gcs=G100` means "Deny" (Ping), `gcs=G111` means "Granted".

5.  **Adding New Events**:
    Always add types to `MetaEventName` and `Ga4EventName` in `analytics/types.ts` first. This ensures type safety for parameters across the codebase.

