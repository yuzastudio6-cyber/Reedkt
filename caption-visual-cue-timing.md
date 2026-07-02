# Caption + Visual Cue Timing

## Purpose

Caption Timing + Visual Cue Timing controls when text, cards, graphics, maps, charts, browser visuals, animations, and emphasis moments appear. The goal is for captions to feel synced to the speaker, visuals to appear when the viewer needs them, text to remain readable, motion to feel intentional, and the edit to feel professional instead of random.

This layer refines the broad `MasterTimingPlan`. It remains mock-only until future transcript, audio, media, and render workers exist.

## Caption Timing Principles

Captions should align to speech phrase boundaries, appear slightly before or exactly as the phrase begins depending on style, avoid lagging behind the speaker, stay readable long enough, and exit without hanging awkwardly after speech ends. Captions must not cover faces, mouths, products, map pins, chart labels, browser highlights, source labels, or fact-safety notes.

Caption chunks should be readable units. Emphasis should be reserved for important words, not every word. Emotional pauses should be preserved, and kinetic typography should be avoided unless the user asks for it or the edit style clearly supports it.

## Visual Cue Timing Principles

Visuals should reveal when the spoken concept appears, support the segment purpose, hold long enough to understand, and exit cleanly before the next unrelated idea. Visual cues must respect caption safe zones and avoid covering the face, product, map, chart, browser focus, or source labels.

Beat alignment is useful only when speech and meaning allow it. Motion timing should fit the category, platform, aspect ratio, and edit level.

## Caption vs Visual Priority

When captions and visuals compete for timing or space, use this priority:

1. Speech clarity
2. Caption readability
3. Visual readability
4. Story and emotion
5. Beat sync
6. Decorative motion

A chart should not hide captions. A caption should not cover the main data point. A beat should not force a caption to become unreadable.

## Caption Chunking

- `phrase_based`: default for most talking-head and social edits.
- `sentence_based`: documentary, calm business, and slower pacing.
- `word_pop`: high-retention social only when appropriate.
- `keyword_emphasis`: Pro/Premium captions where key words pop.
- `subtitle_block`: documentary, interview, and training.
- `minimal_caption`: lifestyle, clean videos, or user-requested minimal captions.
- `no_caption`: user requests no captions or the edit does not need them.

## Caption Animation Styles

- `none`
- `fade`
- `soft_pop`
- `word_highlight`
- `kinetic_word_pop`
- `slide_up`
- `typewriter`
- `documentary_lower_third`
- `premium_minimal`

Basic uses clean readable captions. Pro can use keyword emphasis and tasteful animation. Premium can use refined timing and micro-animation. Documentary and case-study edits should stay restrained unless the user asks for a more stylized treatment.

## Visual Cue Types

Visual cue types include card reveals, name cards, fact cards, evidence cards, map pin drops, map routes, chart starts and step reveals, browser zooms and highlights, Stroke Motion starts and emphasis moments, AI video panel starts and ends, lower panels, full takeovers, depth overlays, foreground mask moments, and transitions.

## Read Time Rules

Text-heavy visuals need more hold time. One-word emphasis can be short. A 3-5 word caption can be short to medium. Fact cards and name cards need medium hold. Charts, maps, browser visuals, evidence boards, and documentary source cards need longer hold. Lower panels require lower label density and longer readability, while full-screen takeovers can safely hold more detail.

## Category Behavior

Storytelling preserves reveal, reaction, and emotional pauses. Education reveals graphics step-by-step when concepts are spoken. Documentary uses measured captions, restrained motion, and evidence/source cards that are not rushed. Business times product or browser highlights to problem, feature, benefit, and CTA lines. Lifestyle uses lighter captions and softer visual cue timing.

## Tier Behavior

Basic uses readable phrase captions, simple fade or pop, simple card reveals, low cue density, and no chaotic motion. Pro adds keyword emphasis, better visual syncing, map/chart/browser timing, and tasteful SFX or transition sync. Premium adds refined phrase and word timing, scene-level cue timing, deeper QA, and more complex but still intentional motion.

## Non-Goals

This milestone does not implement real word-level transcript alignment, speech-to-text, beat detection, Remotion rendering, media processing, provider calls, backend work, or tool execution.

## Validation And Credit Impact

Caption + Visual Cue Timing is validated by `TimingValidationPlan` before approval. Validation checks caption duration, word density, animation restraint, visual read time, lower-panel/caption collision risk, map/chart/browser label read time, and lower-cost alternatives when cue density raises credits.

The validation remains mock-only. It does not run speech-to-text, transcript alignment, pixel collision detection, Remotion, provider calls, or media processing.
