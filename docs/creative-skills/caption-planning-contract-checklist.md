# Caption Planning Contract Checklist

Use this checklist for future caption skill prompts. This is documentation only and must not be converted into runtime code, TypeScript, SQL, JSON schema, migrations, prompt execution, caption rendering, ASR, transcript processing, translation, workers, providers, UI, package changes, Supabase work, or app behavior.

## Required Checks

| Check | Pass condition |
| --- | --- |
| Universal inheritance | The prompt inherits `skill-planning-contracts.md` and keeps planning-first, approval-gated, credit-aware behavior. |
| Purpose | The caption plan states why captions are needed, reduced, rejected, or deferred. |
| Role | The plan selects a caption role such as `basic_readable_captions`, `keyword_emphasis_captions`, `quote_captions`, `captions_reduced_for_hero_visual`, or `no_captions`. |
| Source type | The plan names the caption source type, such as `transcript_segment`, `user_provided_script`, `ASR_transcript_future`, `translated_text_future`, `mock_only`, or `unknown_source`. |
| Accuracy status | The plan names the accuracy status, such as `exact_transcript`, `cleaned_for_readability`, `condensed_without_meaning_change`, `paraphrase_needs_approval`, `translated_needs_review`, or `low_confidence_needs_review`. |
| Text policy | The plan preserves meaning and states cleanup, condensation, quote, claim, profanity/sensitive-word, and review rules. |
| Line-breaking | The plan defines max lines, phrase-safe breaks, words/characters per line target, and punctuation behavior. |
| Timing and read time | The plan defines caption start/end, minimum read time, maximum on-screen time, speech anchor, StoryTiming relationship, transition relationship, and B-roll/graphic/3D relationship. |
| Placement and safe area | The plan defines placement zone, screen zone, safe area, platform UI margin, aspect ratio behavior, and fallback zone. |
| Face/object/collision checks | The plan checks face, mouth, eyes, product action, important object, lower third, graphic, B-roll, 3D, browser/app, proof page, CTA, and platform UI collisions. |
| Animation and emphasis | The plan defines animation level, keyword emphasis policy, motion comfort, repetition control, and when captions stay static. |
| Style and readability | The plan defines readability strategy, contrast, typography intent, background plate/shadow/stroke needs, and platform readability notes. |
| Accessibility | The plan states accessibility needs, speaker identification needs, no-audio/noisy-environment support, and stable caption behavior. |
| Translation and multilingual future notes | Translation, multilingual, RTL, localization, and non-speech audio cue notes are explicitly marked future-only unless a later approved implementation exists. |
| Source/proof/claim safety | The plan forbids invented claims, names, prices, metrics, dates, UI labels, dashboards, websites, quote wording, evidence pages, and unsupported proof captions. |
| Credit and approval | The plan states credit impact and approval behavior for paraphrase, quote, claim-sensitive text, translation, premium animation, future rendering, or generated/future work. |
| QA | The plan lists source accuracy, meaning preservation, read time, line break, contrast, placement, collision, motion comfort, StoryTiming, claim safety, and accessibility QA. |
| Revision | The plan offers revisions such as reduce density, move captions, change style, remove animation, preserve exact transcript, request approval, or disable captions. |
| StoryTiming handoff | The plan hands off conflicts around cuts, transitions, B-roll, overlays, graphics, 3D, SFX, music, reveal events, and caption events. |
| Forbidden runtime actions | The prompt remains docs-only and avoids runtime code, TypeScript, migrations, installs, package mutations, UI, providers, workers, ASR, transcript processing, translation, caption rendering, render/export, browser/capture/media/generation runtime, Supabase work, or app behavior. |

## Required Pseudo-record Coverage

Future caption planning prompts should cover these documentation-only pseudo-records or explain why a record is out of scope:

- `CaptionTimingPlan`
- `CaptionTextPlan`
- `CaptionPlacementPlan`
- `CaptionSkillPlan`

These pseudo-records must remain Markdown documentation unless a later explicitly approved implementation prompt creates real contracts.

## Fail The Prompt If

- It executes from "captions", "add captions", "caption skill", or any caption-name-only execution.
- It has skill-name-only execution with no planning contract.
- It omits caption purpose, role, source type, or accuracy status.
- It changes speech meaning without marking approval required.
- It invents claims, names, prices, metrics, dates, UI labels, dashboards, websites, testimonials, evidence pages, or product details.
- It uses low-confidence transcript text without review.
- It paraphrases quotes, testimonials, or claim-sensitive text without approval.
- It treats translation, multilingual captions, ASR, transcript processing, or caption rendering as implemented.
- It places captions over faces, mouths, eyes, important objects, product actions, UI, proof pages, B-roll insets, 3D visuals, graphics, lower thirds, CTAs, or platform UI without a collision plan.
- It uses unreadable timing, too little read time, too much density, poor contrast, tiny text, or unsafe line breaks.
- It forces captions after the user says no captions without documenting the override reason.
- It duplicates graphic/card/proof text without purpose.
- It uses random kinetic caption motion or repeated animation without meaning.
- It omits premium/generated/future credit impact or approval behavior.
- It omits visual/audio/3D/B-roll/graphic placeholders when those layers affect captions.
- It adds runtime code, TypeScript, migrations, installs, package mutations, UI, provider calls, workers, ASR, transcript processing, translation, caption rendering, render/export, browser/capture/media/generation runtime, Supabase work, or app behavior.

## Future Prompt Footer

Future caption prompts should end by stating:

- Public API changes: none, unless explicitly approved later.
- TypeScript contract changes: none, unless explicitly approved later.
- Database/Supabase changes: none, unless explicitly approved later.
- Runtime/provider/package/UI changes: none, unless explicitly approved later.
- Caption rendering, ASR, transcript processing, translation, workers, providers, browser capture, media analysis, and render/export remain forbidden unless explicitly authorized in a later implementation prompt.
