# Qwen2.5-VL 7B Approved Fixture Inference Smoke Fix Result

Decision: `qwen2_5_vl_approved_fixture_inference_smoke_fix_passed_result_review_required`.

This packet records the controlled retry after the first Qwen2.5-VL 7B approved-fixture inference smoke failed on vLLM KV-cache allocation. The fix bounded the synthetic fixture image size, deployed the patched GPU worker image fail-closed, temporarily enabled only the approved-fixture inference gates, ran one private CPU-caller request, and restored the GPU service to fail-closed.

The retry passed as a private metadata-only fixture smoke. It does not create generated assets, public artifacts, signed URLs, Supabase rows, SQL, provider calls, worker dispatch beyond the dedicated CPU caller execution, media processing, render/export, credit mutations, beta readiness, production readiness, `dry_run_passed`, or `generated_local_fixture_passed`.

## Source Evidence

- `docs/qwen2-5-vl-7b-approved-fixture-inference-smoke-execute-result.md`
- `docs/qwen2-5-vl-7b-approved-fixture-inference-service-source.md`
- `docs/qwen2-5-vl-7b-approved-fixture-inference-service-deploy-result.md`
- `docs/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-readiness-rollup.md`

## Controlled Retry

- run id: `qwen25-approved-fixture-smoke-fix-20260627t184430z`
- patched image tag: `approved-fixture-smoke-fix-f31c3e6d-20260627t181924z`
- patched fail-closed deploy revision: `reeditpro-qwen2-5-vl-l4-worker-00008-z6q`
- temporary fixture inference revision: `reeditpro-qwen2-5-vl-l4-worker-00009-s5b`
- CPU caller execution: `reeditpro-qwen2-5-vl-private-caller-csr98`
- restored fail-closed revision: `reeditpro-qwen2-5-vl-l4-worker-00010-rth`
- selected GPU: NVIDIA L4
- model path: private read-only model-cache mount
- expected HTTP status: `200`
- observed HTTP status: `200`
- CPU caller exit code: `0`
- elapsed request time: `357768` ms
- smoke passed: true
- service restored fail-closed: true

The temporary service environment enabled only the approved fixture smoke gates and bounded vLLM profile needed for this retry. The CPU caller resolved the target and audience at execution time, fetched an identity token without printing or storing token values in the repo or persistent job configuration, and sent one private request. After completion, the service was restored with `QWEN_APPROVED_FIXTURE_INFERENCE_ENABLED=false` and `QWEN_INFERENCE_ENABLED=false`.

## Fix Envelope

- `QWEN_VLLM_MAX_MODEL_LEN=1024`
- `QWEN_VLLM_MAX_NUM_SEQS=1`
- `QWEN_VLLM_MAX_NUM_BATCHED_TOKENS=512`
- `QWEN_VLLM_GPU_MEMORY_UTILIZATION=0.92`
- `QWEN_FIXTURE_MAX_TOKENS=64`
- `QWEN_FIXTURE_IMAGE_SIZE_PX=224`
- `QWEN_VLLM_ENFORCE_EAGER=true`
- `QWEN_VLLM_DTYPE=bfloat16`
- `QWEN_VLLM_MM_PROCESSOR_CACHE_GB=0`

The service source now bounds `QWEN_FIXTURE_IMAGE_SIZE_PX` from `128` to `384` pixels. The persistent service config does not keep these temporary tuning values after restore.

## Metadata Output

The smoke response was reduced to sanitized metadata only:

- `parsedJson=false`
- `outputTextLength=187`
- `outputTextSha256=6534c929cddcb28fdfdc75a4e8d5ff656ac7741d669b8faa2560132e6b8a648f`
- `objectCount=0`
- `textLikeRegionCount=0`
- `schemaKeys=[]`

The raw model output text is intentionally not stored in the repo. The metadata hash is evidence for deterministic review without committing generated content.

## Runtime Result Gates

- `approvedFixtureInferenceSmokeFixAttempted=true`
- `approvedFixtureInferenceSmokeFixPassed=true`
- `patchedGpuImageBuilt=true`
- `patchedGpuImagePushed=true`
- `patchedFailClosedServiceRevisionDeployed=true`
- `temporaryFixtureInferenceServiceRevisionDeployed=true`
- `temporaryFixtureInferenceServiceRestored=true`
- `serviceRestoredFailClosed=true`
- `cpuCallerJobExecuted=true`
- `serviceUrlResolvedAtRuntimeOnly=true`
- `serviceUrlValueStoredInRepo=false`
- `serviceUrlValuePersistedOnCpuCallerJob=false`
- `audienceResolvedAtRuntimeOnly=true`
- `audienceValueStoredInRepo=false`
- `audienceValuePersistedOnCpuCallerJob=false`
- `identityTokenFetched=true`
- `identityTokenPrinted=false`
- `identityTokenValueStored=false`
- `serviceRuntimeRequestSent=true`
- `modelImportRun=true`
- `modelLoadRun=true`
- `vllmEngineInitialized=true`
- `controlledFixtureInferenceCompleted=true`
- `metadataOutputCreated=true`
- `metadataOutputAcceptedForRuntime=false`
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

Post-run verification confirmed the GPU service is serving restored revision `reeditpro-qwen2-5-vl-l4-worker-00010-rth` with fixture inference disabled by default. The persistent CPU caller job remains ready with `QWEN_CPU_CALLER_EXECUTION_ENABLED=false`, `QWEN_CPU_CALLER_EXPECT_FIXTURE_INFERENCE=false`, no persistent target URL, and no persistent audience value.

## What This Proves

- the patched Qwen service image builds and deploys;
- the L4 scale-to-zero runtime can load Qwen2.5-VL 7B from the private read-only mount under the bounded fixture profile;
- the private CPU caller can invoke the internal GPU service and receive the expected fixture-smoke completion response;
- vLLM initialized and completed one controlled metadata-only fixture inference;
- the service restore path returned the persistent service to fail-closed configuration.

## What This Does Not Prove

- the metadata output has not yet been product/QA reviewed;
- no user-facing generated asset exists;
- no public artifact, signed URL, Supabase mutation, credit mutation, or final render/export exists;
- no arbitrary media, raw prompt, beta, or production runtime is unlocked;
- `generated_local_fixture_passed` is not claimed.

## Next Prompt

`QWEN2_5_VL_STACK_TOOL_58D-APPROVED-FIXTURE-INFERENCE-RESULT-REVIEW: review sanitized Qwen fixture output metadata, no beta/no generated assets`
