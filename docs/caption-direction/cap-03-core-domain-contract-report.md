# CAP-03 — Core Domain Contract Report

Status: `complete`
Milestone: `CAP-03`
Media produced: none
Registry mutated: no

## Outcome

CAP-03 publishes the complete first-generation Caption domain envelope and 14
strict payload kinds:

1. strategy plan;
2. opportunity map;
3. integration classification;
4. reservation plan;
5. approval envelope;
6. style profile;
7. lifecycle;
8. dependency manifest;
9. finish readiness;
10. scene graph;
11. motion lock;
12. render spec;
13. Caption QA report; and
14. repair plan.

The common envelope binds exact owner/workspace/project/edit session/plan/output
and optional scene scope, approved snapshot, confirmed output frame, canonical
transcript, MasterTiming, StoryTiming, Caption approval envelope, the CAP-02
`caption_design` composite, and a complete staleness tuple.

## Authority separation

The contracts describe Caption decisions and evidence. They do not grant
canonical approval, mutate a snapshot or timeline, create work or assets,
dispatch providers or runtimes, authorize cost or billing, approve final QA,
own the final canvas, deliver publicly, or promote production.

Caption reservations are intent only. StoryTiming remains sole executable frame
authority. Remotion remains final canvas owner. Caption QA is a scoped
recommendation and independent final QA remains required.

## Contract rules

- Strategy records project mode, density, language, integration classes,
  accessibility, likely hero/mask/handoff needs, and estimate factors.
- Opportunities and classification preserve scene/frame/phrase lineage.
- Reservations use bounded normalized regions and cannot exceed the confirmed
  frame.
- Approval envelopes freeze allowed modes, roles, motion, hero count,
  overlap/anchor/handoff/sound/text-transformation/language/accessibility/credit
  and fallback constraints while canonical approval remains external.
- Style profiles type typography, color, legibility, allowlisted motion,
  reduced-motion replacements, placement, protected roles, and depth planes.
- Lifecycle and dependencies isolate stale or missing evidence to affected
  scenes so unrelated work may continue.
- Final readiness cannot be true without picture lock, approved snapshot,
  StoryTiming, Caption approval lineage, and no blocked gate/scene.
- Scene graph nodes carry phrase, track, typography, timing, depth, mask/track,
  anchor, motion, accessibility, and fallback lineage; dangling nodes or edges
  are refused.
- Motion lock contains semantic requests only and explicitly refuses
  Caption-authored executable frames or model-authored code.
- Render specs allow Remotion/libass/SRT/WebVTT plans but reject executable
  code, arbitrary ASS tags, arbitrary FFmpeg arguments, wrong confirmed-frame
  lineage, and any final-canvas ownership change.
- QA acceptance is inconsistent with failed or missing-evidence checks.
- Repairs are the smallest affected scope, declare fallbacks/reinspection, and
  prohibit hidden quality downgrade.

## Safety and validation

Every envelope and nested payload is closed serialized data with exact versions
and SHA-256 digest. Validation rejects inherited/accessor/cyclic/sparse or
oversized structures through the shared CAP-01 guard; unknown fields; unsafe
URL/path/credential-shaped text; duplicate staleness refs; omitted source
bindings; stale composite lineage; wrong kind/version; tampering; truthy
authority; overlapping frame ranges; over-frame reservations; ready dependency
without artifact; overclaimed finish readiness; dangling scene graph; and
executable render payloads.

`npm run smoke:captions-specialist-cap-03` passes all 14 positive contract
fixtures plus 13 adversarial cases, reported as 19 grouped assertions. Full
server typecheck and focused ESLint pass. No media/provider/container/model
runtime, registry mutation, package-lock change, billing, public delivery, or
production action occurred.

## Next

CAP-04 implements the canonical immutable transcript, exact source-word and
phrase lineage, transformation/timing provenance, claim-sensitive review,
WhisperX/pyannote qualification boundaries, and word-motion gates.
