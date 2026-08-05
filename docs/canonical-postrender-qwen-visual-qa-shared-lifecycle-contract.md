# Canonical Post-render Qwen Visual-QA Shared Lifecycle Contract

Status:
`authenticated_projection_and_caption_reconciliation_runner_source_complete_provider_lifecycle_pending`

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
For this V1 frame-sample lane, a completed `passed` decision is additionally
allowed only when exact full-motion samples cover every frame of the rendered
timeline. All-segment sampling by itself is insufficient. Because V1 caps the
sample set at 4,096 frames, longer edits remain blocked for a future versioned
full-review-video input rather than receiving an overstated complete-time pass.

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

The Caption integration now adds a separate
`canonical-postrender-visual-qa-normalized-result-v1` shared-owner record and
`canonical-caption-postrender-visual-qa-evidence-v1` record. The lifecycle
result proves that the model execution and its lineage occurred; the normalized
result owns the exact `passed`, `repair_required`,
`needs_human_review`, or `blocked_evidence_reconciliation` decision. This
separation prevents an executed model attempt from being treated as a passing
QA decision. Caption derives its evidence only from the digest-bound normalized
record. A caller cannot attach a different Caption decision to the same
lifecycle receipt.

The source-complete read side now includes the versioned
`canonical-caption-postrender-visual-qa-evidence-repository-v2` create-only
repository contract,
exact reread verification, an authenticated tenant/snapshot/output-frame
projection, and the mounted
`POST /v1/postrender-visual-qa/caption/authenticated-read` route. It returns
only `not_found`, `pending`, or a validated completed product state. It rejects
stale frames, cross-canvas evidence, browser-local completion, representative
coverage presented as complete-time coverage, and elevated authority claims.
The controlled repository used by the smoke is test-only and is not real model
or media evidence.

Repository V1 is retained only as a published identity receipt. V2 is required
because its completed envelope additionally binds the exact normalized-result
payload; V1 data is never silently interpreted as V2.

The canonical private job adapter now recognizes the planned Caption
post-render coordinator as one tool-free, provider-free reconciliation job. It
uses `canonical-caption-postrender-visual-qa-owner-result-read-port-v1` to
reread the shared owner's work request, lifecycle result, and normalized result;
then it persists and rereads the Caption projection through the existing
evidence repository. A missing owner port, missing result, stale output,
cross-canvas result, incomplete coverage, or mismatched normalized decision
fails closed before the Caption job consumes a lease. The adapter does not call
Qwen and cannot substitute a Caption-specific dispatcher.

Before the authenticated route may return a real completed result in an
internal edit, the canonical backend still must implement and verify the
remaining owner lifecycle:

1. approved snapshot/work/estimate/reservation reread;
2. one-use queue claim and worker lease;
3. shared Qwen provider or qualified private-GPU dispatch;
4. exact approved RGB frame-byte reread and request hashing;
5. one terminal attempt with usage and resource-cost evidence;
6. schema-constrained server normalization without raw model text;
7. qualification and injection of the durable shared-owner read port and
   create-only repository adapter used by the internal backend composition;
8. independent artifact QA and manifest reconciliation supplied to the now
   validated evidence record;
9. authenticated projection from those real persisted records through the now
   mounted read route; and
10. repair N+1 and private-review dependencies owned by the existing QA flow.

The older `private-gcp-qwen25vl-visual-understanding-v1` plan/evidence contract
cannot satisfy this lifecycle by itself because it deliberately records
`providerCallMade: false`. The existing canonical provider-dispatch V4 cannot
be relabeled either: it is bound to the separate Gemini visual-calibration MP4
operation. The execution owner therefore requires an additive versioned Qwen
post-render lifecycle, not reinterpretation of either record.

The source smoke uses a synthetic, digest-valid lifecycle fixture only to prove
the repository and projection fail closed. It makes no provider call and is
never counted as qualified complete-time model evidence.
