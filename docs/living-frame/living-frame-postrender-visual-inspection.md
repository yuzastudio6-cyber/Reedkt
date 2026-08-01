# Living Frame Postrender AI Visual Inspection

## Decision

Professional visual QA must be based on an AI inspecting the actual rendered
artifact. A successful process, valid digest, expected pixel count, FFprobe
pass, or caller-supplied `actualRenderedClipInspected: true` value is not visual
acceptance.

The additive source contract is:

- `living-frame-postrender-visual-inspection-request-v1`;
- `living-frame-postrender-visual-inspection-result-v1`; and
- `living-frame-postrender-visual-inspection-checklist-v1`.

It wraps the existing `postrender_private_visual_qa` authority in
`private-gcp-qwen25vl-visual-understanding-v1`. It does not replace or modify
that generic contract. Canonical integration must continue through
`PrivateGcpVisualEvidencePackage` and
`verifyPrivateGcpVisualEvidencePackage`, or an explicitly versioned successor
of that same general owner surface. The current v1 evidence package records
`providerCallMade: false`, so it cannot by itself prove that Qwen inspected the
render.

## Intelligence Responsibilities

Qwen2.5-VL remains the visual specialist:

- model role `qwen2_5_vl_visual_understanding`;
- model `qwen2.5-vl-7b-instruct`; and
- provider boundary `qwen2_5_vl_7b_instruct_provider_boundary`.

Qwen returns grounded visual evidence only. It cannot approve the edit, choose
creative direction, or claim audio/transcript understanding.

Head QA uses `kimi_k3_main_edit_agent` first. The
`gpt_5_6_terra_fallback_edit_agent` route is allowed only after a classified
Kimi failure and must consume the same immutable evidence package. It emits
only `accept`, `repair`, or `reject` as a recommendation. Canonical QA, owner
approval, and private review remain separate authorities.

## Exact Request Binding

The request binds:

- tenant, project, edit session, execution package, work item, and idempotency;
- immutable approved snapshot and selected scene;
- MasterTiming, confirmed frame, renderer, layers, occupancy, Caption
  Direction, and SoundSync digests;
- exact private Remotion MP4 identity, SHA-256, byte length, dimensions, frame
  rate, frame count, and object identity;
- passed deterministic final FFprobe QA;
- exact existing Qwen postrender plan, checkpoint, and image identity;
- a gapless, non-overlapping complete-timeline coverage manifest;
- five ordered entry, peak, hold, settle, and exit samples;
- scene, transition, and boundary windows; and
- the 13 ordered non-character professional visual checks.

Five samples are required landmarks, not a substitute for complete-time
coverage. Dense complete-timeline windows may outnumber those landmarks and
therefore carry coverage evidence without pretending each window contains one
of the five semantic samples. The current edit/reference provider adapter
accepts at most eight JPEG frames and does not satisfy this contract.

## Exact Result Checklist

The result must carry exact request, plan, artifact, snapshot, scene, window,
sample, and time-range lineage. Every check requires a disposition, grounded
observation, confidence, uncertainty, evidence sample IDs, and frame range.
It must also include visual risks, repair targets, zero unsupported claims, and
checkpoint/image/runtime/dispatch/lease/attempt/cost provenance.

The source verifier validates the structural envelope and marks the provider
execution fields as claims. It deliberately does not promote those claims to
canonical evidence. The canonical backend must reread its own queue, one-use
lease, attempt, cost, create-only artifact, QA, and reconciliation records.

If sound is present, separately verified decoded-audio, speech, SFX, music,
ducking, and SoundSync evidence is required. Qwen cannot satisfy that lane.

## Repair Cycle

A failed render remains immutable. Repair creates artifact version `N+1` and
reruns:

1. deterministic final QA;
2. Qwen visual inspection;
3. Kimi/Terra head-QA recommendation;
4. artifact QA and reconciliation; and
5. complete private review.

Metrics may block a render, but they can never override a visual rejection.

## Current Gate

This milestone is source-only. It creates no provider call, work item,
dispatch, lease, runtime, artifact, QA approval, cost, billing, public delivery,
or production authority. Character animation and mechanical rigging remain
paused. Static illustrations may remain only when unanimated.
