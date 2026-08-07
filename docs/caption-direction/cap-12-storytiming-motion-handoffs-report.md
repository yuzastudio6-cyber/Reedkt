# CAP-12 — StoryTiming, Motion, Camera, and Handoffs Report

Status: `caption_owned_full_handoff_surface_complete_shared_target_registry_partial`
Milestone: `CAP-12`
Media/runtime started: no
Receiver execution or final-frame authority claimed: no
Runtime, asset, QA, delivery, billing, or production authority promoted: no

## Outcome

CAP-12 adds a strict StoryTiming registration and resolution seam, typed Caption
motion, effective stable-read validation, reduced-motion substitutions, camera
intent, and mediated Visual Intelligence, Living Frame, and Transition
handoffs. Caption submits semantic timing requirements; StoryTiming returns the
only executable frame ranges and event references. Caption never creates a
parallel clock.

The additive full-target correction also covers every cross-system direction
required by the Caption specialist goal: Graphic, Map, Chart, Diagram, B-roll
constraints, and Stroke Motion, plus incoming typography requests from Living
Frame and Transition. It does not alter or relabel the frozen V1 motion plan or
either Living Frame wire contract.

The new public contracts are:

- `caption-storytiming-registration-v1`;
- `caption-storytiming-resolution-v1`;
- `caption-motion-plan-v1`;
- `caption-effective-read-report-v1`;
- `caption-cross-system-handoff-v1`;
- `caption-camera-request-v1`;
- `caption-motion-lock-v2`.

The additive compatibility lane introduces:

- `caption-cross-system-outbound-payload-v2`;
- `caption-cross-system-handoff-v2`;
- `caption-incoming-typography-request-v1`;
- `caption-cross-system-coordination-plan-v1`.

The additive `captions.specialist.integration.manifest.v3` now exposes these
Caption-owned coordination outputs and the exact mediated incoming-support
input through the future-HQ capability surface. Its hash is
`670160edb63d4abebe8b33096a5ea70089000e6f46f8b079f5c3a046940ae0a9`;
the bound planning-only qualification digest is
`927769c6ee37009e5538752a23715be8e0f33f0c70b52e8c52b59ec5a33b3b81`.
Earlier manifest identities and hashes remain frozen.

The existing generic `caption-motion-lock-v1` remains readable. V2 adds exact
scene-graph, StoryTiming-resolution, stable-read, renderer, and future Sound
lineage without mutating V1.

## StoryTiming and stable reading

Every CAP-11 node and mode phase is registered by exact timing-requirement
reference. A resolved result must cover every registered node and phase, bind
the same confirmed output frame and MasterTiming, stay inside the authorized
frame ranges, and carry the required semantic events. Contract fixtures can
prove structure but cannot open runtime; private readiness requires an
authenticated canonical reread and exact MasterTiming digest match.

Effective reading time uses the resolved cue and stable range, then subtracts
the union of unstable entry, unstable exit, and additional unreadable frames.
A long nominal cue fails if too much of it is moving, occluded, blurred, or
otherwise unreadable. Speech clarity and accessible stability outrank
decorative motion.

Nodes participating in a cross-system handoff register exact `handoff` and
`restore` semantic events in addition to their entry, hold, and exit events.
The V2 outbound payload binds its source node and phrase to those exact
StoryTiming event references and refuses fabricated or out-of-order handoff,
hold, or restoration timing.

## Motion and reduced motion

Motion is allowlisted data, never model-authored code. CAP-12 represents reveal,
fade, scale, slide, wipe, tracked movement, depth transition, emphasis pulse,
brush reveal, list append, hero expansion, handoff morph, stable hold, and cut.
Each node receives one exact StoryTiming-bound primitive with restrained numeric
parameters, interruption behavior, semantic justification, and a deterministic
`fade`, `stable_hold`, or `cut` reduced-motion replacement. The replacement must
preserve meaning, order, and stable-read requirements.

## Cross-system ownership

All receiver work is carried through the neutral `SkillSupportRequest` family:
HQ mediation remains true and direct peer dispatch remains false.

- Visual Intelligence receives semantic evidence requests and retains visual
  analysis ownership.
- Transition receives stable-read and semantic-boundary requests and retains
  transition selection/execution ownership.
- Camera/layout receives bounded behavior intent; Caption cannot move the
  camera or timeline.
- Living Frame receives the exact frozen Caption-owned CAP-11 payload and may
  return multiple selected scenes for one request/handoff. Caption does not
  invent one request per selected scene.

The additive V2 coordination plan represents eight exact outbound receiver
families:

- Living Frame through the existing frozen CAP-11 payload and V1 support
  envelope;
- Transition through the current neutral support target and an explicit
  reference to its frozen V1 support handoff;
- B-roll constraints through the current `broll_owner` support target without
  taking B-roll selection, crop, timing, or media authority;
- Graphic through `graphics.visual_explain_layer`;
- Map through `graphics.map_route_visual` with exact-geography source truth;
- Chart through `graphics.chart_or_data_visual` with exact-data source truth;
- Diagram through `dataviz.diagram_layout` with exact-data source truth;
- Motion support through `motion.stroke_motion_storytelling`.

The current neutral V1 support-target registry can name Living Frame,
Transition, and B-roll. It cannot yet name Graphic, Map, Chart, Diagram, or
Stroke Motion. Those five handoffs therefore carry complete typed payloads but
remain `pending_future_orchestra_target`, return `needs_followup` to HQ, and
contain no invented `canonical_layout_owner` alias or peer dispatcher. This is
an explicit future-Orchestra shared-interface gap, not missing Caption-owned
semantic, timing, accessibility, fallback, evidence, or ownership data.

Incoming Living Frame and Transition typography requests use the additive
neutral `SkillSupportRequestV2` target `captions`. They bind the requester call,
canonical scope, exact source phrase and word lineage, confirmed frame,
MasterTiming/StoryTiming, requested Caption job and artifact, accessibility,
and return-to-HQ behavior. Living Frame and Transition keep their own domain
execution; Caption keeps typography-specification ownership.

The closed parser rereads the exact Caption Scene Graph before accepting either
direction. It proves that source word IDs match the source node in order, the
canonical accessible counterpart belongs to the same phrase and word lineage,
the motion plan references that graph, and incoming requests carry actual
StoryTiming `handoff` and `restore` events. A recomputed payload digest cannot
turn unrelated words, a creative node, or arbitrary timing events into valid
handoff lineage.

The frozen public Living Frame V1 surface is present byte-for-byte in this clean
branch as `caption-direction-living-frame-request-v1`,
`living-frame-caption-direction-response-v1`, and
`caption-direction-living-frame-adapter-v1`. The domain-ref shape introduced by
CAP-12 is separately versioned as `caption-direction-living-frame-request-v2`,
`living-frame-caption-direction-response-v2`, and
`caption-direction-living-frame-adapter-v2`; it does not reuse or supersede the
V1 identity. Both lanes are byte-free, contain no raw chat/media
paths/credentials/executable prompt text, target
`motion.living_frame_storytelling`, keep Caption above Living Frame, preserve
accessible wording and restoration, and leave every operation, dispatch,
runtime, asset, estimate/billing, QA approval, public delivery, and production
authority false. No `server/living-frame/*` module is imported.

The explicit
`caption-direction-living-frame-v1-v2-compatibility-binding-v1` adapter accepts
both complete independently validated payloads and binds only their shared
canonical identity, transcript, semantic, confirmed-frame, reservation,
StoryTiming/MasterTiming, layout, selected-scene, fallback, QA, and staleness
lineage. It never casts one wire schema into the other, and it refuses to invent
fields that exist in only one version. The neutral support envelope accepts the
exact V1 digest using its defined `sha256:` wire representation and the V2
digest using the newer plain digest representation.

Illustrated-character animation and mechanical rigging remain paused. The
fixture exercises only a non-character diagram/archive response.

## Verification

`smoke:captions-specialist-cap-12` passes 76 CAP-12 assertions after consuming
the exported CAP-11 graph fixture. It covers twelve node registrations and
resolutions, semantic event coverage, authorized-range enforcement, stable-read
math, twelve typed primitives and reduced-motion counterparts, all three
handoff kinds, neutral mediation, camera-owner retention, fixture-only motion
lock state, both exact Living Frame receiver identities, valid V1 and V2
two-selected-scene responses, the V1/V2 compatibility binding, Caption
ordering/restoration, declined and stale-authority zero-scene responses without
optional V1 component refs, and closed authorities.

The additive assertions cover all eight outbound receiver families, three
currently admitted support envelopes, five explicitly pending future target
registrations, two mediated incoming typography requests, exact source-truth
policies for Map/Chart/Diagram/B-roll, frozen Living Frame handoff lineage, and
complete return-to-HQ semantics.
The standalone Caption runtime also accepts the exact incoming Living Frame
typography request, emits the requested Caption artifact, and binds that result
back to the originating mediated support-request digest. It refuses that same
request when the exact Scene Graph and StoryTiming resolution are not supplied
for reread.

Adversarial checks reject out-of-scope StoryTiming frames, inadequate effective
read time despite a long cue, silently substituted output aspect ratio,
stale V1 digests, V2 frame substitution, stale compatibility receipts,
collapsed multi-scene lineage, mismatched or stale Living Frame results,
declined/blocked ownership overclaims, lowered stable-read requirements,
swapped handoff lineage, receiver/kind mismatch, missing transfer morph, direct
peer dispatch, camera authority overclaim, and inherited public-contract data.
Additional digest-valid adversarial cases reject receiver-skill substitution,
fake geography truth, B-roll information-owner takeover, relabeling Map as the
canonical layout owner, crossed incoming typography payloads, requester
takeover, substituted source words, substituted accessibility nodes, missing
handoff events, incomplete receiver/requester surfaces, duplicate coordination
refs, missing Transition V1 compatibility lineage, credential-shaped text, and
runtime-authority promotion.

The focused CAP-11/CAP-12 smokes, server typecheck, focused/full lint, and secret
scan must pass before publication. No media is generated at this milestone, so
direct raster inspection is not applicable. Authenticated StoryTiming reread,
receiver runtime/result evidence, Remotion rendering, and independent final QA
remain later private gates.

## Milestone evidence record

Milestone: `CAP-12 additive full-target correction`

Status: `source_contract_and_closed_validation_passed`

Outcome: Caption now owns a complete typed outbound handoff surface for all
required receiver families and a closed incoming typography boundary for
Living Frame and Transition.

Files changed:

- `src/types/caption-cross-system-coordination.ts`;
- `server/captions-specialist/caption-cross-system-coordination.ts`;
- `server/captions-specialist/caption-storytiming-motion.ts`;
- `server/captions-specialist/captions-specialist-runtime.ts`;
- `server/smoke/captions-specialist-cap-12-smoke.ts`;
- this report;
- `post-cap20-goal-completion-audit.md`.

Contracts added/changed: four additive identities listed above; the frozen
`caption-cross-system-handoff-v1`, motion-plan V1, Living Frame V1/V2, and
Transition compatibility lane remain readable and unchanged.

Existing owners reused: StoryTiming, MasterTiming, Living Frame CAP-11,
Transition, B-roll, Sound, Remotion, final QA, approval, and billing owners.

Duplicate owners avoided: no peer dispatcher, receiver executor, timeline,
camera, asset, QA-approval, cost, billing, delivery, or production owner was
created.

Tests run and passed: focused 76-assertion CAP-12 smoke; canonical Caption
specialist execution (49 checks); CAP-01–20 source aggregate (20/20
milestones); Caption source-integration aggregate (47 suites, 41/41 current
implementations); full server typecheck; targeted and full ESLint; production
build (2,969 modules); frontend/server boundary (1,146 files); current secret
scan (6,850 files); reachable-history secret scan (15,638 blobs); and Git diff
whitespace validation.

Tests failed: none in the final regression. An earlier pre-publication aggregate
correctly exposed a frozen V1 result-hash drift when the incoming-request digest
placeholder was added to every Caption result. The runtime was repaired so the
new digest input is present only for an actual V2 incoming typography request;
the original V1 execution receipt remains byte-identical.

Media inspected: not applicable; this correction emits byte-free contracts and
does not generate media.

Visible defects: not applicable to a byte-free contract milestone.

Repairs made: self-review found that the first parser revision trusted word and
accessibility-node IDs carried by a digest-valid payload. The final parser now
rereads the exact scene graph, verifies motion/StoryTiming graph lineage, binds
the exact source words and accessible counterpart, requires real handoff and
restore events, and refuses an incomplete aggregate coordination surface.

Known limitations: five future professional receiver identities are not yet in
the neutral shared support-target registry. Caption emits their exact typed
payloads and remains `needs_followup`; future Orchestra integration must admit
those targets once, centrally.

Scoped blockers: authenticated StoryTiming reread, actual receiver result
execution, complete-time qualified visual review, and independent final QA are
later private evidence gates. They are not claimed by this byte-free contract
milestone.

Safe work completed: every Caption-owned cross-system contract, parser,
standalone runtime admission, compatibility binding, adversarial fixture,
documentation update, and source regression available without implementing the
central Orchestra or executing an external receiver.

## Next milestone

CAP-13 adds the bounded `CaptionSoundCueRequest`, eligibility and density
budgets, future neutral Sound support, injected approved fixtures,
dialogue-protected final-mix dependency, and deterministic silent fallback.
