# Canonical Post-render Qwen Visual-QA Shared Lifecycle Contract

Status: `work_request_and_public_result_shapes_frozen_execution_lifecycle_pending`

This source-only boundary freezes one frontend-safe shared result shape for
`qwen2_5_vl_visual_understanding` / `postrender_private_visual_qa` /
`postrender-private-visual-qa-v1`. Caption, Living Frame, and the main edit QA
pipeline may consume the same canonical lifecycle result instead of creating
feature-specific provider dispatchers.

The preceding `canonical-postrender-visual-qa-work-request-v1` admission shape
binds the exact private render, deterministic QA, approved snapshot/work,
reservation and estimate, persisted RGB24 sample collection, server-owned
inspection profile, and replay policy. It deliberately grants no dispatch.
Its coverage record distinguishes `complete` from `bounded_representative`,
counts sampled and unsampled canonical segments, and states that the model may
claim inspection only for the provided sample artifacts. Representative
sampling therefore cannot be promoted into a whole-video inspection claim.

The result binds the exact approved snapshot and work item, queue/lease,
provider grant/attempt/run, estimate and internal-cost lineage, persisted
runtime result, model qualification, sampled-frame collection and exact frame
digests, normalized response, execution attestation, and replay tuple. It
contains no model text, media bytes, paths, URLs, provider secret, executable
prompt, QA approval, repair, asset mutation, billing, delivery, or production
authority.

The schema and adversarial smoke are not execution evidence. A valid synthetic
fixture only proves the public record fails closed when its digest, scope,
attempt, frame lineage, replay tuple, chronology, or authority boundary is
changed. It does not prove that Qwen ran.

Before an authenticated route may return a completed result, the canonical
backend still must implement and verify the actual owner lifecycle:

1. approved snapshot/work/estimate/reservation reread;
2. one-use queue claim and worker lease;
3. shared Qwen provider or qualified private-GPU dispatch;
4. exact approved RGB frame-byte reread and request hashing;
5. one terminal attempt with usage and resource-cost evidence;
6. schema-constrained server normalization without raw model text;
7. create-only result persistence and exact reread;
8. independent artifact QA and manifest reconciliation;
9. authenticated, tenant-scoped pending/completed read projection; and
10. repair N+1 and private-review dependencies owned by the existing QA flow.

The older `private-gcp-qwen25vl-visual-understanding-v1` plan/evidence contract
cannot satisfy this lifecycle by itself because it deliberately records
`providerCallMade: false`. The existing canonical provider-dispatch V4 cannot
be relabeled either: it is bound to the separate Gemini visual-calibration MP4
operation. The execution owner therefore requires an additive versioned Qwen
post-render lifecycle, not reinterpretation of either record.
