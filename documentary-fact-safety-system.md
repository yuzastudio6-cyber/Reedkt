# Documentary Fact Safety System

## Purpose

Documentary and Case Study edits often mention named people, companies, controversies, alleged scams or fraud, lawsuits, investigations, charges, timelines, money amounts, evidence, opinions, and claims from sources.

ReeditPro must plan visuals so uncertain claims are not presented as proven facts. The planner should keep names, claims, money amounts, and allegations visually neutral unless verified and approved. This protects the user, the subject, and the final edit from misleading or sensational visual framing.

This system is planning only. The frontend mock does not verify facts, perform web research, inspect legal records, call external APIs, or decide whether claims are true.

## Claim Status System

- `fictional`: the story is explicitly fictional, hypothetical, roleplay, or demo material.
- `verified_fact`: the user/source confirms the claim is verified.
- `allegation`: the claim is asserted but not verified as fact.
- `charge`: the claim relates to a legal charge or formal legal status.
- `claim_by_source`: the claim is attributed to a source or document.
- `opinion`: the claim is framed as opinion or interpretation.
- `unknown`: the planner does not know the claim status.

## Visual Treatment By Claim Status

### Fictional

Normal story visuals are allowed, but ReeditPro should still avoid unnecessary gore, defamation-like framing, or sensational treatment.

### Verified Fact

Stronger factual language and visuals can be used when the plan marks the claim as verified. Visuals should still avoid needless sensationalism.

### Allegation

Use careful language such as "alleged", "accused", "reported", or "claimed". Use neutral visuals. Do not use guilt-implying reenactments unless the plan explicitly frames them as allegations and the user approves.

### Charge

Use legally careful language and neutral court, document, or evidence visuals. Do not imply conviction unless conviction is verified and approved.

### Claim By Source

Attribute the claim to the source. Use source cards, document cards, timeline cards, or evidence-board visuals. Do not treat the claim as independently proven.

### Opinion

Visually distinguish opinion from fact. Avoid evidence-style certainty when the content is interpretive.

### Unknown

Ask a clarifying question when the answer changes the edit, or default to neutral visuals. Avoid strong factual claims.

## Fact Safety Planning

A fact safety plan should include:

- claim text
- people mentioned
- organizations mentioned
- claim status
- whether a source is needed
- source label if available
- safe wording
- visual treatment
- avoid rules
- clarifying question if needed
- QA checks

## Documentary Visuals

Use:

- evidence board
- timeline card
- neutral name card
- money trail graphic
- document card
- map card
- source card
- anonymized or generic figure
- stylized non-realistic figure
- neutral lower-third

Avoid unless verified and approved:

- jail or prison visuals
- handcuffs
- mugshot-style framing
- guilty labels
- demonizing visuals
- aggressive red marks over faces
- fake evidence screenshots
- scenes showing a real person committing alleged acts
- sensationalized guilt imagery

## Chat Question Policy

For Documentary / Case Study edits, ask a clarifying question when:

- names are mentioned and claim status is unclear
- the user asks for a real person to be shown doing an alleged act
- a money amount or source is unclear
- legal status is unclear
- the user wants a strong accusation without a source

Example:

`Are these names and claims verified by your source, or should I present them as allegations?`

Do not ask unnecessary questions about every visual detail. If the missing answer does not change the edit, default to neutral treatment.

## QA

Fact-safety QA must check:

- claims are labeled correctly
- allegations are not presented as facts
- real people are shown neutrally when uncertainty exists
- visuals do not imply guilt without verification
- money amounts are presented as claimed or verified depending on status
- source labels are included where needed
- custom user instructions do not override fact-safety rules
- prompt plans include fact-safety notes

## Frontend Mock Boundary

This frontend mock does not verify facts. Future backend work may add source verification, user-provided references, editorial review, or fact-check workflows. For now, the planner marks source-needed items, asks purposeful clarifying questions, and uses neutral visuals when claim status is unclear.

## Non-Goals

This document does not implement web research, real fact verification, real identity verification, OpenAI/GPT calls, GPT-Image-2 calls, Wan/Hailuo/Veo calls, Remotion rendering, backend, Supabase, migrations, Stripe, credit deduction, export jobs, Google Cloud workers, or mobile work.
