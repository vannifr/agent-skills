# Guard test for the pipeline definition itself

The pipeline file is code without a safety net: lint only proves the syntax
is valid. A typo in a dependency, a floating image or a step that starts too
early shows up after the push. Put a test in the project's normal test suite
(so it runs locally and in CI) that parses the pipeline file with a YAML
parser and asserts the rules below.

## Order of work

1. Read the definition and lint it. Green lint means only "the syntax is
   valid".
2. Inventory per step: image, dependencies, filters, ignore flags, called
   scripts, and what it produces or reads (coverage files, build output,
   installed packages).
3. Write the guard test and let it **fail first** on the current state;
   quote the number of red tests as proof that the guard really guards.
   Stronger: run the new guard against the previous version of the pipeline
   file (a mutation check) and show that it fails. Only then fix the
   definition.
   A guard must not compare against a file outside the repository (a copy in
   a home directory): in CI such a test skips silently. Put that comparison
   in the evidence report instead.
4. Fix in small commits, push, fetch the real run and quote the status per
   step. A green local run is not proof.
5. Lint the pipeline file in the pre-commit hook when it is staged; when
   the lint tool is missing, print a visible warning, never skip silently.

## First set of guards

- Every image is pinned by digest (a tag alone is a finding), the clone
  image included. When the repository still has many tag-only images, use a
  two-level ratchet: the test requires at least a version tag now, and
  digest-only via an explicit exception list that only shrinks.
- Dependencies refer only to existing steps and contain no cycle.
- A step that consumes coverage or generated files waits (transitively) for
  every producer.
- An important check (a live verification) is not downstream of an advisory
  or scan step; otherwise a failing scan skips it.
- Every step except the security gates (secret scan, audit) has the
  project's path filter, or is on an explicit exception list in the test.
  Schedule-only steps are a valid third category on that list.
- `failure: ignore` only through an allowlist with a reason, plus a
  time-bound test that fails once the deadline has passed. That test turns
  trunk red on a date without any code change: say so in its message and
  name the entry.
- Every project script path used in a command exists (account for a `cd` on
  an earlier line to avoid false positives).
- Image tag and tool version agree (e.g. a browser-test image equals the
  test library version in the manifest and lockfile).
- No placeholders in the file.
- A secret source the pipeline depends on (e.g. a vault) has a health check
  with a hint, so an unavailable source does not surface as an unrelated
  key error.

## Language pitfalls for the guard test

A guard that needs a YAML parser may not have one: Python's standard library
has none, so test the YAML text with regular expressions or add the parser
as a test dependency. A small alpine-based test image may lack git, which
the guard tests need: install it in the test step (that is within the scope
of the gate fix). A slim language image without git cannot run guard tests
that drive a stub scanner against real git repositories: put those guards in
a shell script and run it in the image of the scanner step (which has git),
with a parity assertion that the step really calls it.

A parity test should not carry a list of documented exceptions for a gate
that has just been repaired: look the entries up and delete them, so that the
parity is exact.

## Write the guard tests so the quality gate accepts them

The guard tests are code too and go through the quality server. Keep one
simple assertion per test, no early return, no compound assertion and no
`assert False`; put the logic in a helper (e.g. an `is_pinned(image)`
function) and assert its result once.

## Template: guard for the secret-scan step

A small test that proved reusable across repositories and test languages:
assert that the clone block sets full history (`depth: 0`, `partial:
false`) with a digest-pinned clone plugin, that the scan image is
digest-pinned, that the step runs the exact intended commands (self-test
first, then the scan), that it contains no `|| true`, no staged-only or
previous-commit-variable mode, and that the script holds its guards
(shallow, partial, zero scanned, count below the lower bound). Strip YAML
comments before the negative assertions; a comment that mentions a
forbidden word otherwise raises a false alarm. Extract the step's block
(from its name to the next step) and compare its command list for equality
with the expected list; cut the block at the commands key's end when the
step has no filter section after it.

## Rules that came out of using it

- Look digests and versions up in the registry; never guess.
- Prove a new blocking gate fails on a deliberate violation first. Scanners
  complement each other; do not replace one with another.
- Retry only the network part (a database download), never the scan itself,
  or a real finding is repeated and delayed. Some scanners need the database
  step and the scan step to share one cache directory, or the scan step
  refuses to skip the update on a first run.
- Keep local test-runner settings (workers, retries) close to CI; prove a
  suspected flake with a stress run on the old commit in a worktree before
  changing a test or its config.

## Evidence and done

Per guard: the rule in the test, the red count before the fix, the fix
commit, and the run number with status per step. Done = guard green locally
and in the real pipeline, must-fail proof recorded, the project's agent
instruction file updated in the same commit; anything unchecked is reported
as "not verified".

## Possible follow-ups

A version marker (commit hash in the build) so live checks verify the new
deploy, not the previous one; a pipeline that gates the deploy instead of
checking afterwards; a test-count floor; pinning remaining unpinned
tooling.
