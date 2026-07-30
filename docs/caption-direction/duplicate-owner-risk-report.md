# Duplicate-Owner Risk Report

## Highest risks

| Risk | Existing owner | Duplicate temptation | Required control |
| --- | --- | --- | --- |
| Parallel final timing | StoryTiming | caption-local frames or seconds | Caption records express constraints; StoryTiming resolves all final frames |
| Parallel transcript | speech/transcript system | caption-specific cleaned transcript | projections reference immutable canonical words and transformations |
| Parallel skill taxonomy | professional skill registry | new unrelated mini-skill registry | extend/adapter existing catalog and relationship model |
| Parallel layout engine | speaker/layout/depth/render plans | caption-only scene layout | consume shared occupancy and output-frame records |
| Parallel Living Frame | Living Frame system | caption animation generating illustrations/scenes | typed handoff with clear sender/receiver ownership |
| Parallel visual generators | map, diagram, B-roll, Stroke Motion owners | caption-to-visual direct execution | bridge intent only; receiver creates approved asset |
| Parallel sound mix | SoundSync | caption renderer embedding uncontrolled SFX | sound cue plan after motion lock; SoundSync mixes |
| Parallel approval/credits | approval and credit services | caption-specific spend gate | Caption Approval Envelope is nested in existing approval |
| Parallel asset state | asset manifest | renderer-local filenames as truth | every output becomes a manifest artifact |
| Parallel export | render/export stack | caption-specific mux/delivery job | caption tracks are inputs to canonical export |

## Existing overlaps to reconcile

- `CaptionPlan`, `CaptionPlanRecord`, `CaptionVisualCueTimingPlan`, StoryTiming caption records, worker caption segments, and database `caption_plans` all describe parts of caption state with different shapes.
- Flat `captions.*` skills mix parent-level outcomes, components, delivery modes, and restraint.
- SRT/VTT/ASS records, creative render layers, and accessibility tracks are not yet modeled as projections of the same transcript.
- Both old frame layout policy and depth-aware overlay policy encode captions as topmost, while the target needs typed depth-plane exceptions.

## Control pattern

Every new CAP contract must declare:

1. its authority and lifecycle;
2. the existing record it consumes or adapts;
3. the stable identifiers and versions it references;
4. whether it is strategy, evidence, approval, execution, or delivery;
5. what it explicitly does not own;
6. compatibility behavior for old snapshots.

Code review should reject any caption feature that creates a second transcript, second final timing map, second picture-lock gate, second approval/credit path, second cross-system renderer, or unmanifested asset store.
