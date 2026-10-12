# Local git hooks: enabling, testing and degrading

Local hooks are the first barrier, never the only one: CI keeps every gate.
This reference covers what goes wrong when hooks are switched on, tested or
made to run in a restricted environment.

## Before switching on a tracked hooks directory

Setting `core.hooksPath` to a tracked directory silently switches off every
hook in `.git/hooks` (an assertion-integrity hook, a lint hook, a
`pre-commit.d` directory). Verify first, in a fresh clone:

- read the hooks: what they do, which tools, network or credentials they
  need, and whether they warn and skip or fail hard;
- compare with the hooks that are active now (`git rev-parse
  --git-common-dir`): the tracked hooks must contain or chain them. A chain
  script looks for the local hook, runs it, logs one line and skips when it
  is absent, and writes nothing into `.git/hooks`;
- run a real test commit and a pre-push simulation without pushing, and
  prove isolation (`core.bare`, commit count, refs and `user.*` unchanged);
- use the repository's own install script (`prepare`, a hooks-install
  target) to set the value.

Test the chain with a temporary repository that has a failing stub hook:
without the stub the chain skips silently, with it the commit must fail.

## Testing hooks

- Strip every `GIT_*` variable in hook tests: a running pre-commit exports
  `GIT_INDEX_FILE` and more, which leak into the temporary repository.
- Run `env -u <server token variable>` on every git call that can trigger a
  hook (push and pull too, not only commit), otherwise a verification run
  can start a real analysis on the quality server.
- A hook that writes to the global git config (for example
  `safe.directory` on every commit) must be idempotent (`--get-all` plus
  `grep -qxF`) and limited to CI or a strict mode. Test: nothing written
  locally, exactly one line after two runs in CI or strict mode, and a real
  failure still fails. An existing duplicated global config is user
  configuration: report it, do not clean it.
- Reference pattern for such a test: a temporary `HOME`, its own
  `GIT_CONFIG_GLOBAL`, `CI` and all `GIT_*` stripped, and the checked script
  pointed at a scratch copy of the old version for the mutation proof.

## Degrading in a restricted environment

A hook or local check that needs a socket, docker, a local server or a
secrets file cannot run in an agent sandbox. The accepted pattern is a
bounded relaxation of "local equals CI" (confirm it with the owner):

- keep a fast, safe subset locally (lint, quick unit tests, secret scan);
- a step may degrade only on its specific cause (a permission error on a
  socket, the server unreachable, the secrets file unreadable), never on a
  general non-zero exit code;
- the degradation prints a visible warning that CI still covers the step,
  and never happens in CI;
- every degraded step gets tests: (a) the specific cause degrades, (b) a
  real failure still fails, (c) in CI it never degrades; plus a mutation
  proof;
- pipeline lint may degrade locally only when CI itself refuses to start an
  invalid pipeline file: write that CI coverage down in the agent rules and
  prove it in the step image.

Tests that fail only in the sandbox (sockets) are not skipped: report them
as a sandbox limitation and run them outside it for the proof.

## Who runs what outside the restricted environment

Before a step that an agent would run outside its restricted environment (a
push, a `git config` write), establish whether the hooks were changed by an
agent. If so, the owner pushes: the hooks would otherwise run unrestricted.
