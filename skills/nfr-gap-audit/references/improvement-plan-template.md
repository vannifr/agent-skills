# Phase 4-6 — Improvement Plan, Implementation, Retrospective Templates

## Phase 4: Improvement plan — default order

### Phase 1: Quick Wins
- Expand axe test coverage to all pages
- Add `loading="lazy"` to below-fold images
- Standardize JSON-LD schema
- Add BreadcrumbList schema where needed
- Run a landing page audit
- Fill in missing meta tags

### Phase 2: Security Hardening
- Remove CSP unsafe-inline where possible
- Add SRI integrity to all CDN resources
- Complete security headers
- Resolve dependency vulnerabilities

### Phase 3: Performance Optimization
- Audit CSS for unused rules
- Add CSS minification to the build
- Image optimization (WebP conversion where needed)
- Optimize font loading
- Reduce bundle size

### Phase 4: Testing Expansion
- Raise coverage where risk is highest first: rank files by uncovered lines × criticality (auth, money, data writes, parsing), not by what's easiest to test
- E2E tests for critical user journeys
- Add visual regression tests
- Performance budget tests
- Expand cross-browser tests
- Mobile viewport tests

### Phase 5: Analytics & Monitoring
- Activate analytics tool
- Configure event tracking
- Set up conversion tracking
- Install error tracking (Sentry)
- Configure uptime monitoring

### Phase 6: Design System & Architecture
- Document design tokens
- Improve CSS organization
- Add a component catalog
- Test and improve responsive design

### Phase 7: Content & Marketing
- Implement landing page audit findings
- Improve copy based on audit findings
- Strengthen social proof
- Add a lead magnet
- Set up a content governance process

## Phase 5: Commit conventions

```
feat(domain): short description
fix(domain): short description
docs(domain): short description
test(domain): short description
security(domain): short description
perf(domain): short description
refactor(domain): short description
```

## Phase 6: Retrospective template

```markdown
## Retrospective — Phase [X]: [Name]

### What was done?
- [ ] Item 1
- [ ] Item 2

### What worked well?
- ...

### What could be better?
- ...

### New GAPs discovered?
- ...

### Scores before/after?
| Metric | Before | After | Δ |
|--------|------|-----|---|
| ... | ... | ... | ... |
```

## Final report — structure

`docs/skill-audit-report.md` (or the project's equivalent):

1. **Executive Summary** — mode (full/recheck), project type, tech stack, overall status, companion skills used, which reviews ran with a reviewer vs. the [fallback](review-fallback.md)
2. **Installed Skills** — table with all skills (before/after, source, relevance)
3. **Baseline Scores** — header block + ID'd table in the [baseline template](baseline-template.md) shape
4. **GAP Analysis** — per domain, sorted by severity
5. **Improvement Plan** — 7 phases with actions and priorities
6. **Implementation Results** — per phase: what was done, scores before/after
7. **Retrospectives** — per phase
8. **Open Actions** — non-code items (dashboard actions, client contact, etc.), every ⏸️ baseline row, and links to later recheck reports
9. **Recommendations** — next steps, long-term improvements
