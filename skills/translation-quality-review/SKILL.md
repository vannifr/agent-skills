---
name: translation-quality-review
description: Reviews actual translation quality across a multi-language site's locales — not whether every key exists (most i18n setups already automate that) but whether the translation itself is correct, natural, and consistent — literal phrasing, broken placeholders, untranslated leftovers, terminology drift, and length-driven layout risk. Works on any multi-language website, any i18n mechanism (client-side JSON, per-locale pages, CMS). Trigger on "review our translations", "check the French/German/Dutch copy", "is this correct in language X", or after updating locale content. NOT a substitute for a professional translator or native-speaker sign-off on launch-critical copy — flag uncertainty rather than assert fluency the model doesn't have. NOT a key-parity check — confirm the project's own parity check is green first; this assumes every key exists and asks whether the translation is any good.
---

# Translation Quality Review

Most i18n setups already catch a missing key mechanically. Nobody
automates whether the translation that IS there reads naturally, uses
consistent terminology, or is quietly still in the source language. This
skill does that read-through, plus the layout risk that follows from
verbose translations in narrower UI contexts.

Works on any multi-language site regardless of the i18n mechanism — the
review operates on the rendered/extracted strings, not the storage
format.

## When not to use this

- **Key-parity/missing-key checks** → that's a mechanical, already-solved
  problem in most i18n setups (e.g. this project's own `i18n-check.py`).
  Confirm that's green first; don't duplicate it here.
- **Launch-critical copy that needs a guarantee of fluency** → a model
  read-through is a useful first pass, not a substitute for a native
  speaker or professional translator sign-off. Say so explicitly in the
  findings rather than implying a confidence level the review doesn't
  have.
- **Layout breakage itself** (as opposed to flagging the *risk* of it) →
  hand length-risk findings to `responsive-visual-review` to confirm
  visually; this skill only estimates risk from string length, it doesn't
  render anything.

## Phase 0 — Scope

1. Which locales and which files/pages to review (default: every
   non-source locale the site ships, sampled across the same page set
   used elsewhere in the audit if one exists).
2. Confirm key-parity is already green (skip re-deriving that here — if
   it isn't green, that's a different, prior problem to fix first).
3. Identify the project's own style guide if one exists (tone-of-voice
   docs, per-language style notes) — read it before judging tone, since
   "correct" tone is project-specific, not universal.

## Phase 1 — Per-locale read-through

For each non-source locale, compare every translated string against the
source-language original and flag:
- **Literal/awkward, machine-translation-sounding phrasing** — reads
  correct word-for-word but unnatural in the target language.
- **Placeholder/variable mismatches** — a `{name}`/`%s`/`{{count}}`-style
  placeholder present in the source but missing, renamed, or malformed in
  the translation (this is a functional bug, not just a style issue — it
  can break at runtime).
- **Untranslated leftover strings** — still in the source language where
  a translation was expected.
- **Terminology inconsistency** — the same concept translated two
  different ways across different pages/keys in the same locale (confuses
  readers more than a single, consistently "good enough" choice would).
- **Tone mismatch** against the project's own style guide, if one exists.

## Phase 2 — Length/layout risk

Flag strings where the translation is meaningfully longer than the source
(rule of thumb: >30% longer character count) in UI-constrained contexts
specifically — button labels, nav items, form labels, badges — not
long-form body text, where extra length rarely breaks anything.

German and Finnish compound nouns, and French's typical verbosity
relative to English, are the most common sources of this; don't assume
it's isolated to any one language pair, though — check what the source
language actually is for this project.

Hand any flagged strings to `responsive-visual-review` (or a manual
screenshot check at the narrowest breakpoint) to confirm whether the
length risk actually manifests as a visible break.

## Phase 3 — Findings

Per locale, severity-ranked:

| Severity | Examples |
|----------|----------|
| Critical | Broken placeholder causing a runtime error, or a visibly broken/garbled string in production |
| High | Untranslated leftover string, or a translation that changes the actual meaning |
| Medium | Awkward/literal phrasing, terminology inconsistency within a locale |
| Low | Minor tone drift from the style guide, cosmetic wording preference |

State explicitly in the report's summary that this is a model-assisted
first pass, not a certified linguistic sign-off — recommend native-speaker
review for anything flagged Critical or High before it ships, and for any
locale that has never had a native-speaker pass at all.
