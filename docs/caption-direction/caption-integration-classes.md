# Caption Integration Classes

Every opportunity has exactly one primary integration class plus optional secondary handoffs.

## `late_overlay`

For clean subtitles, accessibility captions, stable phrase captions, restrained keyword emphasis, and attribution labels. These can usually be finalized after picture lock without changing shot structure.

Required data:

- safe-region candidates;
- semantic phrases and accessible projection;
- StoryTiming frames;
- style/legibility profile;
- stable render route.

## `reserved_composition`

For text beside/around/behind a speaker, object-anchored text, shared B-roll frames, and multiple simultaneous tracks. Approximate space is reserved early; final placement, depth, and motion resolve late.

Required data:

- reservation regions and priority;
- collision/occlusion intent;
- mask/anchor readiness;
- final-frame occupancy;
- fallback layout if evidence fails.

## `structural_typography`

For full-screen type, hero words, persistent lists, spatial sentence construction, typography-driven camera movement, or typography that changes shot duration. These choices must be visible in plan/estimate approval because they affect the edit structure.

Required data:

- structural duration/shot requirement;
- main-edit operation or hold;
- story/semantic purpose;
- reservation and visual-system dependencies;
- user-visible approval envelope.

## `cross_system_transform`

For a caption phrase that becomes or hands off to a map, diagram, brush stroke, route, transition, B-roll idea, or Living Frame element. Caption Direction owns the source phrase, transformation semantics, continuity token, and handoff timing request. The receiving system owns its asset, execution, and QA.

Required data:

- source phrase/token lineage;
- target system and typed intent;
- semantic continuity contract;
- StoryTiming handoff anchors;
- accessible text continuity;
- failure/reversion behavior.

## Classification validation

- `late_overlay` must not secretly change shot structure.
- `reserved_composition` cannot reach finish readiness without reservation disposition.
- `structural_typography` must be approved and estimated before generation.
- `cross_system_transform` cannot make Caption Direction the owner of the receiving renderer.
- A scene may contain opportunities in several classes, but each opportunity remains independently traceable.
