# Persona and name-test prompts

Write each prompt out in full: the subagent does not see the conversation. Use a read-only subagent in a fresh context per persona.

## Persona prompt (blind)

```
You are <persona: one paragraph with situation, trigger, hope, fear>.
You have just arrived on a website. Read only these two screenshots of the
first screen, without scrolling: <absolute path desktop>, <absolute path mobile>.
In a search result you saw this title: "<title>" and this description:
"<meta description>".
Read nothing else: no other file, no search, no website.
Answer in <language of the site>, in your own words, at most 12 lines,
quoting visible text literally:
1. What do I think this is? (one sentence)
2. Who is it for, and am I one of them?
3. What would I do first? Which button or action do I see?
4. What makes me distrustful or unsure?
5. Which question stays open?
6. Click on, come back, forward it, or leave, and why?
7. Five words I would remember.
8. Differences between desktop and mobile.
```

It never contains the norm, the brand card, the offer, the repository path or the name of the owner's strategy documents.

## Name test

```
You only know the brand name "<name>" and this search result: title
"<title>", description "<meta description>". You have not seen the site.
Answer briefly: what do you expect to find, for whom, what does it cost or
take to get in, what organisation do you picture behind it, and would you click?
```

## Full-page task

```
Here is a full-page screenshot: <path>. You want to get in touch or sign up.
Where do you click, and what do you expect to happen next? Quote the visible
text of the control.
```

## Checks on the answers

- Each quote exists on the screenshots; an invented detail is discarded.
- Note the tool calls per subagent; more than the screenshots needed means the instruction was not followed.
- Same personas and same questions in every run and every brand, so reports compare.
