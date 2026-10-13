# Local simulation

date: 2026-10-13
model: sonnet (baseline and with skill)
scorer: opus, blind (shuffled labels, one scorer per scenario)

| scenario | baseline | with skill |
|---|---|---|
| scenario-0 | 84 | 97 |
| scenario-1 | 45 | 89 |
| scenario-2 | 81 | 94 |

One run per variant, so a signal and not a measurement. In scenario 0 and 2
the subagents could not write the output file and returned the text, which
was saved verbatim. The baseline was already strong on reading measurements
and refusing to invent search volumes. It missed most on preparing a blind
run (no name-only test, no full-page task, different questions per persona,
no horizontal clipping check), on stating a severity rule, and on keeping the
positioning question open instead of recommending an answer. Weak spots that
remained with the skill: a persona whose stated fear restated the norm's
exclusion (a leak into the blind run), the consequence of a clipped primary
CTA not stated in words, and no stated severity rule in the report.

Second round, same date: wording changes in SKILL.md from these findings and
from the third real run of the project-local predecessor (persona text is
checked against the norm before sending, the consequence of a clipped or low
primary CTA is stated, the severity rule is stated in the report, a striking
value is checked against recorded exceptions first, console errors on the
first capture are repeated once, register values with a colon are quoted).

Verification of the second round, scenario 1 only, with skill, one run each,
a fresh blind Opus scorer comparing the round-1 and round-2 output: 73 (round
1) against 96 (round 2). The same round-1 output scored 89 against the
baseline with another scorer, so scorer variance is about 15 points and this
is a signal, not a measurement. The gain sits in one criterion: the persona
prompts of round 1 restated the norm (audience term and the "not legal
advice" exclusion), the round-2 prompts were scrubbed against a norm term
list. Scenarios 0 and 2 were not re-run after the second round.

Final regression, 2026-10-13, after the feedback of runs 5 to 7 and the
independent re-check of the project-local register (about twenty wording
changes in SKILL.md and its references): with-skill runs of the final
SKILL.md, sonnet, one run each, scored blind by opus against the baseline
outputs of the first round. Scenario 0: 99 with skill against 81 baseline.
Scenario 1: 92 against 34. Scenario 2: 95 against 82. The scorers differ
from the first round, so the baseline numbers are not identical; the
direction is the same in every scenario. Remaining weak spots: one persona
prompt still carried the word "co-owner" while the plan said to replace it,
and the primary CTA was called absent only "if confirmed" by a scroll test.
