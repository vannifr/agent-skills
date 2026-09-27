# Tool output collected 2026-09-26 (commit f07d3b1)

Same staging URL, Lighthouse mobile preset, simulated throttling, 3 runs, median.

- Lighthouse Performance (mobile): 87
- Lighthouse total-byte-weight, JS on home: 265 KB
- axe, same 5 pages: 2 serious violations
  - `aria-dialog-name`: SearchModal `<div role="dialog">` has no accessible name
  - `focus-order-semantics` / manual note: focus is not moved into SearchModal on open and not returned on close
- Lighthouse Accessibility: 91
- linkinator: 0 broken links
- npm audit --audit-level=high: 0 vulnerabilities
- curl -sI headers: strict-transport-security, x-content-type-options, x-frame-options, referrer-policy, permissions-policy (5/7); no content-security-policy
- npm run i18n:check: 0 missing keys
