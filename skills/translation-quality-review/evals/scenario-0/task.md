# Translation Quality Review for a SaaS Onboarding Flow (EN → DE)

## Problem Description

A small SaaS product's onboarding flow was translated into German by a
contractor last quarter. Key-parity automation already confirmed every
English key has a matching German key — nothing is missing. But a
support ticket came in from a German-speaking user confused by one of
the onboarding screens, and the product team wants an actual quality
read on the German strings before shipping the next onboarding revision.

## Provided data (already extracted, do not re-fetch)

Source (English) vs target (German) strings, `onboarding.json`:

```json
{
  "welcome_title": {
    "en": "Welcome, {{firstName}}!",
    "de": "Willkommen!"
  },
  "step_one_body": {
    "en": "Connect your calendar to get started.",
    "de": "Connect your calendar to get started."
  },
  "cta_continue_button": {
    "en": "Continue",
    "de": "Mit dem nächsten Schritt fortfahren"
  },
  "error_generic": {
    "en": "Something went wrong. Please try again.",
    "de": "Etwas ist schiefgelaufen. Bitte versuchen Sie es erneut."
  },
  "step_two_title": {
    "en": "Invite your team",
    "de": "Lade dein Team ein"
  }
}
```

Context: `cta_continue_button` renders inside a fixed-width button
component (max ~160px at the desktop breakpoint, per the project's own
design tokens) alongside 4 other buttons of similar English length
("Continue", "Skip", "Back", "Done") that all need to fit the same
button style without wrapping.

## Your Task

1. Read every German string against its English source and flag issues
   per the categories: literal/awkward phrasing, placeholder mismatches,
   untranslated leftovers, terminology inconsistency, and length/layout
   risk.
2. For each flagged string, assign exactly one severity: Critical, High,
   Medium, or Low.
3. Do not flag `welcome_title`'s tone as wrong without ALSO flagging the
   missing `{{firstName}}` placeholder — that is the more serious,
   functional part of that finding.
4. Explicitly note that `step_two_title`'s slightly informal "Lade dein
   Team ein" (using "du") versus the more formal "Sie" used in
   `error_generic` is a terminology/tone-consistency issue worth
   flagging, even though the sentence itself is grammatically correct
   German.
5. State explicitly in your report that this is a model-assisted first
   pass, not a certified linguistic sign-off, and recommend
   native-speaker review for anything flagged Critical or High.
