# Implementation Roadmap for CartaBridge NFR Backlog

## The Situation

CartaBridge runs a React SPA — a customer dashboard serving roughly 10,000 active users. Following their quarterly NFR audit, the engineering team has been handed a list of findings that need to be addressed before the next release. The tech lead has asked for a written implementation roadmap, because multiple stakeholders (QA, legal, ops) need visibility into what will be done in what order.

The audit surfaced these findings:

| ID | Finding | Domain | Severity |
|----|---------|--------|----------|
| G1 | HTTP requests are not redirected to HTTPS in the nginx configuration | Security | Critical |
| G2 | No Content-Security-Policy header is present in server responses | Security | High |
| G3 | Product images are served as PNG/JPG instead of WebP format | Performance | Medium |
| G4 | Unit test coverage is at 45%, well below the 80% target | Testing | Medium |
| G5 | Analytics cookies are set before the user has given consent | Privacy/GDPR | Medium |
| G6 | The UI has no dark mode support | Design System | Low |

The team is also planning to introduce a centralized security middleware layer — a new Express middleware component that will handle header injection for multiple NFR domains going forward. This is a significant architectural change to the existing SSR setup.

Since CartaBridge runs this audit quarterly, the tech lead also wants to understand how to approach the *next* audit cycle (three months from now, assuming the tech stack and installed tools remain the same).

## Deliverable

Write a complete implementation roadmap to `docs/implementation-plan.md`. The document should give the team clear, step-by-step guidance on:

- The order in which to tackle each finding, with rationale
- What steps to follow when implementing each fix, and how to verify success before moving on
- Example commit messages for changes in each phase
- How to handle the privacy/GDPR finding before any code changes happen
- A retrospective template for the team to fill in after each phase is complete
- A section advising the team on how to run the next quarterly re-audit efficiently
