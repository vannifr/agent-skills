---
name: cross-browser-render-check
description: Systematic multi-engine (Chromium/Firefox/WebKit) rendering comparison for a website — catches browser-specific CSS/layout/JS bugs that a single-engine review misses. Works on any website, any stack. Trigger on "check cross-browser", "does this work in Safari/Firefox", "browser compatibility review", or before shipping a CSS/JS change that uses a newer or engine-specific feature. NOT for viewport/breakpoint layout review (use responsive-visual-review — same engine, different widths, a different axis entirely), NOT for functional/interaction E2E testing across browsers (use playwright-testing — this skill is visual/rendering-only, no click-throughs), NOT for designing a polyfill/feature-detection fix (flag the gap with a suspected cause, don't architect the remedy).
---

# Cross-Browser Render Check

Renders the same pages in Chromium, Firefox, and WebKit at one fixed
viewport and diffs what a human would notice — font fallbacks, layout
quirks, unsupported CSS features, console errors unique to one engine.
Works on any website; no existing multi-browser test setup required,
though it will reuse one if the project already has Playwright projects
configured per engine.

## When not to use this

- **Different screen widths, same engine** → `responsive-visual-review`.
  This skill holds the viewport fixed and varies the engine instead.
- **Functional testing across browsers** (does the checkout flow work in
  Safari) → `playwright-testing` / the project's own E2E suite. This skill
  never clicks anything — it only compares what renders.
- **A single already-reported browser bug** → just fix it; this skill is
  for systematic sweeps, not one-off triage.
- **Deciding how to fix a found incompatibility** (polyfill, `@supports`
  fallback, drop the feature) — that's a design decision for the person
  fixing it, not something to prescribe from a rendering diff alone.

## Phase 0 — Scope

1. Reuse the same page set as `responsive-visual-review` if a recent run
   exists (homepage, one content/detail page, one form page, one
   long-form/typography-heavy page — 3-5 pages total).
2. Pick one fixed, non-mobile viewport (992×900 is a reasonable default —
   distinct from `responsive-visual-review`'s breakpoint sweep so the two
   skills don't overlap). Add a mobile-width pass only if the site's mobile
   experience diverges meaningfully between engines (rare, but WebKit's
   mobile emulation quirks are a known exception).

## Phase 1 — Capture

For each page, capture a full-page screenshot in each of the three
engines at the same viewport:
- Playwright MCP tools, switching `browser_type` per engine, or
- `npx playwright test --project=chromium --project=firefox --project=webkit`
  if the project already has a multi-browser Playwright config (check
  `playwright.config.ts` first — most projects only run Chromium by
  default; don't assume multi-engine config exists).
- Capture browser console output per engine alongside the screenshot —
  engine-specific JS errors are a common, easy-to-miss finding.

Name captures `<page-slug>-<engine>.png`, saved to the scratchpad
directory (throwaway review artifact, not for commit).

## Phase 2 — Checklist

Compare the three screenshots per page side by side.

**Rendering**
- [ ] Font fallback/rendering consistent (no missing-glyph boxes, no wildly
      different line-height causing reflow)
- [ ] Flexbox/Grid layout identical across engines (Safari's older Grid
      gaps and Firefox's flexbox min-content defaults are classic
      divergence points)
- [ ] CSS features used actually supported in all three engines — check
      caniuse.com for any feature the site uses that isn't universally
      safe (`:has()`, container queries, `backdrop-filter`,
      `text-wrap: balance`, subgrid, `:focus-visible` quirks)
- [ ] Form control default styling (checkboxes, radios, `<select>`,
      date/time inputs) — Safari and Firefox diverge most here
- [ ] Scrollbar/overlay behavior (Firefox's overlay scrollbar vs
      WebKit/Chromium's reserved gutter can shift layout width)
- [ ] Video/audio codec or format actually plays in all engines if the
      page embeds media

**Console**
- [ ] No JS errors present in one engine but not the others (a common
      sign of a missing polyfill or an engine-specific API assumption)

## Phase 3 — Findings

Severity-ranked, each with: page, engine(s) affected, screenshot pair
(reference engine vs divergent engine), and a suspected CSS/JS cause
where identifiable — "Safari renders the pricing grid columns unequal
width, likely `grid-template-columns: auto` interacting with old Safari
Grid `auto` sizing" is actionable; "looks different in Safari" is not.

| Severity | Examples |
|----------|----------|
| Critical | Page unusable or content inaccessible in one engine |
| High | Visible layout break, broken form control, engine-unique JS error breaking a feature |
| Medium | Noticeable but non-blocking visual divergence (font rendering, spacing) |
| Low | Cosmetic-only, sub-pixel differences a user wouldn't consciously notice |

Report findings for triage — this skill does not fix the underlying CSS/JS.
