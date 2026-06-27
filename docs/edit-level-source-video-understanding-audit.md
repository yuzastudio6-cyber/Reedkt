# Edit Level Source Video Understanding Audit

## Current Source Understanding Surfaces

The current repo has a local/mock Footage Prep and Source Understanding foundation:

- `docs/reeditpro-production-workflow/02-footage-prep-clean-assembly.md`
- `docs/reeditpro-production-workflow/07-database-expansion-plan.md`
- `src/types/footage-prep.ts`
- `src/lib/footage-prep/*`
- `src/lib/video-understanding.ts`
- `src/components/editor/InlineVideoUnderstandingCard.tsx`

These surfaces cover transcript, speech sections, scene segments, silence, retakes, quality flags, hook/CTA candidates, b-roll candidates, face/text/screen indicators, and Source Understanding Map metadata. They remain mock/local unless a future worker milestone adds real media analysis.

## Future Depth By Level

| Future level | Source understanding depth |
| --- | --- |
| Normal | Targeted/basic context: duration, dimensions/aspect ratio, source order, basic transcript if available, obvious marker clarification, and essential quality issues. |
| Premium | Source video understanding package: key moments, marker windows, timecoded transcript when speech exists, audio/music/SFX/ducking recommendations, and useful visual support opportunities. |
| Ultra Premium | Deep source understanding: scene-level Qwen2.5-VL visual analysis, transcript plus speech timing, audio/sound design planning, visible text/layout understanding, and stricter source-truth QA. |

## Gaps

- Current source understanding is not routed by edit level.
- No `qwen25vlVisualDepth` policy exists.
- No media extraction budget profile exists.
- Real video understanding, transcript alignment, and audio analysis are not implemented.

## Recommendation

Reuse Footage Prep, Source Understanding Map, and mock Video Understanding Report as the integration points. Add level-aware routing only after `EditLevelProfile` and worker/runtime gates exist.
