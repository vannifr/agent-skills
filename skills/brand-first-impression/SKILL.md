---
name: brand-first-impression
description: Use when asked what first impression a public brand or marketing site makes, why visitors come to it, whether the impression matches the intended positioning, or whether its calls to action work — "first impression test", "what does a visitor think in the first seconds", "persona test of the site", "does the site match our positioning", "do the CTAs work", "brand check across our sites". Runs blind persona subagents on screenshots of the first screen without scrolling, a brand-name-only test, a measured call-to-action check and a comparison with the written norm. Report only, changes no site. Not for a full site revision (use a site-revision skill), not for rewriting copy (use a copywriting skill), not for performance or accessibility audits.
---

# Brand first impression, visitor intent and CTA

Tests whether what a visitor understands in the first seconds equals what the brand wants to be, why that visitor came, and whether the next step (the call to action, CTA) is clear and small enough. The output is a report with proposals. This skill changes no site, no positioning and no register of inquiries.

The core rule: **measure the impression blind, then compare it with the norm.** A persona that has read the brand card judges the card, not the site.

## What it tests

1. **First impression.** What a visitor thinks this is, for whom, and what to do next, after one screen without scrolling.
2. **Arrival.** Why someone ends up here, through which channel, with which word or question.
3. **Match with the positioning.** Impression against the written norm: brand card, positioning document, offer.
4. **CTA.** One clear next step per persona, at the right moment, in the visitor's language, low friction, and a measurable consequence.

## Fixed rules

- Report only. A change to a site is a separate, explicitly requested step with its own checks and a live verification afterwards.
- Positioning belongs to the owner. A gap between impression and positioning is reported as a gap with both sides (the site does not match the positioning, or the positioning does not match what visitors look for), never as a decision.
- No invented numbers. Search volumes, visitor counts and conversion rates come from a named source or a real measurement, else `[EVIDENCE NEEDED]` or `[HYPOTHESIS]`.
- Personas come from evidence (inquiry log, sales notes, the offer page, the brand's own traffic statements). A persona detail without evidence is marked `[ASSUMPTION]`; with few or no real inquiries the personas are mostly assumptions, and the report says so.
- Respect the owner's rules for brand separation, names and anonymity: a proposed CTA may not point where those rules forbid. A deliberate omission (no name, no price) stays a finding when personas ask for it; the question for the owner is what can stand in its place, not whether the choice must be undone.
- Write the report in the owner's working language; the prompts to persona subagents in the language of the site.
- Describe things in words, never only with a code or number.

## Steps

### 0. Scope

One brand or several, strictly one at a time. Same date and same personas for every brand so reports stay comparable. For a repeat run, reuse the earlier personas and questions and show before and after. After each brand write the retrospective (step 8) and apply what it teaches before the next brand.

### 1. Norm and known issues

Read, in this order, and write a norm of at most ten lines: the brand card or positioning document, the offer and competitor notes, the tone-of-voice rules, the place of the brand in the whole portfolio. The norm holds: what the brand is in one sentence, for whom, what it explicitly is not, the primary action, the allowed outgoing references. If two sources describe a different offer, list both and raise the difference as an open question; never pick silently.

Check handover notes from other sessions or people and decisions newer than the brand card; record which were read. Then collect **known open issues** from the backlog and the site repository's own notes. A finding that matches a known issue is reported as "known, confirmed by the persona test" with its backlog item, never as new. For a site that is being rebuilt, read the rebuild plan first: planned findings are known and keep their planned order, and the test is repeated after the rebuild with the same personas. Check every figure shown on the first screen against the evidence register; a figure marked hypothetical there is a finding. Before reporting a striking value as an error, check whether it is a recorded exception (for example a name shown on purpose); a deliberate exception is noted as a strength, and a value protected by privacy rules is left out of the report and the register.

### 2. Why someone comes

From evidence or marked as hypothesis: the brand's own statement of where visitors come from (weight everything below by it), channels in the inquiry log, the trigger that starts the search, 8 to 15 search terms and questions in the visitor's words (problem, solution and brand language, per language), and whether those words appear literally in title, H1, meta description and first paragraphs. Start from measured data when it exists (a search-console baseline, analytics) and put it above assumptions; compare its top terms with title and H1. Zero inquiries is itself a finding: everything else stays hypothesis. Volume only from a named source.

### 3. Personas

Three fixed personas, the same between runs: a **newcomer** (does not know the brand), an **expert** (tests craft and vocabulary), a **decision-maker** (concrete problem, budget, wants proof and a contact path). When real inquiry types exist, build the personas on them and put the persona answers next to the questions the real inquirers asked. Add a fourth only when the evidence asks for it (referred visitor, organiser, learner). Per persona: situation, trigger, hope, fear, and the source of each detail. A persona describes a visitor, never the brand: no hope or fear may restate the norm (a visitor who "fears legal advice posing as mediation" leaks the norm's exclusion into the blind run). Before sending, search every persona prompt for terms from the norm and remove them. Prompt templates: [persona-prompts.md](references/persona-prompts.md).

### 4. Blind first-impression test

1. Open the live URL in a fresh browser with a cache-buster, desktop (about 1440 wide) and mobile (about 390 wide). Capture only the first screen, without scrolling. Save screenshots where the browser tool may write (usually inside the project directory), not elsewhere.
2. Run the measurement snippet once per viewport ([measurement.md](references/measurement.md)).
3. Give each persona to a **read-only subagent** in a fresh context. The prompt holds only: the screenshot paths, the page title and meta description as shown in a search result, the persona, the fixed questions, and the instruction to read nothing else. It never holds the norm, the brand card or the repository. Write the prompt out in full; the subagent does not see this conversation.
4. **Name test.** A second fresh subagent gets only the brand name, title and meta description (no page) and says what it expects, for whom, what it takes to get in, what organisation it pictures, and whether it would click.
5. **Full-page task** when a CTA sits below the fold: a third fresh subagent gets a full-page screenshot and the question where to click to get in touch or sign up. This separates "absent" from "present but too low". Optionally, give a persona the page the primary button leads to (best for a separate service, training or contact page) and ask whether they would fill in its form; on two sites it found what the first-screen test missed (price, duration and group size, or the response time and privacy line sitting after the form).
6. A layout claim by a persona (cut off, missing, wraps) is verified by measurement before it enters the report. A persona who says "missing" can be right when a first measurement said "present": a clipped button exists but cannot be reached. Confirm "outside the viewport" with a scroll test and the state of any menu: items of a closed off-canvas menu sit outside the viewport by design and are a false positive, and text at the bottom edge of a screenshot is the edge of the screen, not a cut-off (compare the element rectangle with the viewport and its client height with its scroll height). State the consequence in the report: when the primary CTA is clipped or below the fold, the first screen offers no usable primary action.
7. Console or network errors seen on the first capture may be a fault of the test setup: repeat once and report only what persists. Before a persona's "missing" becomes a finding, search the page source for it: in practice the item was often present lower down (credits, price, links), and then the finding is its position. Check that each subagent quotes only what is on the screenshots; an invented detail does not count. Note its tool calls. Blindness rests on the instruction, not on a technical block; the report says so.

### 5. Compare with the norm

| Question | Norm | Persona 1 | Persona 2 | Persona 3 | Verdict |
|---|---|---|---|---|---|

Verdict per row: `matches`, `half`, `wrong` or `missing`, with the literal fragment and the URL. Three kinds of finding: the site deviates from the positioning; the positioning deviates from visitor intent (an open question for the owner, not a fix); ambiguity between personas (the strongest sign that the key sentence is unclear). All personas are the same model: agreement shows the screen reads consistently, not how real visitors react. Say so in the report. Always separate "absent above the fold" from "absent" using the measured position against the viewport and the full-page task: when every persona says "no price" but the page shows it lower down, the finding is its position, with the measured offset.

### 6. CTA test

Per brand and persona, on the landing pages (home and main service pages): one primary CTA on the first mobile screen (report its position and the page height); fit with the visitor's phase; language (customer verb or brand word); friction (fields, required fields, extra step, mailto without form, form without confirmation); whether the page says what happens next and when; proof near the button (only evidenced proof counts); who is behind the brand within one click; measurability (can an inquiry be logged with its channel and reason, does the form ask how the visitor heard of the brand); conflation of two offers in one button or form; outgoing links against the brand-separation rules (list them per page with a plain HTTP request, no browser needed); a path for someone who wants to talk to a person; dead or empty CTAs (`href="#"`, no destination, a language switch that lands elsewhere); every menu label against its destination (a "Contact" entry that points to a section of the same page is a finding, and first-screen personas do not click through, so only a link check finds it), and in a language variant the language of each destination (an English button that lands on a page with another `lang` is a finding); the conditions behind a promise button (reserve, book) visible at the button or on its destination, noting that personas who saw only the first screen cannot say whether a visitor reads them before the click. Open the contact path and measure it, and check whether different forms share one receiving endpoint, because then the channel cannot be told apart afterwards. State what was not checked (for example the confirmation mail).

Better wordings are produced by a conversion or copywriting skill and checked against the tone of voice; write no replacement text in the report without that check.

### 7. Register, then report

Collect every finding as a structured item before writing the report, and keep the raw persona answers beside it ([findings-register.md](references/findings-register.md), including the evidence rules for counting and for keeping measurement apart from impression): id, source, personas that raised it, type, page, evidence (literal quote or measurement), structural severity (state the rule in the report: high = at least two personas or a measurement, and it blocks the primary action or trust; medium = one persona, or a gap that does not block; low = cosmetic or unconfirmed), status (new or known), proposal without replacement text, who decides. The report and the overview are written from the register. Per brand: norm, arrival and theme, personas, impression per persona with literal quotes, the comparison table, CTA findings, known and confirmed issues, top five proposals ranked by effect on the brand's primary action, open questions in words (at most five at a time), retrospective. The overview shows per brand one line per persona (right, half, wrong), the biggest CTA gaps, patterns across brands and the comparison with the previous run.

### 8. Retrospective after every brand

Three parts, each at most six lines, evidence first: **content** (what the pages taught, what is new against the known issues), **method** (what worked and what did not: personas, screenshots, measurements, subagents, evidence found or missing, tool failures), **skill** (which instruction was wrong, missing or in the way, and the exact change). Triage: a lesson about this brand goes into the report, about the method into this skill, about any site into the shared guidance of whoever maintains the skills.

## Definition of done

The report is written from the register; every layout claim is backed by a measurement; every finding is labelled new or known; every number has a source or a marker; the open questions are in words; the limits are stated (one model for all personas, blindness by instruction, what was not checked). The skill changes no site, so there is nothing to deploy; any follow-up change is a separate step with its own checks and a live verification.

## Delegation

Persona runs: a mid-size model, read only, a complete self-contained prompt per persona, no access to the norm. Mechanical follow-up (word swaps, broken links over several files): a small model, in one batch, after separating mechanical from judgement work. Judging the comparison and proposals across brands: the strongest model, because it is a judgement on someone else's work and on positioning. Name the model in the report. Spot-check counts and quotes of delegated work yourself. Close a series of brands with a check by a different model than the author: a sample of the register's findings re-checked against the live sites.

## Common mistakes

- Letting the persona judge with the brand card in hand: blind first, then compare.
- Testing the whole page instead of the first screen without scrolling.
- Reporting "button missing" when it sits below the fold or is clipped, or the reverse: measure the position, horizontally as well as vertically.
- Listing search terms from memory and presenting them as the market's questions.
- CTA advice without looking at what the form does next and whether the inquiry is measurable.
- A positioning finding phrased as a fix instead of a question for the owner.
- Reporting a known issue as new, or missing that a first-screen figure is marked hypothetical in the evidence register.
- Inventing a persona detail because it sounds logical.
