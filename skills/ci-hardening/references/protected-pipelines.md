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

The handover script is itself a trust anchor. Take the allowed signers from
a trusted copy, not from the clone; derive the signing key with the key tool;
compute the anchor manifest independently of the repository code that the
patch changes; show upstream changes before any repository code runs; after
signing, check the parent and the patch id.

Also check that the files that decide the gate (scan script, wrapper,
sabotage drill) are under the same protection. If they are not, a weakening
can slip past it: report that as a finding.
