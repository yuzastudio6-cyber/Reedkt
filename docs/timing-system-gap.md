# StoryTiming System Gap

## Current Gap

The repo mentions StoryTiming in product language, UI copy, credit estimates, audio planning, Stroke Motion timing anchors, and generated asset timing maps. However, this branch does not appear to include a dedicated master StoryTiming engine, contract set, or Supabase timing migration.

## Why Timing Is Critical

StoryTiming should coordinate:

- uploaded source sequence context
- recommended final edit structure
- cuts and pacing
- captions and word/phrase timing
- transitions
- Stroke Motion beats and timing anchors
- Graphic Design / VisualExplain moments
- Real Motion placement
- SoundSync music, SFX, beat sync, and ducking
- generated asset timing maps
- Remotion renderer layers
- QA checks for timing accuracy

## Missing Timing Records

Likely missing or incomplete master records:

- project timing map
- edit timing timeline
- segment timing anchors
- transcript word/phrase timing links
- music/SFX timing links
- visual layer timing links
- render layer timing links
- QA timing issues
- approved timing snapshot

## Recommended RP-TIMING Milestones

1. `RP-TIMING-01 - StoryTiming Engine Architecture`
2. `RP-TIMING-02 - TypeScript Timing Contracts`
3. `RP-TIMING-03 - Supabase Migration: Timing Tables`
4. `RP-TIMING-04 - Mock StoryTiming Planner`
5. `RP-TIMING-05 - Timing QA And Regression`

## Why Before Real Generation/Rendering

Real generation and rendering need stable timing so workers can execute approved plan snapshots without reinterpreting chat. If timing is added after live deployment, core edit plans, generated assets, render jobs, audio plans, and QA reports may need schema changes.
