# Skill & NFR Audit — Northwind Docs

## 1. Executive Summary

- **Mode:** full audit
- **Project type:** static site (Astro 4.x), CDN-hosted, locales en + nl
- **Overall:** good performance, security headers incomplete, a11y clean

## 3. Baseline Scores

- **Measured on:** 2026-06-20 (commit `a41c9e2`)
- **Target measured:** https://staging.northwind-docs.example
- **Environment:** Lighthouse mobile preset, simulated throttling
- **Runs per metric:** 3, median reported

| ID | Domain | Metric | Command / source | Current | Target | Status | Evidence |
|---|---|---|---|---|---|---|---|
| B-PERF-1 | Performance | Lighthouse Performance (mobile) | `npx lighthouse <url> --preset=perf` | 94 | ≥90 | ✅ | |
| B-PERF-3 | Performance | Total JS transferred (home) | Lighthouse `total-byte-weight` | 120 KB | ≤300 KB | ✅ | |
| B-A11Y-1 | Accessibility | axe serious+critical, 5 pages | `npx axe <url>` | 0 | 0 | ✅ | |
| B-A11Y-2 | Accessibility | Lighthouse Accessibility | Lighthouse | 98 | ≥95 | ✅ | |
| B-SEO-2 | SEO | Broken internal links | `npx linkinator <url> --recurse` | 3 | 0 | ❌ | |
| B-SEC-1 | Security | Dependency vulns high+ | `npm audit --audit-level=high` | 1 | 0 | ❌ | |
| B-SEC-2 | Security | Security headers present | `curl -sI <url>` | 3/7 | 7/7 | ⚠️ | |
| B-I18N-1 | Internationalization | Missing nl keys | `npm run i18n:check` | 0 | 0 | ✅ | |

## 4. GAP Analysis

| GAP | Domain | Severity | Finding |
|---|---|---|---|
| G-SEC-1 | Security | High | `astro` dependency chain has 1 high advisory (GHSA-xxxx) |
| G-SEC-2 | Security | High | No Content-Security-Policy header |
| G-SEC-3 | Security | Medium | No Permissions-Policy / Referrer-Policy headers |
| G-SEO-1 | SEO | Medium | 3 broken internal links in `/guides/` |

## 8. Open Actions

- G-SEC-2: CSP draft awaiting review of the analytics vendor list
