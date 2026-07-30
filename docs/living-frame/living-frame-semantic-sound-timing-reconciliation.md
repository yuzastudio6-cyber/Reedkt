# Living Frame Semantic Sound Timing Reconciliation

Status date: 2026-07-29

Contract:
`living-frame-semantic-sound-timing-reconciliation-v1`

State:
`phase_compatible_cues_observed_order_spacing_conflicts_fail_closed_canonical_integration_pending`

## Purpose

Living Frame choreography v2 binds every requested sound to exactly one
semantic attention event and, for motion-dependent component sounds, to motion
from that exact component. The existing canonical timing v1 compiler assigns
an exact cue range, but it distributes requests by order across the visual
window.

An exact frame range is not automatically a meaning-bound frame range.

This reconciliation independently rereads and verifies:

- the complete Living Frame choreography binding;
- the current selected-scene publication;
- the current canonical execution requirements;
- the current MasterTiming/SoundSync-derived timing binding; and
- the confirmed output-frame lineage.

It then compares every canonical cue with the semantic phase required by its
approved attention trigger. It does not create a second clock and does not
change the cue.

## Attention-to-phase policy

The read-only comparison uses the existing Living Frame lifecycle:

| Attention event | Required canonical semantic phase |
| --- | --- |
| `prepare` | `prepare` |
| `handoff` | `activate` |
| `hold` | `demonstrate` |
| `restore` | `resolve` |
| `transition_away` | `resolve` |

This mapping only verifies phase compatibility. It does not invent an exact
attention frame, motion hit, audio transient, trim window, or mix envelope.

## Current evidence

The controlled smoke demonstrates both outcomes against real canonical v1
recompilation:

- a one-cue geographic handoff lands inside the canonical `activate` phase and
  is recorded as a phase-compatible candidate; and
- a one-cue illustrated strike is semantically bound to a `hold` event, which
  requires the `demonstrate` phase, but canonical order spacing places it
  inside `activate`; the reconciliation records and blocks that divergence.

The second case is the important proof. Current v1 timing can be
frame-accurate while still being semantically wrong.

## Why phase compatibility is not final sound readiness

Even a phase-compatible v1 cue does not carry:

- the semantic attention-event ID;
- the component-motion track IDs;
- an exact attention-event frame range;
- an exact SFX hit/transient frame;
- the start/hit/end envelope;
- generated or library sound provenance;
- gain, pan, attack, release, stereo, room, or reverb decisions;
- narration-aware ducking automation;
- timing/mix QA; or
- private-review evidence.

Therefore every unit keeps
`downstreamProfessionalSoundAdmissionBlocked = true`, and the overall
reconciliation keeps
`professionalSemanticSoundTimingReady = false`.

## Canonical integration requirement

The canonical timing/SoundSync owner should publish a future binding that
consumes, rather than discards:

- `semanticTriggerAttentionEventId`;
- `semanticTriggerEventType`;
- `semanticTriggerMotionTrackIds`; and
- the exact approved attention/motion timing evidence.

That owner must then provide the exact hit and cue envelope while preserving
speech priority. Living Frame remains the semantic requester. MasterTiming
remains the sole clock. SoundSync remains the sole audio timing, asset, mix,
ducking, and sound-QA owner.

## Authority boundary

This candidate grants no authority for:

- Living Frame selection or choreography changes;
- attention, MasterTiming, or SoundSync timing changes;
- sound selection or generation;
- provider or tool routing;
- prompt construction;
- work-graph or asset-manifest mutation;
- approval or approved-snapshot mutation;
- queue, dispatch, or runtime execution;
- artifact persistence;
- QA or private-review approval;
- rendering;
- estimates, actual cost, billing, or credits; or
- production release.

It contains no raw chat, transcript, caption text, audio, media bytes, paths,
URLs, credentials, provider prompts, commands, environment, or
subject-specific routing.

## Evidence and adversarial coverage

The smoke covers:

- exact revalidation of the canonical execution requirements and timing
  binding;
- exact request/cue metadata equality;
- one phase-compatible handoff candidate;
- one real order-spacing phase divergence;
- immutable digest evidence;
- rejection of forged choreography metadata;
- rejection of forged canonical cue frames;
- rejection of cross-scene lineage;
- rejection of timing/SoundSync authority promotion;
- rejection of false professional-readiness claims; and
- rejection of caller-selected hit frames.

The reconciliation is a source-contract and shared-interface proof. It is not
production sound execution.
