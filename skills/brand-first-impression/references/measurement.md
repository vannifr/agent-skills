# Measurement snippet

Run once per viewport in the browser tool's page-evaluation function. It measures what a screenshot cannot prove: where each control is, whether it is clipped, and which CTA-like controls exist at what height. Adapt the CTA pattern to the language of the site.

```js
() => { const r0 = e => e.getBoundingClientRect(); return ({
  title: document.title,
  desc: document.querySelector('meta[name=description]')?.content,
  og: document.querySelector('meta[property="og:description"]')?.content,
  h1: [...document.querySelectorAll('h1')].map(e => e.innerText),
  lang: document.documentElement.lang,
  fold: [...document.querySelectorAll('a,button')].filter(e => { const r = e.getBoundingClientRect(); return r.top < innerHeight && r.height > 0 }).map(e => ({ t: e.innerText.trim().slice(0, 60), h: e.getAttribute('href'), x: Math.round(r0(e).left), right: Math.round(r0(e).right), clipped: r0(e).right > innerWidth || r0(e).left < 0 })),
  cta: [...document.querySelectorAll('a,button,input[type=submit]')].filter(e => /contact|book|request|sign|start|plan|get in touch|subscribe|buy/i.test(e.innerText || e.value)).map(e => ({ t: (e.innerText || e.value).trim().slice(0, 60), h: e.getAttribute('href'), y: Math.round(e.getBoundingClientRect().top + scrollY) })),
  forms: [...document.querySelectorAll('form')].map(f => ({ action: f.getAttribute('action'), fields: [...f.elements].filter(e => e.name).map(e => e.name + ':' + e.type + (e.required ? '*' : '')) })),
  pageHeight: document.documentElement.scrollHeight,
  textLength: document.body.innerText.length,
  links: [...new Set([...document.querySelectorAll('a[href]')].map(a => a.getAttribute('href')))]
}) }
```

## Reading the result

- `fold` lists controls with their top above the viewport height. A control with `clipped: true` exists in the page but part of it lies outside the viewport (for example a header button pushed off the screen on mobile): a visitor cannot reach it. Measure the horizontal position as well as the vertical one.
- `cta[].y` against the viewport height says whether a CTA is above or below the fold. Report the position of the first CTA and `pageHeight`.
- `forms[].action` shared between different forms means the channel cannot be told apart afterwards.
- `links` with `#` or empty destinations are dead CTAs; links to another brand are checked against the separation rules.
- A persona's layout claim ("missing", "cut off") that contradicts the measurement is investigated, not dismissed.
- A fixed overlay (cookie banner) can cover the primary button on mobile: measure its height, its top and its overlap with the first button (select by `position: fixed`; if a measured value does not fit the screenshot, repeat with a sharper selector before reporting).
- Opening language without a browser: request the page with an `Accept-Language` header per language and read `<html lang>`; whether the choice is remembered stays unmeasured.
- Skip links ("skip to main content") sit outside the viewport on purpose: ignore them in the clipped check.
- `clipped: true` is only a candidate. Scroll horizontally and check whether the page scrolls (`scrollX` stays 0 when nothing is reachable), and check the menu state (for example `aria-expanded="false"`): a closed off-canvas menu is outside the viewport by design. For bottom-edge "cut-off text" claims compare the element rectangle with the viewport height and its `clientHeight` with `scrollHeight`.
