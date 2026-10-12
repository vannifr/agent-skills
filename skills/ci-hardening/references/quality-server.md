# Quality-server gates (e.g. SonarQube)

Only relevant when the pipeline posts analyses to an analysis server.

- **Wait for the gate.** The step must fail on a non-OK quality gate (e.g. a
  wait-for-quality-gate setting), not only print the status.
- **Print the failing conditions.** On a non-OK gate the step must print
  each failing condition (metric key, actual value, threshold, status; the
  `conditions[]` of the project-status API response), not only the overall
  status: otherwise nobody can tell from the log why it is red, and the gate
  is "unproven" diagnostically (medium to low). The thresholds themselves
  are project configuration; they need one source of truth (a runbook or a
  server export) and the pipeline must not be able to lower them silently.
- **Scope vs the repository.** The source list must include every code
  directory that is tracked; compare it with `git ls-files`. Excluding the
  test directory means tests are never analysed.
- **New-code definition.** "No new issues" only works when the analysis can
  see history (full clone) and the previous analysis.
- **Concurrency.** When local pre-push and CI post to the same project,
  analyses collide ("date of analysis cannot be older than the last known
  analysis"). Use a separate project key for local runs.
- **After mechanical changes.** After a formatter or autofix run, re-run
  the gate: formatters can move an inline suppression away from the line it
  covers and resurface an old finding as new code.
- **Unset configuration.** A local check skipped silently because a
  variable (e.g. the server URL) is not set in the shell is a parity gap:
  give the hook a default value so it runs, and expect it to catch new
  violations, including in the guard tests themselves.
- **Degradation.** A local check that skips with a warning when the server
  or scanner is missing is acceptable only when CI blocks on the same gate.
