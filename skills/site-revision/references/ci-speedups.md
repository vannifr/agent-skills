# CI speed-ups and cache fixes found during revisions

Apply only after measuring: record the duration of each pipeline step
first, and compare after the change.

## Sampled lab performance audit per push, full run on a schedule

A lab performance audit (e.g. Lighthouse) on every page is often most of
the pipeline time, while performance and accessibility regressions come
from shared layouts, CSS and JavaScript. Page-level problems (missing alt
text, heading order) are caught faster by a page-level accessibility
scanner (e.g. pa11y or axe), which stays on every page.

1. **Pick a sample**: one page per layout/template, both languages for the
   home page, the 404 page, and the heaviest page per template (most
   images, longest FAQ), plus pages with a form or a wide table. A small
   fraction of the site's total pages is usually enough.
2. **Make the sample fixed** in the performance-audit config. If a build
   step regenerates the URL list from the build output, stop it doing
   that for the performance audit (keep it for the accessibility
   scanner), or the full list returns on the next build.
3. **Generate a full config for the scheduled run**: a script mode that
   writes a copy of the performance-audit config with every built page,
   without touching the original. Unit-test that the original stays
   byte-identical and the copy contains every page; mutation-test the
   function.
4. **Coverage check**: require every sitemap URL in the accessibility
   scanner's list; for the performance audit only require that every
   sample URL still exists in the build output (a stale sample silently
   measures nothing).
5. **Scheduled pipeline**: add a schedule/cron trigger that runs only
   install, build and the full performance-audit run. Every other step,
   and **deploy in particular**, must be limited to push events. Steps
   without their own trigger condition inherit the pipeline's triggers and
   would also run on the schedule; give them an explicit push condition.
   Print each step's triggers from the parsed pipeline file to confirm.
6. **Schedule when the runner is on**: a self-hosted runner on a
   workstation is often off at night; plan the run on a weekday during the
   day, with an explicit time zone. Spread schedules across repositories.
7. **Trigger the schedule once by hand** and confirm the step list: no
   deploy, full URL count, green.

Typical result: a large drop in per-push pipeline duration, with full
coverage preserved on the weekly run.

## Content hash in CSS/JS URLs

A CDN can keep serving an old stylesheet for hours under the same URL
while the HTML is already new. A live check with a cache-buster query
misses this, because it bypasses exactly that cache.

1. Diagnose: request the asset URL as the page references it; look at
   `cache-control`, the cache status header and `age`.
2. Reference assets with a hash of their content, computed at build time
   (e.g. `styles.css?v=<first 10 hex chars of sha256>`). Frameworks with a
   bundler usually do this already; check before adding it.
3. Only after the hashed URLs are live, give hashed assets and fonts a
   long cache (`max-age=31536000, immutable`). Earlier, browsers would
   keep the old file for a year.
4. Verify via the hashed URL the page references, not with a
   cache-buster. An object already in the edge keeps its old headers
   until its URL changes.
5. Images without a hash: when replacing one, use a new file name.

## Measuring

Record per pipeline: total duration and duration per step, before and
after. Keep the numbers in the plan's retrospective.
