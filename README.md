# agent-skills

Reusable, tool-agnostic skills for coding agents — works the same in Claude
Code, opencode, qwen code, or any tool that reads a `SKILL.md` bundle. No
tool-specific glue: install a skill by pointing your tool's skill-discovery
path at `skills/<name>/`, or symlink it in.

## Skills

| Skill | What it does | What makes it different |
|---|---|---|
| [`nfr-gap-audit`](skills/nfr-gap-audit/) | Systematic, self-directed skill-and-NFR audit for a website/web-app project: discovers relevant skills from Tessl and VoltAgent, runs a project-type-aware gap analysis across 12 non-functional-requirement domains (performance, accessibility, security, SEO, testing, reliability, maintainability, scalability, privacy, i18n, monitoring, content quality), and drives phased, regression-checked implementation. | Combines dual-source skill discovery *and installation* with a 12-domain NFR sweep and a severity/privacy-aware exception path (Critical findings jump the queue; GDPR/legal-risk findings require stakeholder sign-off before any mechanical fix) — no other public skill combines all three. |
| [`ci-local-parity`](skills/ci-local-parity/) | Ensures a project's local verification command (`pnpm verify` or equivalent) actually covers everything CI checks — adds enforcing git hooks, catches coverage-report gaps, catches CI-image/local binary drift, and keeps trunk-based development honest (checked per push, not per batch). | Solves local↔CI *drift detection* specifically — not "how to build a pipeline" (generic CI-setup guides) or "wire up pre-commit" (dependency-based hook managers). Uses native git hooks, deliberately no Husky/lint-staged dependency. |

## Install

Each skill is a self-contained `skills/<name>/SKILL.md` bundle (optionally
with a `references/` subfolder). Pick the mechanism your tool supports:

**Via Tessl** (any tool with the Tessl CLI/MCP configured):
```bash
tessl install vannifr/nfr-gap-audit
tessl install vannifr/ci-local-parity
```

**Manually** — clone this repo and point your tool at it:
- **Claude Code**: symlink into `~/.claude/skills/<name>` or a project's
  `.claude/skills/<name>`.
- **opencode**: symlink into `~/.claude/skills/<name>` or
  `~/.agents/skills/<name>` (opencode's global discovery paths), or add
  this repo's `skills/` to a project's `skills.paths` in `opencode.jsonc`.
- **qwen code**: symlink into `~/.qwen/skills/<name>`.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT — see [LICENSE](LICENSE).
