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

## Hero typography

A hero phrase may temporarily become the primary visual through an approved
display role, semantic scale, depth, camera/focus handoff, restrained sound, or
full-screen composition. Hero moments are rare, earned, counted in the approval
envelope, and never used merely to make ordinary speech louder.

## Persistent topic and list tracks

Steps, principles, causes, names, or repeated concepts may accumulate across
phrases. Items retain hierarchy, preserve earlier entries, avoid protected
visuals, meet stable read time, define their clear condition, and coordinate
with scene transitions. They are not one-at-a-time subtitle cues.

## Controlled mode switching

One project language may intentionally move between clean verbatim captions,
spatial sentence composition, hero typography, minimal emotional passages,
persistent lists, and Caption-to-Visual handoffs. Changes occur at scene
boundaries, story beats, typographic transitions, or visual handoffs—not
randomly phrase by phrase.
