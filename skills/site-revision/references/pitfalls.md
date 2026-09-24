# Pitfalls from real runs

| Symptom | Cause | Fix |
|---|---|---|
| Owner corrects a "fact" that the site states with confidence | An agent filled in an anecdote or role | Fact gate (fact-verification.md); roles only from the owner |
| CSS change deployed, live pages still look old for hours | CDN/edge caches `/assets/*.css` (e.g. `max-age=14400`, cache HIT) under an unchanged URL | Content hash in asset URLs; long immutable cache only after that is live; verify via the hashed URL, not a cache-buster |
| `curl` shows no analytics beacon, dashboard shows visits | Beacon injected only for real browsers | Check the analytics dashboard, not the HTML from `curl` |
| Pipelines "killed" after pushing several packages quickly | CI cancels running pipelines on a new push | Push only when the previous pipeline is green |
| Full-width table forces horizontal scroll | `white-space: nowrap` on row headers and a fixed `min-width` on mobile | Let cells wrap; on mobile stack rows as blocks with `data-label` on every cell; measure `scrollWidth - clientWidth` with a headless browser |
| Screenshot shows an empty page | Fade-in-on-scroll animation | Scroll the element into view and wait before the screenshot |
| Batch edit script reports "done" but the commit is missing | The commit was silently rejected (hook, quoting) while output was suppressed | Run the commit without `-q` once; check `git log` after each commit |
| `pkill -f <pattern>` ends the agent's own shell | The pattern appears in the shell's own command line | Stop servers by port: `ss -ltnp` → `kill <pid>` |
| Metadata scan finds everything, or nothing | Filter matches the tool's own header line, or can never match | Filter on real metadata groups; test with a file where you added a tag on purpose |
| Search result shows a weak title | Title like "Facilitator — about" without a clear subject | Title = what the page offers, not the page type; watch the owner's naming policy |
| Rewrite by an agent drops a point the owner just asked for | The rewrite brief did not say which recent changes are fixed | List the owner's latest corrections as "must keep" in every rewrite brief |
| NL page uses a borrowed English term the owner banned | Term in a template or FAQ answer | Forbidden-terms list per language in the final check |
| Owner's name ends up in a file name or alt text | Photo exported with the name | Neutral file names; names policy in the final check |
| Session limit hit with nothing delivered | Parallel agents, some spawning their own agents | One agent at a time, no nesting, small packages |
| Workstation-hosted CI broken after sleep | Database recovery, secrets store sealed, DNS or IP conflicts | Health check before the first push; follow the host's recovery runbook |
