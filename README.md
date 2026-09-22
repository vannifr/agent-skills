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
| [`responsive-visual-review`](skills/responsive-visual-review/) | Baseline-free, Playwright-driven visual/layout review across breakpoints (mobile/tablet/desktop) on a live or local website — full-page screenshots checked against a structural checklist (layout integrity, text, images, spacing, cross-breakpoint regressions). | No hosted visual-regression account (Percy/Chromatic/Storybook) or prior baseline needed — every run is a fresh structural read, not a pixel-diff against history, so it works from day one on a site with zero visual-testing setup. |
| [`cross-browser-render-check`](skills/cross-browser-render-check/) | Renders the same pages in Chromium, Firefox, and WebKit at one fixed viewport and diffs what a human would notice — font fallbacks, CSS feature gaps, form-control styling, engine-unique console errors. | Diffs by *engine*, not by width or by time — a different axis from viewport-based visual review and from a regression tool that diffs against a prior run; needs no existing multi-browser test suite, just a URL. |
| [`production-cwv-review`](skills/production-cwv-review/) | Compares real-user field performance data (Chrome UX Report, GA4 Web Vitals, Cloudflare/RUM) against Lighthouse lab data to find pages that look fast in a lab report but are actually slow for real visitors. | CrUX needs no setup at all for any sufficiently-visited public site — closes the lab-vs-field blind spot a Lighthouse-only performance audit always has, without requiring an existing RUM/APM contract. |
| [`load-test-bootstrap`](skills/load-test-bootstrap/) | Scaffolds and runs a small, bounded k6/Artillery load test against a site's or API's critical endpoints, with a mandatory scope-and-consent step (target, intensity, environment) before anything runs. | Bootstraps the *first* load test where none exists, rather than aggregating/gating on load tests a project already has (that's a CI-gate concern) — and treats running real load against a live target as an authorized action, not a default. |
| [`third-party-script-audit`](skills/third-party-script-audit/) | Inventories every third-party script/resource a website loads, classifies what data each one can access, checks Subresource Integrity, and diffs the site's CSP allowlist against what's actually loaded. | Looks at what the *browser* fetches from external origins — a distinct, commonly-skipped surface from server-side dependency scanning (`npm audit` etc.) and from a GDPR/consent legal review, which it feeds factual input into rather than replacing. |
| [`translation-quality-review`](skills/translation-quality-review/) | Reads translated strings against the source language across a multi-language site's locales and flags awkward/machine-sounding phrasing, broken placeholders, untranslated leftovers, terminology drift, and length-driven layout risk. | Starts where key-parity automation stops — it assumes every key already exists and asks whether the translation is actually any good, which no mechanical i18n check can answer. |

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

## Evaluation

Each skill's `evals/` directory holds scenario-based regression tests
(`tessl scenario generate` + `tessl eval run`): a task brief plus a
weighted checklist, run twice per scenario — once with the skill injected,
once without — and scored by a judge model. This is a stronger signal than
a static content review: it measures whether the skill actually changes
agent behavior for the better, not just whether it reads well.

```bash
tessl eval lint ./skills/<name>/evals/   # validate scenario structure
tessl eval run ./skills/<name>            # run the evals (consumes credits)
```

Results and methodology: [docs.tessl.io/improving-your-skills/evaluate-skill-quality-using-scenarios](https://docs.tessl.io/improving-your-skills/evaluate-skill-quality-using-scenarios).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT — see [LICENSE](LICENSE).
# test
