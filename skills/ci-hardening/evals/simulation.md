# Local simulation

date: 2026-10-13
model: sonnet (baseline and with skill), haiku (with skill, second table)
scorer: opus, blind (shuffled labels, one scorer per scenario)

| scenario | baseline | with skill |
|---|---|---|
| scenario-0 | 57 | 91 |
| scenario-1 | 72 | 98 |
| scenario-2 | 48 | 90 |

| scenario | haiku with skill |
|---|---|
| scenario-0 | 69 |
| scenario-1 | 95 |
| scenario-2 | 78 |

One run per variant, so a signal and not a measurement. The baseline missed
most on must-fail proof, hook isolation, unproven versus operator-gated
labels and before/after numbers. Weak spots that remained with the skill:
severity applied unevenly (a path-filter finding rated medium, a vacuous
scan rated medium), the patch delivered inline instead of as a patch file,
and on the weaker model the word "unproven" and the owner's consent for a
push-to-verify were missing. Not changed in the skill: one run each is too
little to justify a rule.

Second round, same date: four wording changes in SKILL.md (severity high when
no full-history scan exists, fixes delivered as patches even when audit-only,
a fixed status word per gate, the silent-fallback hunt applied to the agent's
own patch). Haiku re-run, scored blind against its first run: 73, 93, 77
against 68, 94, 77. Within the noise of one run per variant; the changes did
not hurt and no more is claimed.
