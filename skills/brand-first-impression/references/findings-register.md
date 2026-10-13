# Findings register

One structured file per run, written the moment a brand is done and before the report. The report and the overview are generated from it, so counts and quotes cannot drift.

Fields per finding:

- `id`: unique and stable (for example `b1-003`).
- `brand`, `page`.
- `source`: persona test, name test, measurement, norm comparison, or known.
- `personas`: which personas raised it.
- `type`: strength (record what works, including a deliberate exception), site deviates from positioning, positioning deviates from visitor intent, ambiguity, CTA, measurability, brand separation, dead control.
- `evidence`: literal quote or measurement, no judgement.
- `severity`, structural: high = at least two personas or a measurement, and it blocks the primary action or trust; medium = one persona, or a gap that does not block; low = cosmetic or unconfirmed.
- `status`: new, or known with its backlog item.
- `proposal`: without replacement text.
- `decides`: owner or agent, and the question in words when the owner decides.
- `executed`: no, or yes with date and commit.

Validate that the file parses and that ids are unique before writing the report. Quote every value that contains a colon, or the parser rejects it. Never add a finding without evidence; a finding that is only an impression of one persona is `low` and labelled unconfirmed.

## Evidence rules from an independent re-check

A second model that re-checked a seven-brand register against the live sites found ten deviations in a sample; these rules prevent them.

- Count required fields by the `required` attribute, not by visible asterisks or labels; a pre-ticked radio button is not a required field.
- Count links as `href` attributes, in the served HTML and again after rendering when the number matters; never as text occurrences of a domain.
- Keep a page total apart from an element length: characters up to the first CTA and characters on the whole page are different values.
- Keep measurement and persona impression apart in the evidence, and never call a model's visual judgement a measurement.
- A pattern across brands may not carry an item that says the opposite (a pattern "present below the fold" with an item that says "missing"); check every item of a pattern for its meaning.
- Keep the raw persona answers next to the report, with privacy-sensitive values redacted, so that "all three asked X" and every quote can be checked.
- Not independently repeatable by a second model without a browser: pixel positions, search-console figures, judgements of photos. Say so.
