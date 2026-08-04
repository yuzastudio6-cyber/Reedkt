# CAP-12 — StoryTiming, Motion, Camera, and Handoffs Report

Status: `contract_complete_authenticated_timing_and_receiver_runtime_gated`
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

The new public contracts are:

- `caption-storytiming-registration-v1`;
- `caption-storytiming-resolution-v1`;
- `caption-motion-plan-v1`;
- `caption-effective-read-report-v1`;
- `caption-cross-system-handoff-v1`;
- `caption-camera-request-v1`;
- `caption-motion-lock-v2`.

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

`smoke:captions-specialist-cap-12` passes 41 CAP-12 assertions after consuming
the exported CAP-11 graph fixture. It covers twelve node registrations and
resolutions, semantic event coverage, authorized-range enforcement, stable-read
math, twelve typed primitives and reduced-motion counterparts, all three
handoff kinds, neutral mediation, camera-owner retention, fixture-only motion
lock state, both exact Living Frame receiver identities, valid V1 and V2
two-selected-scene responses, the V1/V2 compatibility binding, Caption
ordering/restoration, declined and stale-authority zero-scene responses without
optional V1 component refs, and closed authorities.

Adversarial checks reject out-of-scope StoryTiming frames, inadequate effective
read time despite a long cue, silently substituted output aspect ratio,
stale V1 digests, V2 frame substitution, stale compatibility receipts,
collapsed multi-scene lineage, mismatched or stale Living Frame results,
lowered stable-read requirements,
swapped handoff lineage, receiver/kind mismatch, missing transfer morph, direct
peer dispatch, camera authority overclaim, and inherited public-contract data.

The focused CAP-11/CAP-12 smokes, server typecheck, focused/full lint, and secret
scan must pass before publication. No media is generated at this milestone, so
direct raster inspection is not applicable. Authenticated StoryTiming reread,
receiver runtime/result evidence, Remotion rendering, and independent final QA
remain later private gates.

## Next milestone

CAP-13 adds the bounded `CaptionSoundCueRequest`, eligibility and density
budgets, future neutral Sound support, injected approved fixtures,
dialogue-protected final-mix dependency, and deterministic silent fallback.
