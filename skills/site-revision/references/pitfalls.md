# Pitfalls from real runs

| Symptom | Cause | Fix |
|---|---|---|
| Owner corrects a "fact" that the site states with confidence | An agent filled in an anecdote or role | Fact gate (fact-verification.md); roles only from the owner |
| CSS change deployed, live pages still look old for hours | CDN/edge caches `/assets/*.css` (a long shared-cache max-age, cache HIT) under an unchanged URL | Content hash in asset URLs; long immutable cache only after that is live; verify via the hashed URL, not a cache-buster |
| `curl` shows no analytics beacon, dashboard shows visits | Beacon injected only for real browsers | Check the analytics dashboard, not the HTML from `curl` |
| Pipelines "killed" after pushing several packages quickly | CI cancels running pipelines on a new push | Push only when the previous pipeline is green |
| Full-width table forces horizontal scroll | `white-space: nowrap` on row headers and a fixed `min-width` on mobile | Let cells wrap; on mobile stack rows as blocks with `data-label` on every cell; measure `scrollWidth - clientWidth` with a headless browser |
| Screenshot shows an empty page | Fade-in-on-scroll animation | Scroll the element into view and wait before the screenshot |
| Batch edit script reports "done" but the commit is missing | The commit was silently rejected (hook, quoting) while output was suppressed | Run the commit without `-q` once; check `git log` after each commit |
| Killing a process by a name pattern ends the agent's own shell | The pattern also matches the shell's own command line | Stop the process by its port, not by a name pattern: list listening ports, then kill that PID |
| Metadata scan finds everything, or nothing | Filter matches the tool's own header line, or can never match | Filter on real metadata groups; test with a file where you added a tag on purpose |
| Search result shows a weak title | Title like "<Service> — about" without a clear subject | Title = what the page offers, not the page type; watch the owner's naming policy |
| Rewrite by an agent drops a point the owner just asked for | The rewrite brief did not say which recent changes are fixed | List the owner's latest corrections as "must keep" in every rewrite brief |
| The second-language page uses a borrowed term the owner banned | Term in a template or FAQ answer | Forbidden-terms list per language in the final check |
| Owner's name ends up in a file name or alt text | Photo exported with the name | Neutral file names; names policy in the final check |
| A deleted page still returns 200 with the old content, but only without a query string | An edge cache kept the old HTML (a large shared-cache age, a large `age` header) | Verify removals without a cache-buster; purge the URL in the CDN, or wait until the shared-cache max-age runs out |
| HTML validation reports stray end tags after an agent rewrite | The delegated agent wrote fragments of its own tool-call markup into the file | Search changed files for tool-call markup before committing; the HTML validator catches it, a Markdown linter does not |
| Session limit hit with nothing delivered | Parallel agents, some spawning their own agents | One agent at a time, no nesting, small packages |
| Checks pass or fail on changes you didn't make | Another agent or the owner is editing the same working directory | Run checks and builds in a separate clean checkout of the commit under test |
| Local tests pass against the wrong site | A different app already listens on the test port and the test runner silently reuses it | Check the port is free before starting the preview server, or disable server reuse |
| Every sitemap `lastmod` is the same date, or jumps on each deploy | `lastmod` taken from the commit or build date; shallow CI clones make it worse | Take `lastmod` from the content's own updated date, or leave it out |
| Workstation-hosted CI broken after sleep | Database recovery, secrets store sealed, DNS or IP conflicts | Health check before the first push; follow the host's recovery runbook |
