---
name: site-revision
description: Use when asked for a full revision of an existing marketing or practitioner website — positioning, content, proof, bilingual parity, technical quality and CI — with every change validated on the live site. Orchestrates the whole run from customer evidence and jobs to be done (requests, won and lost proposals, feedback) and a positioning decision through a baseline persona walkthrough, work packages in customer language, a fact-and-quote verification gate, a live feedback loop with the owner, a follow-up persona walkthrough, a technical review and a final all-URL check with retrospective. Trigger on "full revision of the website", "website overhaul", "site refresh", "reposition and rewrite the site", "content and technical review, everything validated live", or when the owner reviews on the live site and wants feedback batched into pushes. NOT for a code-only review-and-fix (use a code review-and-remediation skill), NOT for a gap inventory without changes (use an NFR/gap-audit skill), NOT for a single page's copy (use a copy-editing skill).
---

# Site Revision

Take an existing website from "it doesn't bring in the right requests" to
"repositioned, rewritten in the customer's language, every claim sourced,
technically sound, and every change confirmed on production". The
positioning decision and the proof carry the value; the text follows.

This skill orchestrates. It calls other skills for the specialist parts
and adds what they don't cover: the owner loop, the fact gate, the
persona before/after, and the release rhythm.

## Run rules (read first)

- **Small work packages.** One theme or at most one page pair per package,
  each with its own commit and its own check. A session limit must never
  leave half a package behind.
- **One delegated agent at a time, and no nested agents.** Parallel agents
  that spawn their own sub-agents exhaust session limits without output.
- **Owner reviews on the live site**, not in diffs. Collect feedback
  locally, push as one batch, validate live, report the URLs.
- **Never push while the previous pipeline of the same repo is running**
  (most CI servers cancel it). Commit locally in the meantime.
- **One question per message** to the owner during interviews. Bundle
  doubts only in written reports.
- **Report, don't correct**: when a rule or checklist hits a doubtful
  case, surface it instead of silently reinterpreting.
- **Verify CI health before the first push**: runner up, secrets store
  unsealed, quality-gate server reachable. A self-hosted runner on a
  workstation may be asleep or only on during the day.

## Phase 0 — Baseline and guardrails

1. **Parameters**: fill [references/site-config-template.md](references/site-config-template.md)
   with the owner: languages and URL pairs, voice rules and lint command,
   forbidden terms per language, names that must never appear (clients,
   and the owner's own name if they don't want to be findable by it),
   source locations (proposals, customer mails, proceedings, photos),
   personas, and KPIs.
2. **Analytics works and has a baseline** (visits, contact-form
   submissions, top pages). Without it, later consolidation is guesswork.
   Some hosted analytics inject their script only for real browsers:
   confirm in the analytics dashboard, not in HTML fetched from the
   command line.
3. **CI is local-parity checked** before content work starts: the local
   verify command covers what CI checks (a `ci-local-parity` skill, if
   available, does this systematically).
4. **Decision log**: one place for decisions with date and rationale
   (a separate governance repository, `docs/decisions.md`, or the plan).
   Every positioning or naming choice goes there before it goes on the site.

## Phase 1 — Customer evidence and jobs to be done

Before any positioning choice, understand what buyers are trying to get
done, in their own words. Ask the owner for, one source at a time:

- incoming requests and quote requests (mails, forms, call notes);
- proposals that were won and lost, and why a lead dropped out;
- feedback after assignments (mails, evaluations, public write-ups);
- testimonials, and whether they may be quoted and how to attribute them;
- questions buyers ask before they commit (size, price, procurement,
  experience, format, risk).

Anonymise people; ask per organisation whether it may be named. Record
the analysis with
[references/customer-evidence-template.md](references/customer-evidence-template.md):
per source the trigger, the job, the desired outcome, objections and
anxieties, the literal words used, and the buying process. Summarise the
recurring jobs and objections. They drive the positioning (phase 1b), the
personas and their questions (phase 2) and the FAQ headings (phase 4). If the owner has no
requests yet, say so and mark every persona assumption as unverified.

## Phase 1b — Blind spots and positioning

1. Ask for the owner's reasons (too few requests, shifting offer, unclear
   difference from competitors), then interview **one question at a
   time** about audience, offer boundaries, sibling sites, and what
   is confidential.
2. Check the options against the customer evidence from phase 1, then
   research competitors and the search results buyers see
   (see [references/search-and-geo.md](references/search-and-geo.md)).
3. Present options with a recommendation, get an explicit decision, log
   it. Record what the site must NOT claim (roles the owner did not have,
   events they only attended, clients that may not be named).

## Phase 2 — Persona walkthrough, baseline

Run [references/persona-walkthrough-template.md](references/persona-walkthrough-template.md)
on the live site before rewriting: fixed personas, fixed questions, a
score per question with the URL and the literal fragment that answers it.
Save it; phase 7 repeats it with the same personas and questions.

## Phase 3 — Plan

Write the plan from [references/revision-plan-template.md](references/revision-plan-template.md):
goal, acceptance criteria, tiered work packages (A mechanical, B text
within a fixed design, C owner judgement), routing per tier (who or
which model does which tier), and a retrospective section that is filled
during the run, not at the end.

## Phase 4 — Content in the customer's language

- Source phrases from the customer evidence (phase 1): the words customers used
  ("cold feet", "how do we procure this?", "can you handle a group our
  size?") become FAQ questions and headings. Do not invent anecdotes.
- Proof first: a shareable overview of gatherings with numbers, dates,
  format and the owner's **exact role** (organiser, co-facilitator,
  assistant, participant), sorted most recent first.
- Ask early for testimonials with attribution the owner confirms
  (a participant, an organiser, translated or not).
- Bilingual pages change as a pair: same facts, same FAQ order, same
  structured data, reciprocal hreflang.
- Mark time-bound content (a planned event, "this year") in the plan so
  it is updated after the date passes.

## Phase 5 — Fact and quote gate (blocking)

Every quote, number, date, source tag and anecdote must be verified
**literally against the primary source** before it ships. Summaries,
indexes and earlier agent output are not sources. Unverifiable means
removed, and the owner is told. Procedure and the recurring failure
patterns: [references/fact-verification.md](references/fact-verification.md).

Also in this gate: image rights (own photos, publisher covers,
recognisable people's consent), metadata stripped from every image,
names policy respected in file names and alt text.

## Phase 6 — Live feedback loop

1. Push the batch, follow the pipeline to green, run
   [scripts/live_verify.sh](scripts/live_verify.sh) with one pattern per
   change (present or absent), send the owner the live URLs.
2. Owner feedback becomes the next batch. Note each correction that is a
   general rule (e.g. "the owner's name never on the site") in the
   decision log or the agent's memory, not only in the page.
3. Between batches: run an AI-writing check on long texts (the voice
   lint plus a reading pass for templated sentences, triads,
   "not X but Y", rhetorical question strings, hollow closers) and the
   bilingual parity check [scripts/parity_check.py](scripts/parity_check.py).

## Phase 7 — Persona walkthrough, after

Repeat phase 2 with the same personas and questions on the live site.
Report before/after per persona, new gaps, and contradictions between
pages (numbers, dates, roles). Fix or explicitly accept each one.

## Phase 8 — Technical review and conversion path

- Run a technical review for correctness, structured data,
  accessibility, performance, security and redirects, and a responsive
  check across breakpoints (dedicated review skills such as
  `site-review-remediation`, `nfr-gap-audit` or `responsive-visual-review`
  fit here if available).
- Contact path: end-to-end tests for the contact form (success, error,
  required fields, spam trap) against a mocked form backend, the promised
  reply time on the page, and no published e-mail address unless the
  owner wants one (it mainly attracts spam).
- Optional but recommended: a manual keyboard and screen-reader pass;
  automated tools find only part of the issues.
- CI speed-ups found on the way (sampled Lighthouse, weekly full run,
  hashed asset URLs): [references/ci-speedups.md](references/ci-speedups.md).

## Phase 9 — Final check and retrospective

1. Run [scripts/final_check.py](scripts/final_check.py) against production
   for every sitemap URL plus deliberately non-indexed pages: status,
   unique titles, one H1, valid JSON-LD, FAQ schema count equals visible
   questions, images with alt/size and a working URL, no forbidden names,
   no forbidden terms per language. Target: zero problems.
2. Run [scripts/exif_scan.sh](scripts/exif_scan.sh) on the image
   directory.
3. Complete the plan's status and retrospective; hand the owner the
   remaining owner-only tasks (external listings, testimonials to
   collect, the post-event case study) and a date to re-measure the KPIs
   (4–6 weeks) and decide on consolidating overlapping pages.

## Scripts

All take their site-specific values as arguments; run with `--help` or
read the header comment.

- `scripts/final_check.py --base <origin> [--sitemap <path>]
  [--extra-url <path>] [--forbid-name <text>] [--forbid-term <word>]
  [--term-skip-prefix <path>]` — prints problems per URL, exit 1 if any.
- `scripts/parity_check.py --dist <build dir> --base <origin>
  --from-lang <xx> --to-lang <yy>` — prints language pairs whose
  structure or word ratio differs, exit 1 if any.
- `scripts/live_verify.sh <origin> <patterns file>` — lines
  `present|absent <path> <text>`, prints failures and totals.
- `scripts/exif_scan.sh <image dir>` — self-tests the filter, then lists
  files with metadata, exit 1 if any.

## Pitfalls

Real failures from earlier runs, with the fix:
[references/pitfalls.md](references/pitfalls.md).
