# Multi-Track Caption System

## Track model

A scene may contain simultaneous tracks. Each track declares semantic role, source projection, priority, depth plane, timing requirements, renderer, accessibility behavior, and conflict policy.

Canonical track roles:

- `verbatim_accessible`
- `semantic_phrase`
- `active_word`
- `hero_typography`
- `topic_or_list`
- `quote`
- `attribution`
- `speaker_label`
- `caption_to_visual_handoff`
- `localized_accessible`

## Projection rules

- The verbatim accessible track preserves complete wording and speaker information where required.
- A semantic or hero track may condense only through recorded transformations linked to canonical word IDs.
- An active-word track may emphasize a subset but cannot replace the accessible projection.
- Quote and attribution tracks preserve claim/name confidence and review state.
- Localized tracks derive from the same source transcript and retain translation provenance.

## Concurrency

Track coexistence is explicit, not accidental. The scene graph defines:

- z/depth relationship;
- screen-region ownership;
- temporal overlap;
- semantic priority;
- whether a track persists while another changes;
- collision and occlusion rules;
- accessible fallback;
- reduced-motion substitution.

Example: a small accessible phrase can remain in a safe lower region while a hero word grows behind the speaker and a topic list persists beside them. All three have distinct purposes and render policies.

## Restraint

More tracks are not inherently better. The strategy planner should activate the fewest tracks that improve comprehension, story, accessibility, or creative intent. Density, cognitive load, television viewing distance, platform, language, and existing visuals constrain concurrency.
