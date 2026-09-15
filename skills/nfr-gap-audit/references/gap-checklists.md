# Phase 3 — GAP Checklists per Domain

## Performance GAP
- [ ] CSS compressed/minified?
- [ ] Images in WebP/AVIF format?
- [ ] Lazy loading on below-fold images?
- [ ] Font loading optimized (preload + media="print" onload)?
- [ ] Render-blocking resources eliminated?
- [ ] Core Web Vitals within targets?
- [ ] Bundle size optimized?
- [ ] CDN caching correctly configured?

## Accessibility GAP
- [ ] Semantic HTML correct (headings, landmarks, labels)?
- [ ] ARIA attributes present and correct?
- [ ] Keyboard navigation complete?
- [ ] Color contrast WCAG 2.1 AA compliant?
- [ ] Focus management correct?
- [ ] Screen reader tests performed?
- [ ] prefers-reduced-motion supported?
- [ ] Axe test coverage on all pages?

## SEO GAP
- [ ] Meta tags complete (title, description, canonical)?
- [ ] Open Graph tags present?
- [ ] Twitter Card tags present?
- [ ] JSON-LD structured data on all pages?
- [ ] Heading hierarchy correct (one h1, no skipped levels)?
- [ ] Internal linking present?
- [ ] Sitemap.xml correct and current?
- [ ] hreflang correct (multi-language)?
- [ ] Robots.txt correct?

## Testing GAP
- [ ] Unit test coverage ≥80%?
- [ ] E2E tests for critical user journeys?
- [ ] Visual regression tests?
- [ ] Accessibility tests on all pages?
- [ ] Performance budget tests?
- [ ] Cross-browser tests (Chromium + Firefox)?
- [ ] Mobile viewport tests?

## Security GAP
- [ ] CSP enforcing (not report-only)?
- [ ] CSP without unsafe-inline where possible?
- [ ] HSTS present?
- [ ] X-Frame-Options: DENY?
- [ ] X-Content-Type-Options: nosniff?
- [ ] Referrer-Policy present?
- [ ] Permissions-Policy present?
- [ ] SRI integrity on all CDN resources?
- [ ] No secrets in code?
- [ ] Dependency vulnerabilities resolved?

## CI/CD GAP
- [ ] Pipeline has a security gate?
- [ ] Pipeline has a build gate?
- [ ] Pipeline has a test gate?
- [ ] Pipeline has a lint gate?
- [ ] Pipeline has a deploy gate?
- [ ] Pipeline has a verify gate?
- [ ] Rollback procedure documented?
- [ ] Staging environment present?

## Analytics GAP
- [ ] Analytics tool installed?
- [ ] Event tracking configured?
- [ ] Conversion tracking active?
- [ ] Privacy-compliant (no cookie consent needed)?
- [ ] Dashboard available?

## Design System GAP
- [ ] Design tokens documented?
- [ ] Component catalog available?
- [ ] CSS organized and maintainable?
- [ ] Responsive design tested?
- [ ] Dark mode supported?
- [ ] Brand guidelines documented?

## Marketing/Copy GAP
- [ ] Value proposition clear?
- [ ] CTAs effective?
- [ ] Social proof present and credible?
- [ ] Copy consistent in tone and voice?
- [ ] Content up to date?
- [ ] Lead magnet present?

## NFR GAPs (automatically identified)
Identify extra NFRs relevant to this specific project:
- [ ] **Internationalization:** Multi-language? RTL? Locale-specific?
- [ ] **PWA:** Offline support? Service worker? App manifest?
- [ ] **Error Handling:** Global error boundary? User-friendly error pages?
- [ ] **Monitoring:** Error tracking (Sentry)? Uptime monitoring?
- [ ] **Privacy:** GDPR compliant? Cookie consent? Data retention?
- [ ] **Content Governance:** Editorial workflow? Content review process?
- [ ] **Scalability:** Build time acceptable? Asset optimization at scale?

## GAP prioritization

| Severity | Examples |
|----------|-------------|
| Critical | No CTA above fold, page load >5s, CSP broken |
| High | Missing social proof, generic headline, weak security |
| Medium | Form field friction, inconsistent tone, incomplete metadata |
| Low | Missing sticky CTA, no video, stock-like imagery |
