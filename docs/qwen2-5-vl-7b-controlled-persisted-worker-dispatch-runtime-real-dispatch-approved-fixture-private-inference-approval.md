# Qwen2.5-VL 7B Controlled Persisted Worker Dispatch Runtime Real-Dispatch Approved-Fixture Private Inference Approval

Decision: `qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_real_dispatch_approved_fixture_private_inference_approval_accepted_preflight_required`.

This packet approves the recorded 58DM private inference plan for a future no-execution preflight only. It does not run Qwen inference, import Qwen, load Qwen, initialize vLLM, process prompts, run a forward pass, invoke Cloud Run, dispatch a worker, create persisted job rows, claim leases, create idempotency rows, create job events, create backend runtime messages, create worker claims, mutate Supabase, execute SQL, write storage objects, create signed URLs, create public artifacts, create generated assets, process media, render/export, spend credits, unlock beta, unlock production, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

The upstream 58DM plan records the exact bounded private inference envelope for one future approved-fixture Qwen metadata request. This 58DN approval accepts that envelope for a later preflight that may verify static approved snapshot refs, persisted dispatch refs, private source-of-truth refs, request-envelope shape, runtime boundary, response contract, QA/audit/cost/no-spend evidence, cleanup, retry, rollback, and review requirements. The approval does not authorize runtime value resolution, identity token fetch, auth-header creation, Cloud Run invocation, model runtime execution, inference, persistence, generated assets, or beta readiness.

## Upstream Evidence

- private inference plan: `docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-plan.md`
- private inference plan spec: `src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-plan.ts`
- private inference plan smoke: `server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-plan-smoke.ts`
- private invoke attempt result review: `docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-invoke-attempt-result-review.md`
- approved plan snapshot policy: `approved-plan-snapshot-policy.md`
- worker execution architecture: `editing-agent-execution-architecture.md`
- model routing policy: `model-routing-policy.md`
- intent-led edit planning: `intent-led-edit-planning.md`

## Approval Scope

- private inference plan recorded: true
- approved-fixture private inference approval recorded: true
- approved-fixture private inference approval required: false
- approved-fixture private inference accepted for preflight: true
- approved-fixture private inference preflight required: true
- future single approved-fixture private inference preflight approved: true
- future approved snapshot binding preflight check approved: true
- future persisted job, lease, and idempotency preflight check approved: true
- future private source-of-truth preflight check approved: true
- future request-envelope preflight check approved: true
- future private invoke transport and credential preflight check approved: true
- future model runtime boundary preflight check approved: true
- future metadata-only response contract preflight check approved: true
- future QA, audit, cost, and no-spend preflight check approved: true
- inference approved now: false
- model import approved now: false
- model load approved now: false
- vLLM initialization approved now: false
- prompt processing approved now: false
- forward pass approved now: false
- Cloud Run invocation approved now: false
- worker dispatch approved now: false
- result persistence approved now: false
- generated asset creation approved now: false
- storage object creation approved now: false
- signed URL creation approved now: false
- public artifact creation approved now: false
- credit spend approved now: false
- beta approved now: false
- production approved now: false

## Approved Runtime Posture

- platform: `google_cloud_run_gpu`
- selected GPU: `nvidia_l4`
- region: `us-central1`
- service: `reeditpro-qwen2-5-vl-l4-worker`
- cost posture: `scale_to_zero_required`
- minimum instances: 0
- initial max instances: 1
- CPU fallback allowed: false

The L4 target remains approved only as a future bounded private Qwen metadata runtime posture. This packet does not resize, deploy, warm, invoke, or mutate the service. The run-on-use posture remains minimum instances zero and initial maximum one.

## Accepted 58DM Plan Areas

### Approved Snapshot And Fixture Scope

- accepted for future preflight: true
- execution allowed now: false
- required evidence: exact approved fixture id, approved plan snapshot id, immutable plan version, checksum, structured findings, edit intents, source-order refs, timing refs, and worker graph
- rejected: arbitrary user media, raw chat, raw worker prompt, and browser-facing execution

### Persisted Job, Lease, And Idempotency Refs

- accepted for future preflight: true
- execution allowed now: false
- required evidence: persisted Qwen job ref, lease ref, worker claim ref, backend runtime message ref, job event ref, and idempotency key
- rejected now: real job row, lease claim, idempotency row, event row, runtime message, and worker claim creation

### Private Source-Of-Truth Refs

- accepted for future preflight: true
- execution allowed now: false
- required evidence: private source refs, storage object records, artifact manifest refs, checksum refs, approved snapshot refs, and source media immutability refs
- rejected now: storage writes, generated assets, public artifacts, Supabase mutation, SQL, signed URLs, and public URLs

### Qwen Private Inference Request Envelope

- accepted for future preflight: true
- execution allowed now: false
- required evidence: `qwen_fixture_visual_metadata_v1`, approved snapshot refs, private frame refs, visual QA task refs, manifest refs, checksum refs, and persisted dispatch refs
- rejected now: raw prompts, raw provider prompts, raw worker prompts, arbitrary media, public URLs, signed URLs, and generated-asset creation

### Private Invoke Transport And Credential Handling

- accepted for future preflight: true
- execution allowed now: false
- required evidence: backend/runtime-only service target and audience resolution plan, runtime-scoped identity token and auth-header handling, and redaction requirements
- rejected now: service target resolution, audience resolution, identity token fetch, auth-header creation, and private request sending

### Model Runtime Boundary

- accepted for future preflight: true
- execution allowed now: false
- required evidence: one bounded future import/load/vLLM/prompt/forward/inference path for the approved fixture only
- rejected now: import, model load, vLLM initialization, prompt processing, forward pass, and inference

### Metadata-Only Response Contract

- accepted for future preflight: true
- execution allowed now: false
- required evidence: schema version, object rows, text-like regions, spatial relations, blocked-action evidence, normalized metadata hash, and raw-output exclusion evidence
- rejected now: raw model output storage, generated assets, public artifacts, signed URLs, and persistence

### QA, Audit, Cost, And Credit No-Spend

- accepted for future preflight: true
- execution allowed now: false
- required evidence: sanitized QA, audit, timing, latency, model-runtime, cleanup, and internal cost evidence refs
- rejected now: credit estimates, approvals, reservations, spends, releases, refunds, Stripe operations, and payment objects

### Cleanup, Retry, Rollback, And Review

- accepted for future preflight: true
- execution allowed now: false
- required evidence: timeout, retry budget, stale lease cleanup, duplicate-source rollback, invalid-schema rollback, disabled-inference handling, service-failure handling, cleanup-failure reporting, and result-review requirements
- rejected now: deletion of approved snapshot, private source-of-truth refs, manifests, checksums, or audit evidence

## Future Preflight Boundaries

- approval recorded before preflight: true
- future preflight may verify private inference envelope only: true
- future preflight may resolve service target now: false
- future preflight may resolve audience now: false
- future preflight may fetch identity token now: false
- future preflight may create auth header now: false
- future preflight may invoke Cloud Run now: false
- future preflight may import model now: false
- future preflight may load model now: false
- future preflight may initialize vLLM now: false
- future preflight may process prompt now: false
- future preflight may run forward pass now: false
- future preflight may run inference now: false

## Source-Of-Truth Rules

Workers execute approved snapshots, not raw chat.

```text
approved plan snapshot
-> persisted worker job
-> persisted idempotency guard
-> transactional lease claim
-> sanitized job event
-> backend runtime message
-> worker claim
-> private invoke handoff
-> Qwen metadata result review
```

The approval preserves these rules:

- structured findings and edit intents must feed approved snapshots before worker execution
- private storage object records, manifests, checksums, and approved snapshot refs are source-of-truth inputs
- signed URLs and public URLs are not source of truth
- frontend code must not claim jobs, resolve private invoke credentials, call Cloud Run, or create generated assets
- Qwen remains visual understanding and visual QA metadata only
- Qwen must not generate B-roll video, render, export, replace deterministic OCR, or publish artifacts

## Runtime Flags

- `approvedFixturePrivateInferencePlanRecorded=true`
- `approvedFixturePrivateInferenceApprovalRequired=false`
- `approvedFixturePrivateInferenceApprovalRecorded=true`
- `approvedFixturePrivateInferenceApprovalAccepted=true`
- `approvedFixturePrivateInferencePreflightRequired=true`
- `approvedFixturePrivateInferencePreflightRecorded=false`
- `readyForApprovedFixturePrivateInferencePreflight=true`
- `approvedSnapshotAndFixtureScopeAcceptedForPreflight=true`
- `persistedJobLeaseAndIdempotencyRefsAcceptedForPreflight=true`
- `privateSourceOfTruthRefsAcceptedForPreflight=true`
- `qwenPrivateInferenceRequestEnvelopeAcceptedForPreflight=true`
- `privateInvokeTransportAndCredentialHandlingAcceptedForPreflight=true`
- `modelRuntimeBoundaryAcceptedForPreflight=true`
- `metadataOnlyResponseContractAcceptedForPreflight=true`
- `qaAuditCostCreditNoSpendAcceptedForPreflight=true`
- `cleanupRetryRollbackReviewAcceptedForPreflight=true`
- `selectedGpuL4Accepted=true`
- `scaleToZeroCostPostureAccepted=true`
- `minInstancesZeroAccepted=true`
- `initialMaxInstancesOneAccepted=true`
- `cpuFallbackDisabledAccepted=true`
- `readyForRealWorkerDispatch=false`
- `privateInvokeReady=false`
- `approvedFixturePrivateInferenceApprovedNow=false`
- `qwenInferenceAcceptedNow=false`
- `cloudRunInvocationAttempted=false`
- `serviceRuntimeRequestSent=false`
- `serviceTargetResolvedNow=false`
- `audienceResolvedNow=false`
- `identityTokenFetched=false`
- `authHeaderCreated=false`
- `privateRequestSendAllowedNow=false`
- `modelImportRun=false`
- `modelLoadRun=false`
- `vllmEngineInitialized=false`
- `promptProcessed=false`
- `forwardPassRun=false`
- `inferenceRun=false`
- `workersDispatched=false`
- `supabaseTouched=false`
- `sqlExecuted=false`
- `generatedAssetsCreated=false`
- `publicArtifactsCreated=false`
- `signedUrlsCreated=false`
- `creditMutationCreated=false`
- `betaReady=false`
- `productionReady=false`
- `dryRunPassedClaimed=false`
- `generatedLocalFixturePassedClaimed=false`

## What This Advances

The 58DM plan defined the bounded private inference envelope. This 58DN packet approves that envelope for a later static preflight, making the next external-agent execution gate explicit without allowing runtime execution. The next packet must verify the envelope before any actual private inference attempt can be considered.

## Next Prompt

`QWEN2_5_VL_STACK_TOOL_58DO-CONTROLLED-PERSISTED-WORKER-DISPATCH-RUNTIME-REAL-DISPATCH-APPROVED-FIXTURE-PRIVATE-INFERENCE-PREFLIGHT: verify one bounded approved-fixture private Qwen inference preflight through the persisted job and lease bridge, no Cloud Run invocation/no inference/no generated assets/no beta`
