# NFR Domains — Full List

Automatically identify which of these NFRs are relevant for the project.

**Performance**
- Lighthouse scores (perf, a11y, best-practices, SEO)
- CSS/JS bundle size
- Image optimization status
- Font loading strategy
- Core Web Vitals (LCP, INP, CLS)

**Accessibility**
- WCAG compliance level (A / AA / AAA)
- Axe test coverage (how many pages?)
- Screen reader compatibility
- Keyboard navigation
- Color contrast compliance

**Security**
- Security headers (CSP, HSTS, X-Frame-Options, etc.)
- SRI on CDN resources
- Input validation
- XSS prevention
- Secret management
- Dependency vulnerabilities

**SEO**
- Meta tags completeness
- Structured data (JSON-LD) coverage
- Heading hierarchy
- Internal linking
- Sitemap quality
- hreflang (multi-language?)

**Testing**
- Unit test coverage %
- E2E test coverage
- Visual regression testing
- Accessibility test coverage
- Performance budget testing

**Reliability**
- Error handling
- Graceful degradation
- Offline support (PWA?)
- Backup/recovery strategy

**Maintainability**
- Code organization
- Documentation quality
- Design system consistency
- CSS architecture
- Component reusability

**Scalability**
- Build time
- Asset optimization at scale
- CDN usage
- Caching strategy

**Privacy/Compliance**
- GDPR compliance
- Cookie consent
- Data retention policy
- Privacy policy completeness
- Analytics privacy

**Internationalization**
- Multi-language support
- RTL support
- Locale-specific content
- Translation workflow

**Monitoring**
- Analytics tool
- Error tracking (Sentry, etc.)
- Uptime monitoring
- Performance monitoring
- Conversion tracking

**Content Quality**
- Copy quality
- Tone of voice consistency
- Content freshness
- Content governance
- Editorial workflow

## Grounding in ISO/IEC 25010

Most of these domains map onto ISO/IEC 25010 software quality
characteristics — citing the standard gives each domain a shared, external
reference point instead of reading as an ad-hoc list:

| Domain | ISO/IEC 25010 characteristic |
|---|---|
| Performance | Performance Efficiency (time behaviour, resource utilization) |
| Scalability | Performance Efficiency (capacity) |
| Accessibility | Usability (accessibility sub-characteristic) |
| Security | Security |
| Privacy/Compliance | Security (confidentiality) — ISO 25010:2011 has no dedicated privacy characteristic; the 2023 revision's "Safety" characteristic is the closer fit if that revision applies |
| Testing | Maintainability (testability sub-characteristic) |
| Reliability | Reliability |
| Maintainability | Maintainability |
| Internationalization | Portability (adaptability) |
| Monitoring | Reliability (availability, fault tolerance) — monitoring is an operational practice that supports this characteristic, not a characteristic itself |
| SEO | Not in ISO 25010 — a web-specific discoverability concern, not a general software quality characteristic |
| Content Quality | Not in ISO 25010 — a content/editorial concern, not a software product quality characteristic |
