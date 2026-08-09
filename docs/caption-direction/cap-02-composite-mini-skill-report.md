# CAP-02 — Internal Composite and Mini-Skill Report

Status: `complete`
Milestone: `CAP-02`
Media produced: none
Registry mutated: no; CAP-03 owns registry integration

## Outcome

CAP-02 implements `caption_design` as the Caption specialist's internal
composite Creative Skill. It publishes 55 reusable mini skills across the eight
required groups:

- strategy and restraint;
- language and meaning;
- visual design;
- spatial composition;
- motion and transformation;
- sound;
- accessibility and language; and
- finish and QA.

The mini skills are not top-level specialists. They own no numeric settings,
cannot dispatch peers, and are activated only when a bounded scene needs them.

## Relationships and restraint

Every mini skill has exactly one versioned `composed_of` relationship from
`caption_design` and one inverse `component_of` relationship. Composition
edges are normalized before cycle detection so the required inverse records do
not create false cycles.

`caption_direction` remains a compatibility alias for `caption_design`.
`no_captions` is a separate explicit restraint with a symmetric conflict
against the composite. A scene cannot request both. A no-caption scene
activates only `caption_restraint` and does not silently add typography.

## Legacy compatibility

All nine committed `captions.*` professional-skill definitions plus the
historical `caption_direction` alias have exact mappings. Mappings preserve
readability for older plans while declaring `independentPrimaryOwner: false`.
The legacy no-caption definition maps only to the explicit restraint.

No compatibility definition was deleted or silently changed. CAP-03 will mount
the canonical composite/selection trace into the registry after the public
domain contracts exist.

## Scene-aware activation

The selector always installs a small professional baseline for a Caption scene,
then adds only the components required by integration class and scene evidence.
It supports clean phrase, active word, semantic kinetic, spatial composition,
subject occlusion, object anchoring, environmental typography, persistent
topics, hero typography, and Caption-to-Visual coordination. Feature gates add
multi-speaker, B-roll, camera, sound, multilingual, reduced-motion,
claim/quotation safety, and revision-analysis components.

Clean captions do not activate unused mask/depth work. When sound choreography
is not requested, the selector installs sound restraint rather than decorative
sound behavior.

## Validation and evidence

The composite and activation contracts are byte-free closed data with exact
digests. Validation rejects unknown nested fields, duplicate identities,
unknown nodes or mapped components, missing inverse relationships, cycles,
asymmetric restraint conflicts, invalid restraint mapping, digest tampering,
inherited objects, duplicate scene signals, unknown legacy IDs, conflicting
Caption/no-caption requests, incomplete activation partitions, and overlapping
active/skipped component sets.

`npm run smoke:captions-specialist-cap-02` passes 37 assertions. Full server
typecheck and focused ESLint pass. No media/provider/container/model runtime,
registry mutation, direct peer dispatch, billing/public/production action, or
package-lock change occurred.

## Next

CAP-03 implements the versioned Caption strategy, opportunity, reservation,
approval, style, lifecycle, dependency, finish-readiness, scene-graph,
motion-lock, render, QA, and repair domain contracts, then mounts the canonical
Caption definition and composition trace into the professional-skill registry.
