# Qwen2.5-VL 7B Approved Fixture Inference Result Review

Decision: `qwen2_5_vl_approved_fixture_inference_result_review_invocation_passed_structured_output_blocked`.

This packet reviews the sanitized metadata-only output from the controlled Qwen2.5-VL approved-fixture inference smoke fix. The review accepts the retry as evidence that the private Cloud Run GPU path can load Qwen2.5-VL 7B on NVIDIA L4 and complete one approved fixture inference. The review does not accept the output as structured VLM metadata readiness because the sanitized output summary reports `parsedJson=false`, `schemaKeys=[]`, `objectCount=0`, and `textLikeRegionCount=0`.

This is evidence only. It does not run another inference, create generated assets, create public artifacts, create signed URLs, mutate Supabase, execute SQL, call providers, process media, render/export, mutate credits, unlock beta, unlock production, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

## Reviewed Evidence

- `docs/qwen2-5-vl-7b-approved-fixture-inference-smoke-fix-result.md`
- `src/backend/mock/mock-qwen2-5-vl-approved-fixture-inference-smoke-fix-result.ts`
- `docs/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-readiness-rollup.md`
- `model-routing-policy.md`
- `open-source-tool-registry.md`
- `intent-led-edit-planning.md`
- `provider-prompt-architecture.md`

## Review Outcome

- invocation proof accepted: true
- private model-cache load proof accepted: true
- L4 bounded fixture profile accepted: true
- scale-to-zero posture preserved: true
- fail-closed restore accepted: true
- sanitized metadata-only evidence accepted: true
- structured JSON output accepted: false
- product QA metadata accepted: false
- runtime readiness advanced: false
- beta readiness advanced: false
- production readiness advanced: false

## Sanitized Metadata Under Review

- run id: `qwen25-approved-fixture-smoke-fix-20260627t184430z`
- CPU caller execution: `reeditpro-qwen2-5-vl-private-caller-csr98`
- selected GPU: NVIDIA L4
- observed HTTP status: `200`
- service reason: `qwen_fixture_inference_smoke_completed`
- elapsed request time: `357768` ms
- `parsedJson=false`
- `outputTextLength=187`
- `outputTextSha256=6534c929cddcb28fdfdc75a4e8d5ff656ac7741d669b8faa2560132e6b8a648f`
- `objectCount=0`
- `textLikeRegionCount=0`
- `schemaKeys=[]`

The raw model output text remains intentionally uncommitted. The hash and counts are enough to prove that output existed, but they are not enough to prove structured visual QA metadata quality.

## Accepted Evidence

- The private CPU caller successfully invoked the internal Cloud Run GPU service.
- The service loaded the private read-only Qwen2.5-VL model cache under the bounded fixture profile.
- vLLM initialized and completed one controlled fixture inference.
- The service returned the expected fixture-smoke completion reason.
- No generated asset, public artifact, signed URL, Supabase mutation, SQL execution, provider call, media processing, render/export, credit mutation, beta unlock, or production unlock occurred.
- The GPU service and persistent CPU caller were restored to fail-closed defaults after execution.

## Blocked Evidence

Structured output readiness remains blocked because:

- the output did not parse as JSON;
- no expected schema keys were recovered;
- no object rows were recovered;
- no text-like region rows were recovered;
- product QA cannot inspect raw text because raw model output is intentionally not stored;
- future workers need deterministic structured metadata rather than free-form model text.

## Required Fix Direction

The next step should tune the fixture prompt, parser, or output schema guard so the controlled fixture path returns compact structured JSON metadata. The future retry must keep the current safety posture:

- approved snapshot and queue lease required;
- raw prompt fields rejected;
- service URL and audience resolved at runtime only;
- identity token not printed or stored;
- model output committed only as sanitized metadata;
- no generated assets, public artifacts, signed URLs, providers, Supabase, SQL, media processing, render/export, credit mutation, beta, or production unlock;
- service restored fail-closed after the retry.

## Runtime Gates

- `resultReviewRecorded=true`
- `invocationProofAccepted=true`
- `privateModelCacheLoadAccepted=true`
- `l4FixtureProfileAccepted=true`
- `scaleToZeroPosturePreserved=true`
- `failClosedRestoreAccepted=true`
- `metadataOnlyEvidenceAccepted=true`
- `structuredJsonOutputAccepted=false`
- `productQaMetadataAccepted=false`
- `runtimeReadinessAdvanced=false`
- `privateInvokeReady=false`
- `betaReady=false`
- `productionReady=false`
- `inferenceRunNow=false`
- `generatedAssetsCreated=false`
- `publicArtifactsCreated=false`
- `signedUrlsCreated=false`
- `workersDispatched=false`
- `supabaseTouched=false`
- `sqlExecuted=false`
- `providerCallsMade=false`
- `mediaProcessingRun=false`
- `renderExportRun=false`
- `creditMutationCreated=false`
- `dryRunPassedClaimed=false`
- `generatedLocalFixturePassedClaimed=false`

## Next Prompt

`QWEN2_5_VL_STACK_TOOL_58E-STRUCTURED-FIXTURE-OUTPUT-FIX: tune Qwen fixture prompt/parser for structured JSON metadata, no beta/no generated assets`
