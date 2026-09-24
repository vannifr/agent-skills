# Pitfalls seen in real remediation runs

Each entry: the trap, why it hides, and the check that exposes it.
Entries tagged with a tool (e.g. *[GitHub Actions]*, *[Apache]*, *[npm]*)
only apply when you use it, but each carries a general lesson: look for
the equivalent in your own stack.

## Data exposure

- *[GitHub Actions]* **CI artifacts drop dotfiles.** `actions/upload-artifact@v4` defaults to
  `include-hidden-files: false`. `.htaccess` never reaches the deploy job,
  and `rsync --delete` then removes it from the server, taking its access
  rules with it. General lesson: check that config dotfiles (`.htaccess`,
  `_headers`, `.well-known/`) survive every hop from build to server.
  Check: the upload log's file count, and a live request to a path the
  config should block.
- **Data files inside the web root.** A signup list written next to the
  endpoint is one missing config file away from public. It also gets
  overwritten on every deploy if it's tracked in git. Fix: store it above
  the web root, untrack it, exclude it from rsync and the build output.
- **robots.txt named groups.** A crawler follows only its most specific
  `User-agent` group, so `Disallow` lines in `*` don't apply to Googlebot
  or GPTBot if they have their own group. A `Disallow` line also
  advertises the sensitive path.
- **Proxy cache outlives the fix.** The origin returns 403 but the
  host's proxy/CDN cache still answers 200 with the old body
  (`x-proxy-cache: HIT`). A request with a query string bypasses it and
  looks fine. Check the bare URL, and flush the cache via the hosting
  panel.

## Hollow quality gates

- *[npm]* **Unquoted globs in npm scripts.** npm runs scripts with `/bin/sh`,
  which has no globstar. `public_html/**/*.html` expands to one
  subdirectory's files, so the linter reports "Scanned 1 files". Fix:
  quote the globs so the tool expands them. General lesson: read the
  linter's own "files scanned" count, never trust a green exit code.
- *[html-validate]* **Misnamed config file.** `html-validate` reads `.htmlvalidate.json`,
  not `.html-validate.json`. General lesson: print the effective config
  (`--print-config` or equivalent) to prove your overrides load.
- *[GitHub Actions]* **Advisory checks after deploy.** A validation workflow triggered by
  `workflow_run` after deploy, with `continue-on-error`, can never stop a
  bad release. Move it into a job the deploy `needs:`.
- *[serve]* **SPA fallback in a11y checks.** SPA mode answers every missing page with
  index.html and a 200, so a missing page passes.
- *[pa11y-ci]* **Old headless browsers.** pa11y-ci 3 ships Chromium 91, which ignores
  range media queries (`@media (width <= 768px)`). The mobile layout is
  never tested. General lesson: check which browser version your CI
  tools bundle. Use prefix syntax (`max-width`) or upgrade.

## Deploy script

- *[Node]* **`process.exit()` inside `catch` skips `finally`.** A temp SSH key
  written in `try` stays on disk when the deploy fails. Use
  `process.exitCode = 1`. General lesson: temporary credentials must be
  cleaned up on the failure path too.
- *[rsync]* **`rsync -a` copies artifact mtimes.** Every deploy resets
  Last-Modified/ETag on unchanged files. Use `-rlz --checksum`.
- *[GitHub Actions]* **gitleaks-action on pull requests** needs `GITHUB_TOKEN` in `env`, or
  every PR run fails at its first step.
- *[GitHub Actions]* **`workflow_run` + `branches: [main]`** matches a fork PR whose head
  branch is named main. Gate on `workflow_run.event == 'push'` and the
  same `head_repository`. General lesson: jobs that consume artifacts
  from another run must not trust runs triggered by forks.

## Front end

- **Two controllers for one widget** (e.g. a mobile menu toggled by both
  a `hidden` and an `active` class) drift out of sync after the first
  link tap. Keep one open/close function that owns all state.
- **`overflow-x: hidden` on html/body** turns body into a scroll
  container. `position: sticky` stops working and a `body` scroll lock
  stops propagating. Fix the real overflow source instead; use
  `overflow-x: clip` on a wrapper if needed.
- **The same init function called twice** binds two submit listeners, so
  one submit sends two POSTs. The second one shows "already subscribed".
- **`focus()` on an element without `tabindex`** does nothing. Skip links
  and in-page anchors need `tabindex="-1"` on the target.
- **Unversioned asset URLs with long cache lifetimes** keep returning
  visitors on old CSS/JS for weeks. Content-hash them at build time.

## Working method

- **Line-ending churn inflates diffs.** A script that rewrites a CRLF file
  as LF shows the whole file as changed. Use `git diff --ignore-cr-at-eol`
  to see the real change.
- **Builder "mutation checks" that never mutate.** A builder may add a
  fourth functional test and call it a mutation, or report
  "simulated" results. Run your own.
- **`pkill -f <pattern>` can kill your own shell** when the pattern also
  matches the command line running it. Kill by port or PID instead.
- **Leftover containers** from a builder's test runs hold ports and make
  the next test run fail with "port is already allocated".
