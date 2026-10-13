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
