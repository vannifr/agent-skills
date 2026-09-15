# NFR Audit for Launchpad Landing Page

## Problem Description

The marketing team at a small SaaS company has asked for a quality audit of their public-facing landing page before a major product launch next month. The site is a simple static website — a single `index.html` served directly from a CDN with a linked stylesheet and some vanilla JavaScript. There is no server-side rendering, no build pipeline, and no backend API.

The team has heard that many performance, accessibility, security, and privacy issues get overlooked on simple static sites because they seem "too small to matter." They want a thorough, structured assessment: which non-functional requirement (NFR) categories are actually applicable to this type of project, what the current state of the site is measured against those categories, and a prioritised plan for what to fix first.

No one on the team has done a formal NFR audit before. They need both the findings and an actionable plan they can hand to a developer, so every identified gap should be clear enough to act on — concrete examples of the fix, not just abstract descriptions.

## Your Task

1. **Create the project.** Write a minimal but realistic static landing page to disk as `site/index.html`, `site/style.css`, and `site/main.js`. The page should represent a typical SaaS landing page: a hero section with a headline and call-to-action button, a features grid with images, a contact/newsletter form that posts to a third-party service, and a footer with social links. Include at least one third-party script tag (e.g. an analytics snippet). Deliberately leave in realistic gaps — for example, images without lazy loading attributes, a form that collects an email address without a privacy notice, missing meta tags, and no security headers configured.

2. **Audit the project.** Perform a structured NFR audit of the site you created:
   - Determine which NFR domains are applicable to a static website and note which domains are not relevant to this project type.
   - Document the current baseline state of the site across applicable domains in a table.
   - Walk through each applicable domain and identify gaps — specific issues where the site falls short of good practice.
   - Classify every gap by severity.
   - Note any gaps that may have legal or regulatory implications (the team has a lawyer who will need to review those before changes are made).
   - For every gap where a concrete change can fix it, include a short code example showing exactly what to change.
   - Produce an improvement plan listing all gaps in priority order.

3. **Write the report.** Save the completed audit report as a markdown file somewhere under the project. The report should cover: an executive summary, the current baseline state, the full gap analysis organised by domain, the improvement plan, and any actions that require decisions beyond a simple code change (such as legal or stakeholder involvement). End with a recommendations section.
