# Qwen2.5-VL 7B Controlled Persisted Worker Dispatch Runtime Real-Dispatch Approved-Fixture Private Inference Bounded Retry Prompt Result

Decision: `qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_real_dispatch_approved_fixture_private_inference_bounded_retry_prompt_blocked_structured_metadata_schema_invalid`.

This packet records the 58DW bounded retry prompt result after live auth, service describe, and CPU-caller job describe passed. The retry executed one approved-fixture private inference path through the persisted job and lease bridge, then restored the GPU service and CPU caller to fail-closed persistent configuration. The attempt did not pass because the model response metadata was parseable JSON but failed the required structured fixture schema.

This result did not create generated assets, public artifacts, signed URLs, Supabase rows, SQL, provider calls, media processing, render/export, credit mutations, beta readiness, production readiness, `dry_run_passed`, or `generated_local_fixture_passed`. Raw model output was not stored in the repo.

## Reviewed Evidence

- 58DV gate alignment: `docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-gate-alignment.md`
- external-agent next command spec: `src/backend/mock/mock-external-agent-tool-next-command.ts`
- external-agent next command CLI: `server/cli/external-agent-tool-next-command.ts`
- 58DW bounded retry runner: `server/cli/qwen2-5-vl-58dw-bounded-private-inference-retry.ts`
- model routing policy: `model-routing-policy.md`
- intent-led edit planning: `intent-led-edit-planning.md`
- approved plan snapshot policy: `approved-plan-snapshot-policy.md`
- editing agent execution architecture: `editing-agent-execution-architecture.md`

## Prompt Result

- 58DV gate alignment recorded: true
- static external-agent gate allows Qwen prompt: true
- live next-command requires Qwen preflight: true
- Qwen live preflight passed: true
- Qwen auth refresh passed: true
- Qwen service describe passed: true
- Qwen job describe passed: true
- Qwen downstream probe skipped: false
- bounded retry prompt executed: true
- run id: `qwen58dw-20260701T184650`
- temporary fixture inference revision: `reeditpro-qwen2-5-vl-l4-worker-00041-9n5`
- CPU caller execution: `reeditpro-qwen2-5-vl-private-caller-jhrjv`
- restored fail-closed revision: `reeditpro-qwen2-5-vl-l4-worker-00042-hdk`
- selected GPU: NVIDIA L4
- expected HTTP status: `200`
- observed HTTP status: `200`
- service reason: `qwen_fixture_inference_smoke_completed`
- elapsed request time: `404877` ms
- CPU caller exit code: `3`
- bounded retry passed: false
- service restored fail-closed: true
- generated assets created: false
- `generatedLocalFixturePassedClaimed=false`

## Blocker

`structured_metadata_schema_invalid_after_bounded_58dw_retry`

The model returned parseable metadata, but it was not accepted by the structured fixture contract. The sanitized metadata summary showed only a partial row shape instead of the required fixture object:

- `parsedJson=true`
- `parseStrategy=json_object_extracted`
- `schemaVersion=qwen_fixture_visual_metadata_v1`
- `schemaValid=false`
- `outputTextLength=299`
- `outputTextSha256=f06dba8bc44b6eba1b3545c8e9f8a072b2712059c64379c5bc2dae36203148d0`
- `normalizedMetadataSha256=e56a90c54a30dccd2af066248eafa8ce7183955124aea8b031d7c21a554fa462`
- `schemaKeys=["confidence","label","region"]`
- `requiredSchemaKeysPresent=[]`
- `missingSchemaKeys=["blocked_actions","fixture_id","objects","schema_version","spatial_relations","text_like_regions","uncertainty","use_case"]`
- `objectCount=0`
- `textLikeRegionCount=0`
- `spatialRelationCount=0`
- `blockedActionCount=0`
- `normalizationWarnings=["use_case_defaulted","fixture_id_normalized","schema_version_normalized"]`
- `rawOutputStoredInRepo=false`

## Restore Verification

- GPU service ready after restore: true
- persistent `QWEN_APPROVED_FIXTURE_INFERENCE_ENABLED=false`
- persistent `QWEN_INFERENCE_ENABLED=false`
- persistent `QWEN_MODEL_IMPORT_ON_STARTUP=false`
- temporary vLLM tuning environment removed: true
- CPU caller persistent execution enabled: false
- CPU caller persistent fixture expectation enabled: false
- CPU caller persistent target URL: false
- CPU caller persistent audience: false
- CPU caller persistent timeout: `20`

## Source-Of-Truth Rules

- workers execute approved snapshots, not raw chat: true
- structured tool envelope required before execution: true
- raw chat worker execution allowed: false
- raw worker prompt allowed: false
- signed URL source of truth allowed: false
- public URL source of truth allowed: false
- browser-facing invocation allowed: false
- Qwen may generate B-roll video: false
- Qwen may render/export: false

## Runtime Flags

- `boundedRetryPromptResultRecorded=true`
- `liveNextCommandAuthGuardRecorded=true`
- `staticExternalAgentGateInspected=true`
- `staticExternalAgentGateAllowsQwenPrompt=true`
- `qwenLivePreflightPassed=true`
- `qwenAuthRefreshPassed=true`
- `qwenServiceDescribePassed=true`
- `qwenJobDescribePassed=true`
- `runtimeRunNow=true`
- `temporaryFixtureInferenceServiceRevisionDeployed=true`
- `cloudRunJobExecuted=true`
- `serviceTargetResolvedAtRuntimeOnly=true`
- `serviceTargetValueStoredInRepo=false`
- `audienceResolvedAtRuntimeOnly=true`
- `audienceValueStoredInRepo=false`
- `identityTokenFetched=true`
- `identityTokenPrinted=false`
- `identityTokenValueStored=false`
- `authHeaderCreated=true`
- `authHeaderValueStored=false`
- `cloudRunInvocationAttempted=true`
- `serviceRuntimeRequestSent=true`
- `modelImportRun=true`
- `modelLoadRun=true`
- `vllmEngineInitialized=true`
- `promptProcessed=true`
- `forwardPassRun=true`
- `inferenceRun=true`
- `structuredMetadataAccepted=false`
- `schemaValid=false`
- `rawModelOutputStored=false`
- `temporaryFixtureInferenceServiceRestored=true`
- `serviceRestoredFailClosed=true`
- `providerCallsMade=false`
- `workersDispatched=false`
- `supabaseTouched=false`
- `sqlExecuted=false`
- `generatedAssetsCreated=false`
- `publicArtifactsCreated=false`
- `signedUrlsCreated=false`
- `creditMutationCreated=false`
- `mediaProcessingRun=false`
- `renderExportRun=false`
- `betaReady=false`
- `productionReady=false`
- `dryRunPassedClaimed=false`
- `generatedLocalFixturePassedClaimed=false`

## What This Advances

This advances Qwen from a live-preflight-ready 58DW prompt to a real bounded retry result. The Cloud Run GPU service can be temporarily opened for one approved fixture request, the CPU caller can reach it privately, Qwen2.5-VL can load and run inference on NVIDIA L4, and the restore path returns persistent runtime gates to fail-closed. The remaining blocker is structured output reliability: the next fix should tighten schema-constrained fixture generation before another retry.

## Next Prompt

`QWEN2_5_VL_STACK_TOOL_58DW-FIX: tighten Qwen fixture structured-output generation after schema-invalid bounded retry, no generated assets/no mutation`
