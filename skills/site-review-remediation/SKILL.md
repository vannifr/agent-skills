---
name: site-review-remediation
description: Use when asked to review the whole codebase of a website or web app AND fix what is found, end to end — full-code review in resumable chunks, security/data-exposure findings first, fixes shipped as small green commits, every fix validated on the live production site, CI followed until green. Trigger on "review the whole site and fix everything", "full code review and remediation", "review de code van de ganse site", or when a /goal like "everything live validated" is set for a site. NOT for reviewing a single diff/PR (use a code-review skill), NOT for a skill/NFR gap inventory without fixing (use nfr-gap-audit), NOT for visual-only or conversion-only reviews (use responsive-visual-review / landing-page-audit).
---

# Site Review & Remediation

Take a website from "please review everything" to "every finding fixed or
explicitly handed back, and each fix confirmed on production". The review
is the cheap part; the value is in shipping the fixes safely and proving
them live.

## Before you start: unblock the session

Long remediation runs stall on the same few permissions. Ask for these
up front, in one message, so the run doesn't stop halfway:

- **Destructive git**: history rewrite (`git filter-branch`/`filter-repo`)
  and `git push --force-with-lease`, in case a secret or personal data
  turns up in history.
- **Production shell/cache**: SSH to the host, or the hosting panel's cache
  flush. A CDN/proxy cache can keep serving a file after you've blocked
  it at the origin.
- **CI read access**: which CI actually runs this repo (GitHub Actions,
  Woodpecker, ...). Don't assume; check the repo's workflow files.

Where a permission is refused, don't work around it. Finish everything
else, then hand the blocked step back with the exact command.

## Phase 1: review in resumable chunks

A full-site review with many parallel reviewers is exactly the kind of run
that hits a session/usage limit and loses everything in flight. So:

1. Split the codebase into areas: client JS, CSS, main HTML, other pages,
   server endpoints + server config, deploy + CI.
2. Review **one area at a time**. As soon as an area's findings are
   verified, append them to a progress file (e.g. `review-findings.md`)
   under a heading marked `DONE: <area>`.
3. On resume, read that file first and skip areas already DONE.
4. Keep parallel sub-reviewers to a minimum. Correctness beats fan-out.

Verify each finding before recording it: reproduce it (browser, curl, a
container run of the server code), or trace it in the code. Label it
CONFIRMED, PLAUSIBLE or REFUTED. REFUTED findings stay in the file so
nobody re-investigates them.

## Phase 2: triage, data exposure first

Order the fix list:

1. **Live data exposure / secrets**: publicly reachable data files, keys,
   credentials, personal data in a public repo. Fix and validate these
   **before anything else**, even if that means pausing the rest.
2. **Broken core flows**: navigation, forms that double-submit or fail,
   menus that can't open.
3. **Hollow quality gates**: linters/validators that silently check
   nothing (see references), CI steps that can't fail.
4. **Performance/privacy**: render-blocking third-party scripts, oversized
   images, third-party requests before consent.
5. **Cleanup and content**: dead files, stale docs, broken links.

Mark legal/policy text as **hand back**, not fix. Changing a privacy or
cookie policy is the owner's decision.

## Phase 3: fix in small, green commits

- **One work item = one concern = one commit.** Keep content and code apart.
- **Route by risk.** Security, deploy and CI changes (high blast radius)
  you do yourself. New, test-verifiable logic can go to a cheaper builder
  agent, if one is set up (e.g. via an opencode orchestration skill), one
  task per prompt and strictly one run at a time on a shared quota.
  Pattern transfer ("do it like file X") you also do yourself.
- **Never trust a builder's "N/N tests pass".** Re-run the exact command
  yourself, read the test bodies, and do your own mutation check: break
  the implementation in 2-4 places and confirm a test catches each. Restore
  the mutations in place, not with `git checkout`.
- **Check `git diff --stat` before reading a diff.** A line count far
  above what the item needs usually means reformatting noise or line-ending
  churn (e.g. CRLF to LF). Check it with `--ignore-cr-at-eol`.
- **Before making a check blocking**, prove it is already green on the
  current repo. Otherwise wire it as advisory first.
- **Stage only the files of the current item.** Other work in progress
  (a builder editing other files) must not leak into the commit, and a
  pre-commit/pre-push hook runs against the whole working tree.

## Phase 4: validate live, every time

"CI is green" proves the pipeline ran, not that production changed. After
each deploy:

1. **Follow the real CI run** to completion and read per-job results.
   Fix red runs yourself before moving on.
2. **Hit production directly**: status codes for blocked paths, headers
   (cache, compression), and a real browser run for behaviour (menu,
   forms with the POST intercepted, focus, overflow at phone and desktop
   widths).
3. **Bust caches in your checks.** Add a unique query string, but also
   check the bare URL: the proxy cache is keyed on the exact URL a
   visitor uses.
4. **Never write to production data during validation.** Test endpoints
   with invalid input (expect 400/405) or intercept the request in the
   browser.
5. For visual refactors (e.g. replacing a CSS CDN with a build), compare
   element positions and document height between the old live page and
   the new local build at two widths. Identical numbers are the bar.

Add a post-deploy smoke test to CI for the things that must never
regress, like "sensitive path is not 200" and "server config file is
403". Give it retries: the first request right after an rsync can see a
half-updated site.

## Phase 5: close out

- Update the progress file after every item (DONE / IN PROGRESS / OPEN /
  HANDED BACK).
- Keep the project's agent instructions (`AGENTS.md`/`CLAUDE.md`) in sync
  in the same commit when commands, build steps or file layout change.
- The final report lists, per finding: fixed + how it was validated live,
  or handed back + the exact action the owner must take and why.
- For a history rewrite: make a mirror backup first, verify the tree hash
  is unchanged afterwards, verify with a **fresh clone** that the file is
  gone from all commits, and tell the owner what a rewrite cannot remove
  (existing clones, PR refs, host caches), plus the possible duty to
  report a data breach.

## References

- [pitfalls.md](references/pitfalls.md): concrete traps met in real runs
  (hidden files dropped from CI artifacts, unquoted globs that lint one
  file, proxy caches, range media queries in old headless browsers, and
  more), with the check that exposes each.
