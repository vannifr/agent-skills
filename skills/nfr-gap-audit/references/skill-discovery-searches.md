# Phase 1 — Dual-Source Skill Discovery Details

## Tessl registry search

Run these searches and note all relevant results:

```
tessl_search "web performance"
tessl_search "accessibility WCAG"
tessl_search "SEO structured data"
tessl_search "testing playwright E2E"
tessl_search "security headers CSP"
tessl_search "design system tokens"
tessl_search "CI pipeline deployment"
tessl_search "analytics monitoring"
tessl_search "copywriting content marketing"
tessl_search "CRO conversion"
tessl_search "landing page audit"
tessl_search "TDD behavioural"
tessl_search "code review audit"
tessl_search "GDPR privacy"
tessl_search "internationalization i18n"
tessl_search "error tracking Sentry"
tessl_search "visual regression"
tessl_search "accessibility testing axe"
tessl_search "content strategy"
tessl_search "brand guidelines"
```

## VoltAgent awesome-agent-skills search

Fetch and scan https://github.com/VoltAgent/awesome-agent-skills for
relevant skills:

```bash
curl -s https://raw.githubusercontent.com/VoltAgent/awesome-agent-skills/main/README.md | grep -iE "(performance|accessib|wcag|a11y|seo|aeo|geo|testing|playwright|axe|security|CSP|header|design.system|token|CI|CD|pipeline|analytics|monitoring|copywriting|content|CRO|conversion|landing|brand|typography|theme|TDD|code.review|audit|GDPR|privacy|i18n|internationalization|error.tracking|Sentry|visual.regression|image.optimization|webp|font.optimization|preload|lazy.load|bundle|CSS|minification|structured.data|JSON-LD|schema|sitemap|canonical|redirect|htaccess|cloudflare|pages|wrangler|blog|article|writing|newsletter|social|publish|marketing|analytics|monitoring|error|audit|quality|best.practice|static.site|elevent|11ty|nunjucks|responsive|mobile|touch|PWA|offline|cache|CDN|performance|CWV|LCP|INP|CLS|TTI|TTFB|render.block|CSS.optim|minif|bundle|tree.shake|dead.code|bundle.size)"
```

## Skill classification

Classify all skills found:

| Category | Skill | Source | Relevance | Install |
|-----------|-------|------|------------|-------------|
| Performance | [skill name] | Tessl/VoltAgent | High/Medium/Low | tessl_install / github: |
| Accessibility | ... | ... | ... | ... |
| SEO | ... | ... | ... | ... |
| Testing | ... | ... | ... | ... |
| Security | ... | ... | ... | ... |
| CI/CD | ... | ... | ... | ... |
| Analytics | ... | ... | ... | ... |
| Design System | ... | ... | ... | ... |
| Marketing | ... | ... | ... | ... |
| NFR: [domain] | ... | ... | ... | ... |

## Installation

Install all skills with relevance "High" and "Medium":
- Tessl registry skills: `tessl_install workspace/skill@version`
- GitHub skills: `tessl_install github:user/repo` with `skills: ["skill-name"]`
- Skip skills that are already installed
