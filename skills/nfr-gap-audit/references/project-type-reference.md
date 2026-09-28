# Project Type Quick Reference

The "Search topics" column lists the domains to search for in Phase 1 for each project type.

| Type | Search topics | Key Metrics | NFRs |
|------|-------------|-------------|------|
| Static site | web performance, accessibility, SEO, answer-engine optimisation, E2E testing | Lab perf/a11y/SEO score, automated accessibility scan coverage, CSS/JS size | SEO, accessibility, performance |
| SPA | web performance, E2E testing, frontend security, design system | Lab audit score, test coverage, bundle size, automated accessibility scan coverage | Performance, a11y, security, state management |
| SSR app | web performance, E2E testing, frontend security, SEO | Lab audit score, TTFB, test coverage, SEO score | Performance, SEO, security, caching |
| Backend API | security hardening, CI/CD pipelines, TDD, GDPR testing | Security audit, test coverage, CI gates, API response time | Security, reliability, scalability, privacy |
| Mobile app | performance, accessibility, E2E testing | Performance, a11y compliance, bundle size | Performance, a11y, offline support |
| Library/Package | TDD, test-suite audit, CI/CD pipelines | Test coverage, API stability, build time | Maintainability, reliability, documentation |

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
