# Qwen2.5-VL 7B Approved Fixture Inference Smoke Execute Result

Decision: `qwen2_5_vl_approved_fixture_inference_smoke_attempt_blocked_vllm_kv_cache_memory`.

This packet records the first controlled private approved-fixture inference smoke attempt for Qwen2.5-VL 7B. The smoke attempted one CPU-caller request against a temporarily enabled GPU service fixture path, then restored the GPU service to fail-closed. The attempt did not pass: vLLM loaded the model weights but failed before inference because no KV-cache memory was available on the L4 configuration used by the smoke.

This result is evidence only. It does not create generated assets, public artifacts, signed URLs, Supabase rows, SQL, workers, provider calls, media processing, render/export, credit mutations, beta readiness, production readiness, `dry_run_passed`, or `generated_local_fixture_passed`.

## Source Evidence

- `docs/qwen2-5-vl-7b-approved-fixture-inference-smoke-plan.md`
- `docs/qwen2-5-vl-7b-approved-fixture-inference-service-source.md`
- `docs/qwen2-5-vl-7b-approved-fixture-inference-service-deploy-result.md`
- `docs/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-readiness-rollup.md`

## Controlled Attempt

- run id: `qwen25-approved-fixture-smoke-20260627t1756z`
- CPU caller execution: `reeditpro-qwen2-5-vl-private-caller-f2xtb`
- temporary GPU service revision: `reeditpro-qwen2-5-vl-l4-worker-00006-rr8`
- restored fail-closed GPU service revision: `reeditpro-qwen2-5-vl-l4-worker-00007-kpp`
- selected GPU: NVIDIA L4
- model path: private read-only model-cache mount
- expected HTTP status: `200`
- observed HTTP status: `500`
- CPU caller exit code: `3`
- smoke passed: false
- service restored fail-closed: true

The temporary service environment enabled only the fixture smoke gates needed for the controlled request. The CPU caller resolved the target and audience at runtime only, fetched an identity token without printing or storing token values, and sent one private request. After the failed execution, the service was restored with `QWEN_APPROVED_FIXTURE_INFERENCE_ENABLED=false` and `QWEN_INFERENCE_ENABLED=false`.

## Failure Classification

Failure class: `vllm_kv_cache_memory_exhausted_before_inference`.

Sanitized log summary:

- vLLM initialized on CUDA and began loading Qwen2.5-VL 7B from the private mount.
- checkpoint shards reached `100% Completed | 5/5`.
- model loading used about `15.6269 GiB`.
- vLLM reported available KV cache memory as `-0.96 GiB`.
- vLLM raised `ValueError: No available memory for the cache blocks. Try increasing gpu_memory_utilization when initializing the engine.`
- the CPU caller recorded `fixtureInferenceSmokePassed=false`, `httpStatus=500`, and `serviceReason=qwen_fixture_inference_smoke_failed`.

No model output was produced. The failure happened after model-load attempt and before prompt processing, forward pass, or inference completion.

## Runtime Result Gates

- `approvedFixtureInferenceSmokeAttempted=true`
- `approvedFixtureInferenceSmokePassed=false`
- `temporaryFixtureInferenceServiceRevisionDeployed=true`
- `temporaryFixtureInferenceServiceRestored=true`
- `serviceRestoredFailClosed=true`
- `cpuCallerJobExecuted=true`
- `identityTokenFetched=true`
- `identityTokenPrinted=false`
- `identityTokenValueStored=false`
- `cloudRunInvocationAttempted=true`
- `serviceRuntimeRequestSent=true`
- `modelImportAttempted=true`
- `modelLoadAttempted=true`
- `modelLoadCompleted=true`
- `vllmEngineInitialized=false`
- `promptProcessed=false`
- `forwardPassRun=false`
- `inferenceRun=false`
- `metadataOutputCreated=false`
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
- `betaUnlocked=false`
- `productionUnlocked=false`
- `dryRunPassedClaimed=false`
- `generatedLocalFixturePassedClaimed=false`

## Restore Verification

Post-run verification confirmed the GPU service is serving restored revision `reeditpro-qwen2-5-vl-l4-worker-00007-kpp` with fixture inference disabled by default. The CPU caller job remains ready, but persistent execution and fixture-response expectation gates remain disabled by default.

## What This Proves

- the private CPU caller can reach the internal GPU service path for a controlled request;
- the service can begin lazy vLLM/model-load work from the private mount;
- Qwen2.5-VL 7B weights are reachable through the deployed service path;
- the initial L4/vLLM smoke envelope is too tight for KV-cache allocation;
- fail-closed restore completed after the failed smoke.

## What This Does Not Prove

- no successful inference output was produced;
- no metadata-only VLM result was accepted;
- no generated asset or public artifact exists;
- no beta or production runtime readiness exists;
- no final user workflow is unlocked.

## Fix Direction

The next prompt should adjust the controlled fixture smoke envelope before another execution. Candidate fixes include lowering model context and multimodal budgets further, changing vLLM memory settings only inside the fixture smoke, switching to a smaller bounded test input path if supported by the runtime, or escalating the first smoke to a larger run-on-use GPU with scale-to-zero if L4 remains insufficient.

## Next Prompt

`QWEN2_5_VL_STACK_TOOL_58C-APPROVED-FIXTURE-INFERENCE-SMOKE-FIX: tune Qwen fixture inference memory envelope after failed L4 smoke, no generated assets/no beta`
