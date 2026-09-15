# Skill Discovery for an SSR E-Commerce Storefront

## Background

Prism Commerce recently acquired the Lumio storefront — a server-side-rendered Next.js application that powers product listings, cart management, and Stripe-based checkout for a mid-size retailer. The original development team had not set up any automated non-functional-requirement (NFR) auditing tooling before the handover, and the new team wants to get proper coverage in place quickly.

Your first task is to identify and install the agent skills needed to support a full NFR audit on this project. The project's agent configuration is at `inputs/tessl.json` and its dependency manifest is at `inputs/package.json`. As you can see from `inputs/tessl.json`, no agent skills are currently installed.

Before any code changes or performance measurements can happen, the right domain-specific skills must be discovered and put in place. Identify what skills are available and relevant to this type of project, classify them by relevance to the project, and install the ones that are a strong or moderate fit.

## Output Specification

Write a skill discovery report at `docs/skill-discovery-report.md`. The report should document the sources you searched, the skills you found and how you evaluated them, the decisions you made about what to install, and any follow-up work that remains. Include all commands you ran.
