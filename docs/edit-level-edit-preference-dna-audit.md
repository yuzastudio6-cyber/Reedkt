# Edit Level Edit Preference DNA Audit

## Current Surfaces

Dedicated Edit Preference / Preference DNA docs and types requested in the prompt were not present in this checkout. Related surfaces that do exist:

- `src/types/media.ts` has `ReferenceDNARecord`.
- `src/types/audio-music.ts` has reference music/audio DNA and user sound preference records.
- `src/components/editor/InlineReferenceDNACard.tsx` shows reference DNA controls in the chat flow.
- `src/lib/intent-compiler.ts` notes that Reference DNA may influence style but must not be copied shot-for-shot.
- `src/lib/professional-editing-ontology.ts` maps user preference language to professional presets.

## Future Level Behavior

| Future level | Preference DNA usage |
| --- | --- |
| Normal | Use safe style hints. Do not overfit. Keep clean professional defaults. |
| Premium | Apply DNA more deeply to pacing, caption style, color, sound, b-roll, and visual restraint. |
| Ultra Premium | Apply DNA deeply across story structure, visual systems, audio mood, graphics, character consistency, and QA checks. |

## Gaps

- No dedicated `EditPreference` or `PreferenceDNA` source of truth was found.
- No level-aware DNA resolver exists.
- No degraded capability notice exists when DNA is unavailable.

## Recommendation

Future work should define `EditLevelProfile.preferenceDnaPolicy` or fold it into `analysisDepth` plus `degradedCapabilityNotice`. RP-EDITLEVEL-00 only documents the desired interaction.
