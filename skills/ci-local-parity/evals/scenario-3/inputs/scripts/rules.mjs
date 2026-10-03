const MARKER = /\[(P|D|H)\]/;

export const RULES = [
  {
    id: 'claim-has-marker',
    check: (text) =>
      text.split('\n').filter((l) => l.startsWith('| ')).some((l) => !MARKER.test(l))
        ? 'finding row without evidence marker'
        : null,
  },
  {
    id: 'primary-needs-quote',
    check: (text) =>
      /\[P\]/.test(text) && !/> ".+"/.test(text) ? 'primary claim without quote' : null,
  },
  {
    id: 'no-empty-findings',
    check: (text) =>
      /## Findings\s*\n\s*(##|$)/.test(text) ? 'empty findings section' : null,
  },
];
