<!-- IMPL-REVIEW-REPORT -->
# Implementation Review: Sanity Bandwidth Optimization

- **Plan**: context/changes/sanity-bandwidth-optimization/plan.md
- **Scope**: All Phases (1-4 of 4)
- **Date**: 2026-05-27
- **Verdict**: APPROVED
- **Findings**: 0 critical, 2 warnings, 2 observations

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| Plan Adherence | PASS |
| Scope Discipline | PASS |
| Safety & Quality | WARNING |
| Architecture | PASS |
| Pattern Consistency | PASS |
| Success Criteria | PASS |

## Findings

### F1 — No input guard on sanityImageUrl

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: apps/astro/src/utils/sanity-image.ts:2
- **Detail**: `new URL(baseUrl)` throws TypeError if baseUrl is empty, null, or malformed. If a Sanity asset has a broken reference, this crashes the page render with an unhelpful error.
- **Fix**: Add early guard: `if (!baseUrl) throw new Error('sanityImageUrl: baseUrl is required')`
- **Decision**: FIXED

### F2 — Dead `await` on synchronous optimizeImage

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: apps/astro/src/utils/optimize-images.ts:12
- **Detail**: Function changed from async to sync but 3 call sites still use `await`. Harmless but misleading.
- **Fix**: Remove `await` from TestimonialsPopup/index.astro:38, ActivitiesCarousel/index.astro:61, HighlightedBlogPosts/index.astro:41.
- **Decision**: FIXED

### F3 — OG image dimensions are strings instead of numbers

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW
- **Dimension**: Safety & Quality
- **Location**: apps/astro/src/layouts/Head.astro:45-46
- **Detail**: width/height are '1200'/'630' (strings) instead of numbers. Works fine in meta content attributes.
- **Decision**: SKIPPED

### F4 — srcset entries may not be sorted by width

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW
- **Dimension**: Safety & Quality
- **Location**: apps/astro/src/utils/sanity-image.ts:17-19
- **Detail**: When maxOriginalWidth is pushed into filtered array, result isn't re-sorted. All browsers handle unsorted srcsets per spec.
- **Decision**: SKIPPED
