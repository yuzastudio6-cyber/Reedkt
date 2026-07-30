# QA, Repair, and Fallbacks

## Required QA layers

| Layer | Representative checks |
| --- | --- |
| Transcript/semantic | source coverage, lineage, transformation approval, names/numbers/claims, speaker evidence |
| Timing | StoryTiming refs, monotonic frames, speech sync, effective stable duration, cut/transition safety |
| Typography | glyphs, shaping, metrics, line breaks, role consistency, size stability |
| Spatial | protected regions, crop variants, placement stability, B-roll/label collision |
| Depth/occlusion | mask edges, hidden proportion, critical-token visibility, flicker, accessible projection |
| Motion | allowed primitives, density, interruption, camera/visual conflict, reduced-motion parity |
| Sound | cue eligibility, density, hit frames, dialogue protection, music relationship |
| Accessibility/localization | complete wording, contrast, sidecars, speakers, RTL/CJK/Indic/combining/emoji, translation parity |
| Render/color | deterministic spec, renderer version, golden frames, color/alpha/stroke/shadow appearance |
| Export | stream/package metadata, duration/frame count, caption tracks, sync, artifact integrity |
| Policy/security | approved snapshot, tenant/path safety, tool/model/font approval, no secrets/raw chat/code |

Blocking failures prevent delivery. Warnings are explicit and cannot be reclassified by the same worker without evidence.

## Repair locality

Repair the narrowest owner:

- text error -> projection/transcript review;
- bad break -> layout only;
- collision -> placement candidate/scene only;
- mask flicker -> mask owner or safe depth fallback;
- motion excess -> motion primitive/style scene only;
- sound conflict -> SoundSync mix/cue only;
- glyph issue -> font fallback/subset/layout;
- export defect -> packaging only.

Repairs create new versions and preserve previous approved artifacts. Changes outside the Caption Approval Envelope return to plan/credit approval.

## Fallback ladder

1. retry deterministic local operation only when idempotency and failure class permit;
2. simplify layout/motion while preserving approved meaning;
3. move creative track to a safe plane/region;
4. replace word motion with phrase-level stable motion;
5. render stable open captions through libass;
6. provide accessible sidecars;
7. request user review when structural value, claims, privacy, meaning, or approved scope changes.

Maps, charts, browser captures, captions, timing, masks, labels, and QA never fallback to AI video.

## Key formulas and evidence

Effective stable reading duration equals total cue frames minus unstable entrance, unstable exit, and frames not sufficiently readable. Rendered frames—not only planned boxes—determine readability and occlusion.

## Benchmark plan

Track semantic coverage/error, timing error, line-break violations, glyph/shaping failures, protected-region overlap, intentional occlusion readability, placement movement, contrast failures, effective read duration, render determinism, frame time, memory, fallback rate, repair locality, accessible projection parity, and export integrity. Thresholds are output/language/profile-specific and require owner approval before production.
