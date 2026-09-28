---
name: responsive-visual-review
description: Use when you need a structural visual review of a website across breakpoints (mobile/tablet/desktop) to catch layout breaks, overflow, and spacing issues without a baseline or hosted regression service. NOT for CRO/conversion/copy review, NOT for new UI design work, NOT for automated pixel-diff regression gating in CI, NOT for accessibility/contrast auditing.
---

# Responsive Visual Review

A one-shot, structural visual review of how a website actually renders across
screen sizes — not a pixel-diff regression tool, not a conversion/copy audit,
not an aesthetic design critique. It answers one question: **does the layout
hold together at mobile, tablet, and desktop widths, right now?**

Works on any website (static, SPA, SSR, CMS) — all it needs is a reachable
URL (local dev server or live). No baseline, no third-party visual-regression
account, no prior screenshot history required.

## When not to use this

- **Conversion, copy, brand positioning, funnel review** → use a
  landing-page or CRO audit skill. This skill does not judge
  whether copy persuades or a CTA converts — only whether the layout renders
  correctly.
- **New UI/visual design work** → use a frontend design skill. This skill reviews
  what already exists; it doesn't design anything new.
- **Automated pixel-diff regression gating in CI** → use a dedicated
  visual-regression tool, or the project's own screenshot baseline if one
  exists. This skill produces no
  baseline and does no pixel diffing — every run is a fresh structural read,
  useful for ad-hoc/pre-deploy checks, not for CI gating.
- **Accessibility** (contrast ratios, ARIA, screen readers, keyboard nav) →
  use an accessibility audit skill or automated accessibility scanner. This skill looks at layout
  integrity, not WCAG compliance — a page can pass this review and still
  fail accessibility, and vice versa.
- **Single-breakpoint bug already reported with a screenshot** → just fix it;
  this skill is for systematic multi-breakpoint sweeps, not one-off triage.

## Phase 0 — Scope

1. **Target**: confirm the base URL (local dev server, e.g.
   `http://localhost:8080`, or a live URL) and, if the site is
   multi-language, which language(s) to sample — one is usually enough
   unless layout differs meaningfully per language (e.g. longer strings in
   German, RTL scripts). When reviewing a live site and a local checkout
   also exists, note which commit is deployed: a finding that the local
   build no longer has is reported as **fixed, not deployed**, not as a
   new bug.
2. **Pages to sample** (ask if not obvious, or infer from the site map):
   - Homepage
   - One representative content/detail page (article, product, listing item)
   - One page with a form (signup, contact, checkout)
   - One page with long-form or typography-heavy content (tests text
     wrapping, line-length, heading hierarchy at narrow widths)
   - Any page the user specifically flagged
   Default to 3-5 pages. More than 8 pages in one run dilutes the review —
   split into multiple runs instead.
3. **Breakpoints** — default set, override if the project's own CSS
   breakpoints differ:
   - 360×800 (mobile — the narrowest common phone width; most layouts
     that break at 375–390 already break here)
   - 768×1024 (tablet, portrait)
   - 1440×900 (desktop)
   Add 1920×1080 only if the site has a distinct wide-desktop layout worth
   checking.

## Phase 1 — Capture

For each page × breakpoint combination, capture a **full-page** screenshot
(not just the viewport) — layout breaks below the fold are the most common
kind missed by manual spot-checks.

Use whatever browser automation is available in the environment (an
automation tool the agent can drive, or a short script with a headless
browser): set the viewport, load the page, capture full-page.

**Measure overflow as well — screenshots can't show it.** An element that
is invisible (`opacity: 0`, `visibility: hidden`, positioned off-screen)
still widens the page and causes horizontal scroll on a phone. On each
page × breakpoint, run this in the page and record the result:

```js
(() => {
  const vw = document.documentElement.clientWidth;
  const overflow = document.documentElement.scrollWidth - vw;
  const offenders = [...document.querySelectorAll('body *')]
    .filter((el) => el.getBoundingClientRect().right > vw + 1)
    .map((el) => `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).join('.') : ''}`)
    .slice(0, 10);
  return { overflow, offenders };
})()
```

`overflow > 0` is a finding even when every screenshot looks fine; the
offender list names where to look (the outermost offender is usually the
cause, its children inherit the overflow).

Name captures predictably: `<page-slug>-<breakpoint-label>.png` (e.g.
`homepage-mobile.png`), saved to the scratchpad directory — this is a
throwaway review artifact, not something to commit.

## Phase 2 — Structural checklist

Walk every captured screenshot against this checklist. Compare the same
page across its three breakpoints side by side where a finding spans more
than one.

**Layout integrity**
- [ ] No overlapping elements (text over images, buttons over nav)
- [ ] No horizontal scroll/overflow at any breakpoint — from the measured
      `overflow` value, not the screenshot
- [ ] Nav/menu collapses to a usable mobile pattern (not just shrunk)
- [ ] Grid/flex layouts reflow sensibly, not squeezed into unreadable columns
- [ ] Sticky/fixed elements (headers, CTAs) don't cover content or each other

**Text**
- [ ] No truncated or clipped text (unless intentional with visible affordance)
- [ ] No orphaned single words or awkward line breaks in headings
- [ ] Line length stays readable at wide breakpoints (not full-bleed walls of text)
- [ ] Heading hierarchy still visually holds (h1 > h2 > h3 sizing) at every width

**Images & media**
- [ ] No broken images (alt-text box instead of image)
- [ ] No images stretched/distorted or cropped to lose their subject
- [ ] Aspect ratios consistent within a repeated component (cards, thumbnails)
- [ ] No visible layout shift artifacts from lazy-loaded images (blank gaps)

**Spacing & consistency**
- [ ] Consistent spacing rhythm between sections (no sudden gap/cramp)
- [ ] Touch targets (buttons, links) look large enough for the mobile breakpoint
- [ ] Forms: labels/inputs stay aligned and readable, no field overflow
- [ ] Footer/header consistent across the sampled pages at the same breakpoint

**Cross-breakpoint regressions**
- [ ] Nothing that renders correctly at desktop breaks specifically at tablet
      (the most commonly under-tested breakpoint)
- [ ] Nothing present at desktop silently disappears at mobile without a
      deliberate mobile-specific alternative

## Phase 3 — Findings

Report findings severity-ranked, each with: page, breakpoint, screenshot
reference, and a one-line description of what's wrong — concrete enough to
act on (e.g. "pricing table overflows viewport at 360px, third column cut
off" not "mobile layout needs work").

| Severity | Examples |
|----------|----------|
| Critical | Content unreadable/inaccessible at a breakpoint, broken checkout/signup form layout, horizontal scroll on primary pages |
| High | Overlapping elements, broken images on key pages, nav unusable on mobile |
| Medium | Inconsistent spacing, awkward text wrapping, minor cross-breakpoint drift |
| Low | Cosmetic nitpicks, non-critical page, wide-desktop-only quirks |

Do not fix anything automatically — hand the findings back for triage,
the same way an audit skill reports, rather than editing CSS/templates
inline. If the user wants fixes applied, treat that as a separate,
explicit follow-up step per finding — small, verified, one at a time.
