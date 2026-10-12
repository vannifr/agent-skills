# Protected pipelines and operator-gated outcomes

Repository governance wins over this skill. Look for protected paths in the
agent rules and governance documents (`git grep -n -i protected`).

When the pipeline, the hooks or the gate scripts are protected (for example
by a signed manifest that only the repository owner may update), a blocked
commit is an outcome, not an obstacle. Do not bypass the block. Deliver a
patch plus a handover note and report the finding as "operator-gated",
separate from "unproven": the first says who must act, the second says what
is not proven.

The handover has a fixed form:

- the patches in apply order (`git am`);
- the verification per commit sha (local evidence in the exact CI image,
  mutation proof);
- which signed manifest, secret or watchdog the owner updates afterwards;
  print a manifest diff to a file, never to the terminal.

Also check that the files that decide the gate (scan script, wrapper,
sabotage drill) are under the same protection. If they are not, a weakening
can slip past it: report that as a finding.
