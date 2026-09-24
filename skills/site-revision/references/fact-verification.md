# Fact and quote verification

The gate that stops invented content from shipping. Run it on every new
or rewritten text, including text a delegated agent wrote.

## What counts as a source

| Claim | Acceptable source | Not a source |
|---|---|---|
| Quote from a publication or proceedings | The primary document (PDF, page, recording transcript) | A summary, index, "evidence matrix", or an agent's report of it |
| Testimonial | The owner confirms wording and attribution | A paraphrase, a quote assembled from feedback |
| Event facts (date, size, role) | The owner, or the organiser's own page | An earlier version of the site |
| The owner's own experiences | The owner | Anything else — never fill in an anecdote |

## Procedure

1. Extract text from the primary sources once with a PDF-to-text tool
   (e.g. `pdftotext -q <file>.pdf <file>.txt`).
2. Check how much text each file has (`wc -c`). A few dozen bytes means a
   scan without a text layer: nothing in it can be verified without OCR.
   Say so; do not treat its contents as confirmed.
3. For each quote, `grep -i` a distinctive phrase in the extracted text.
   Record file and line. The quote on the site must match the source
   (translation allowed on the other-language page, marked as such).
4. For each source tag (e.g. "[OS99]") and each year attached to an idea,
   confirm the idea appears in that specific document.
5. For numbers ("22 documents", "sixty participants"), confirm the
   number in the source. Prefer generic wording over an unverifiable
   count ("the proceedings since 1994, all available online").
6. For well-known sayings, search the origin online; attribute to the
   real origin (e.g. a book title and year) or drop it.
7. Anything that fails: remove it, and list it for the owner with the
   exact passage.

## Test the scan itself

Before trusting a "nothing found" result, run the same command against a
case where you know the answer is "found" (a copy with a known phrase or
a known metadata tag). A filter that can never match reports a clean
result forever.

## Recurring patterns of invented content

- A moving anecdote with a precise detail ("a facilitator doing this
  since 1998 told me …") that the owner never reported.
- Session titles or quotes attributed to a document that is a scan.
- Tool or product names in a summary that the source does not contain.
- A saying attributed to a community event instead of its real origin.
- A precise count of documents or participants copied from a summary.
- Several case paragraphs following one identical template: often the
  details were flattened or generalised; ask the owner to confirm each.
