# CAP-11 — Multi-Track Scene Graph Report

Status: `contract_complete_external_depth_broll_storytiming_gated`
Milestone: `CAP-11`
Media/runtime started: no
Actual Track All/B-roll/Remotion evidence claimed: no
Runtime, asset, QA, delivery, or production authority promoted: no

## Outcome

CAP-11 adds `caption-multi-track-scene-graph-v1` without changing the legacy
`caption-scene-graph-v1` decoder. A scene can now describe simultaneous
accessible, semantic, hero, and persistent-list tracks; exact active nodes per
semantic mode; explicit depth and region choices; full-screen typography;
subject-occlusion, object/environmental-anchor, and B-roll intentions; and
complete accessibility counterparts.

The graph consumes exact CAP-10 semantic style, CAP-04 phrase lineage, CAP-03
style and approval envelopes, CAP-08 occupancy/hierarchy, picture-lock, and
finish-readiness references. Track All admissions remain optional injected
owner evidence. StoryTiming requirements remain references only; CAP-11 does
not create executable frames.

## Accessibility and concurrency

Every creative node must point to an active accessible node with the same
phrase and exact ordered source-word IDs. Accessible nodes always resolve to
`safe_accessible`, carry complete wording, contain no mask/anchor authority,
and remain above every visual layer.

Mode phases identify both exact active tracks and exact active nodes. The
validator enforces the platform concurrency limit, requires an accessible node
for every creative node, and rejects same-region collisions. The contract
fixture proves six deliberate phases across clean, hero, persistent-list, and
spatial modes, including small stable wording alongside hero typography.

## Depth, anchors, lists, and B-roll

The graph supports all logical depth planes while prohibiting Caption nodes on
the canonical subject plane. Subject occlusion requires an admitted Track All
mask. Object-attached and environmental typography require an admitted anchor.
Critical tokens can never be intentionally hidden, and the accessible
counterpart remains visible throughout.

When those owner artifacts are not qualified, the compiler applies declared
fallbacks to a separate safe creative region rather than colliding with the
accessible region. Object/environmental treatments move speaker-adjacent;
behind-subject type moves to a safe top plane.

Persistent lists accumulate stable entries until an explicit clear condition;
they are not one-at-a-time subtitle cues. Hero moments are counted by nodes,
not merely by track, and cannot exceed the exact approval-envelope limit.

`caption-broll-owner-read-binding-v1` is a Caption read adapter, not a selector.
It distinguishes not-applicable, planning-only, and authenticated-owner-ready
states. Caption cannot manufacture the ready state. Without an authenticated
canonical owner result, B-roll co-composition remains a planning constraint and
falls back to Caption-only composition. The backend B-roll owner read/result
remains a separate one-writer integration gate.

## Verification

`smoke:captions-specialist-cap-11` passes 32 positive and adversarial checks.
It covers four purposeful tracks, twelve nodes, six mode phases, accessibility
counterparts, separate safe concurrent regions, hero limits, full-screen type,
persistent-list semantics, Track All/anchor/B-roll fallbacks, canonical owner
retention, StoryTiming gating, old v1 compatibility, B-roll overclaim refusal,
subject-plane/unknown-region refusal, missing accessibility, cycles, list
ordering, duplicate nodes, invalid mode tracks, same-region collision, and
truthy authority refusal.

The focused smoke, server typecheck, and focused ESLint pass. No media was
generated, so direct visual inspection is not applicable to this checkpoint.
Actual text-behind/object/environmental/B-roll composition, complete-time
visual inspection, StoryTiming resolution, and Remotion rendering remain later
private qualification gates.

## Next milestone

CAP-12 registers StoryTiming requirements, typed motion primitives, effective
stable-read validation, Caption-to-Visual/Living-Frame/Transition handoffs,
camera requests, and reduced-motion alternatives without creating a parallel
clock or executing receiver work.
