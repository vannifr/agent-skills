# Red dependency audit: recurring recipe

Seen in the same shape across several repositories. Example commands are for
a JavaScript package manager; the order applies to any ecosystem.

A scanner that can never fail is the first check: a filesystem or image
vulnerability scan without a non-zero exit code on findings (for example
trivy without `--exit-code 1` and a severity filter) is a report, not a
gate (seen in most pipelines that had one). Plant a known-vulnerable
dependency in a scratch copy and see the step fail.

A blocking scanner also has to be able to hold the release:
- A gate that is not in the `depends_on` chain of the deploy step turns the
  pipeline red but does not stop the deploy. Test that the deploy step
  depends on the gate.
- A scan of a repository with only dev dependencies can be vacuous (target
  `-`, "supported files not found"): include dev dependencies, plant a
  vulnerable dev dependency as the must-fail case (rc 0 without the flag,
  rc 1 with it), and put "scanned targets above zero" (a lockfile row or
  count of at least 1) in the log requirement and the test. The first
  blocking scan with dev dependencies often finds real findings: fix them
  in a separate commit.
- `>=` ranges without a lockfile are covered only for the exactly pinned
  lines. Require a lockfile or exact pins.
- A blocking scan in a repository without a lockfile is formally blocking but
  empty (scanned targets 0): report it as an open gap, because the gate only
  bites once a lockfile exists.

1. Read each advisory (severity, attack vector, runtime or dev-only) and look
   up whether a patched version exists (the audit's fix-available field, the
   advisory's first-patched version, or an advisory database).
2. Patched version exists: apply the tool's lockfile-only fix first (e.g.
   `npm audit fix --package-lock-only`). For a transitive dependency that
   needs a major bump, add an override or resolution to the first patched
   version.
3. Verify like CI does: run the audit tool in the CI image, and build or
   install from the lockfile in a scratch copy (e.g. `npm ci`), so the
   override does not break the build.
4. No patched version: a documented ignore with reason, attack-vector
   assessment and an expiry date, reviewed before it lapses.
5. Commit this separately from the gate change so the gate commit is not
   red for an unrelated reason.
6. Allowlist hygiene: remove entries the audit tool reports as unnecessary.
