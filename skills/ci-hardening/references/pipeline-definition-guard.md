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
   Only then fix the definition.
4. Fix in small commits, push, fetch the real run and quote the status per
   step. A green local run is not proof.
5. Lint the pipeline file in the pre-commit hook when it is staged; when
   the lint tool is missing, print a visible warning, never skip silently.

## First set of guards

- Every image has a version tag or a digest, never `latest` (the clone
  image included).
- Dependencies refer only to existing steps and contain no cycle.
- A step that consumes coverage or generated files waits (transitively) for
  every producer.
- An important check (a live verification) is not downstream of an advisory
  or scan step; otherwise a failing scan skips it.
- Every step has the project's path filter, or is on an explicit exception
  list in the test.
- `failure: ignore` only through an allowlist with a reason, plus a
  time-bound test that fails once the deadline has passed.
- Every project script path used in a command exists (account for a `cd` on
  an earlier line to avoid false positives).
- Image tag and tool version agree (e.g. a browser-test image equals the
  test library version in the manifest and lockfile).
- No placeholders in the file.
- A secret source the pipeline depends on (e.g. a vault) has a health check
  with a hint, so an unavailable source does not surface as an unrelated
  key error.

## Rules that came out of using it

- Look digests and versions up in the registry; never guess. Compare a
  local image ID against the digest.
- Prove a new blocking gate fails on a deliberate violation first. Scanners
  complement each other (one saw an advisory in a lockfile another missed);
  do not replace one with another.
- Retry only the network part (a database download), never the scan
  itself, or a real finding is repeated and delayed.
- Keep local test-runner settings (workers, retries) close to CI; prove a
  suspected flake with a stress run on the old commit before changing a
  test or its config.
- Regenerating a lockfile with a different package-manager version can drop
  fields; change it with one targeted line and verify with a dry-run
  install.

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
