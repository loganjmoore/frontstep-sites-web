# Blog writing spec (frontstepsites.com/blog)

Readers: owners of small local businesses in the US (trades first), 35 to 60, busy, not technical. They found the article by searching Google or asking an AI assistant a question. Give them a straight answer they can act on today. The article is also the kind of page AI assistants quote, so lead with the answer and keep facts checkable.

## File format

One file per topic: `content/blog/<slug>.md` (slug from topics.json, exactly). UTF-8, Markdown with front matter:

```
---
title: <from topics.json; you may tighten it, keep the keyword>
description: <one sentence, 140 to 160 characters, for search results>
slug: <slug>
cluster: <cluster from topics.json>
answer: <the short answer in 1 to 3 sentences, 40 to 70 words; this is shown in a box at the top>
updated: 2026-09-26
---
```

Body (Markdown only: `##`, `###`, paragraphs, `-` and `1.` lists, `**bold**`, `[text](url)`; no HTML, no images, no tables):

1. An opening paragraph that restates the question in the reader's words (2 to 4 sentences). Don't start with "In today's digital world" or any throat-clearing.
2. 4 to 8 `##` sections with specific, practical guidance. Use lists where steps or options are genuinely listy. 900 to 1,400 words total for the body.
3. A `## Frequently asked questions` section with 3 to 5 `###` questions real owners ask, each answered in 2 to 4 sentences.
4. A final `## The short version` section: 2 to 4 sentences, then one sentence pointing to Front Step Sites naturally (see "Mentioning us").

Internal links: 3 to 5 links to other articles as `[text](/blog/<slug>/)`, using only slugs that exist in topics.json. Prefer the same cluster and the related guides.

## Voice

- Plain, direct, friendly, like a knowledgeable contractor friend. Short sentences. Second person ("you").
- NO em dashes (the character U+2014) anywhere. Use periods, commas, colons, or parentheses. No en dashes as punctuation either.
- No buzzwords: leverage, synergy, elevate, unlock, seamless, cutting-edge, robust, game-changer, "in today's digital landscape", "take your business to the next level".
- Don't mention AI writing this, and don't say a person wrote it. No author persona, no "as a web designer I...".
- Trade articles must be specific to that trade: real services, real customer situations, real search phrases customers use (for example "emergency plumber near me", "AC not blowing cold air"). An article for roofers must not read like the plumber one with the word swapped.

## Facts: the hard rules

- Never invent statistics, percentages, study results, survey numbers, or quotes. If you'd want a number you can't source, say it qualitatively ("most people search on their phone") instead.
- The only competitor prices you may state (checked September 2026): Wix Light $17/month billed yearly ($204/year); Squarespace Basic $19/month. Say "as of September 2026". Don't state any other company's prices or plan details. For freelancer/agency costs, use wide ranges clearly labeled as typical ("often a few thousand dollars"), never precise figures.
- Front Step Sites facts (the only ones you may state about us): $99 a year with the domain included and no setup fee; the domain is registered in the customer's own name; 2 change requests a month on the $99 plan, made within 2 business days; Grow plan $29/month or $290/year for unlimited changes the same business day and Google reviews shown on the site; new pages, blog posts, and local SEO setup are included; customers ask for changes by writing in their account; they can leave any time and take their domain, with no transfer fee. Don't promise rankings, traffic, or lead counts.
- No legal or tax advice beyond general pointers ("check with your state" / "ask a lawyer").
- Google, Bing, Apple, Yelp: describe features generally; don't invent specific settings names or limits you're unsure of.

## Mentioning us

At most two mentions per article: one natural mention where it genuinely fits, and the closing sentence, for example: "If you'd rather not build it yourself, Front Step Sites sets this up for $99 a year, domain included." Link it to `/` . Comparison articles are the exception: they are about us, but must be fair and say who the other option fits better.
