# Project Type Quick Reference

The "Focus Skills" column below lists external Tessl-registry skill identifiers to search for via Phase 1's `tessl_search` — they are not files present in this repo.

| Type | Focus Skills | Key Metrics | NFRs |
|------|-------------|-------------|------|
| Static site (Eleventy/Hugo) | web-performance, web-accessibility-essentials, seo, aeo-geo-agent, playwright-testing | Lighthouse perf/a11y/SEO, axe coverage, CSS/JS size | SEO, accessibility, performance |
| SPA (React/Vue/Svelte) | web-performance, playwright-testing, frontend-security-coder, design-system | Lighthouse, test coverage, bundle size, axe coverage | Performance, a11y, security, state management |
| SSR (Next.js/Nuxt) | web-performance, playwright-testing, frontend-security-coder, seo | Lighthouse, TTFB, test coverage, SEO score | Performance, SEO, security, caching |
| Backend API | security-hardening, ci-cd-pipelines, behavioural-tdd, gdpr-test-patterns | Security audit, test coverage, CI gates, API response time | Security, reliability, scalability, privacy |
| Mobile (React Native) | web-performance, web-accessibility-essentials, playwright-testing | Performance, a11y compliance, bundle size | Performance, a11y, offline support |
| Library/Package | behavioural-tdd, codebase-test-suite-audit, ci-cd-pipelines | Test coverage, API stability, build time | Maintainability, reliability, documentation |

## NFR Checklist — which are relevant?

| NFR | Static Site | SPA | SSR | Backend | Mobile | Library |
|-----|:-----------:|:---:|:---:|:-------:|:------:|:-------:|
| Performance | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ |
| Accessibility | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| Security | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ |
| SEO | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Testing | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| CI/CD | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Analytics | ✅ | ✅ | ✅ | ⚠️ | ⚠️ | ❌ |
| Design System | ✅ | ✅ | ✅ | ❌ | ⚠️ | ❌ |
| Marketing | ✅ | ⚠️ | ⚠️ | ❌ | ❌ | ❌ |
| Privacy/GDPR | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ |
| Internationalization | ⚠️ | ⚠️ | ⚠️ | ❌ | ⚠️ | ❌ |
| PWA/Offline | ❌ | ⚠️ | ❌ | ❌ | ✅ | ❌ |
| Error Tracking | ⚠️ | ✅ | ✅ | ✅ | ✅ | ⚠️ |
| Monitoring | ⚠️ | ⚠️ | ⚠️ | ✅ | ⚠️ | ⚠️ |
| Content Quality | ✅ | ⚠️ | ⚠️ | ❌ | ❌ | ❌ |
| Maintainability | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Scalability | ⚠️ | ⚠️ | ✅ | ✅ | ⚠️ | ✅ |

✅ = critical | ⚠️ = relevant | ❌ = not relevant
