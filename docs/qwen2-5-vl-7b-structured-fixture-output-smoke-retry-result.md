# Qwen2.5-VL 7B Structured Fixture Output Smoke Retry Result

Decision: `qwen2_5_vl_structured_fixture_output_smoke_retry_passed_result_review_required`.

This packet records the controlled structured-output retry after the Qwen2.5-VL fixture output source fix. The retry deployed the fixed GPU service image fail-closed, temporarily enabled only the approved fixture inference gates, ran one private CPU-caller request, accepted schema-valid structured metadata, and restored both the GPU service and CPU caller to fail-closed persistent configuration.

This is evidence for the controlled fixture retry only. It does not create generated assets, public artifacts, signed URLs, Supabase rows, SQL, provider calls, user-facing worker jobs, media processing, render/export, credit mutations, beta readiness, production readiness, `dry_run_passed`, or `generated_local_fixture_passed`.

## Source Evidence

- `docs/qwen2-5-vl-7b-structured-fixture-output-fix.md`
- `docs/qwen2-5-vl-7b-approved-fixture-inference-result-review.md`
- `docs/qwen2-5-vl-7b-approved-fixture-inference-service-source.md`
- `docs/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-readiness-rollup.md`

## Controlled Retry

- run id: `qwen25-structured-fixture-output-retry-20260627t204453z`
- GPU image tag: `structured-fixture-output-retry-46e43a0d-20260627t204453z`
- GPU image digest: `sha256:be4042184812579986fb834d9a745316879319993e4f0e4635c7792b1915e325`
- CPU caller image tag: `structured-fixture-output-retry-46e43a0d-20260627t204453z`
- CPU caller image digest: `sha256:2dd061a0b10238a086e9c8957fb8c9457d1b39211c9eda5d596299539af02284`
- fail-closed deploy revision: `reeditpro-qwen2-5-vl-l4-worker-00011-bxb`
- temporary fixture inference revision: `reeditpro-qwen2-5-vl-l4-worker-00012-7n5`
- restored fail-closed revision: `reeditpro-qwen2-5-vl-l4-worker-00013-kms`
- CPU caller execution: `reeditpro-qwen2-5-vl-private-caller-hn9sw`
- selected GPU: NVIDIA L4
- selected runtime: Google Cloud Run GPU with vLLM
- fixture use case: `visual_understanding`
- expected HTTP status: `200`
- observed HTTP status: `200`
- service reason: `qwen_fixture_inference_smoke_completed`
- elapsed request time: `361650` ms
- structured fixture output smoke passed: true

The CPU caller resolved the target service and audience at execution time, fetched an identity token without printing or storing token values, sent one bounded private request, and did not persist the target URL or audience on the job. The temporary service profile used bounded vLLM settings and a small fixture image; those temporary values were removed after the retry.

## Structured Metadata Output

The response was reduced to sanitized metadata only:

- `parsedJson=true`
- `parseStrategy=json_object_extracted`
- `schemaVersion=qwen_fixture_visual_metadata_v1`
- `schemaValid=true`
- `outputTextLength=645`
- `outputTextSha256=f18b566fa1936ec68cf36dfd3c8fa5145ee22e0bc7a06ea9ca8930f50c2bd1d4`
- `objectCount=3`
- `textLikeRegionCount=1`
- `spatialRelationCount=2`
- `blockedActionCount=4`
- `schemaKeys=["blocked_actions","fixture_id","objects","schema_version","spatial_relations","text_like_regions","uncertainty","use_case"]`
- `missingSchemaKeys=[]`
- `normalizationWarnings=[]`
- `normalizedMetadataSha256=f18b566fa1936ec68cf36dfd3c8fa5145ee22e0bc7a06ea9ca8930f50c2bd1d4`
- `rawOutputStoredInRepo=false`

The raw model output text is intentionally not stored in the repo. The hash and counts are enough to prove the structured-output contract without committing generated content.

## Restore Verification

- GPU service restored revision: `reeditpro-qwen2-5-vl-l4-worker-00013-kms`
- GPU service ready after restore: true
- persistent `QWEN_APPROVED_FIXTURE_INFERENCE_ENABLED=false`
- persistent `QWEN_INFERENCE_ENABLED=false`
- persistent `QWEN_MODEL_IMPORT_ON_STARTUP=false`
- temporary vLLM tuning environment removed: true
- CPU caller job updated to the retry image: true
- CPU caller persistent execution enabled: false
- CPU caller persistent fixture expectation enabled: false
- CPU caller persistent target URL: false
- CPU caller persistent audience: false
- CPU caller task timeout restored to `60` seconds

## Runtime Result Gates

- `structuredFixtureOutputSmokeRetryAttempted=true`
- `structuredFixtureOutputSmokeRetryPassed=true`
- `structuredFixtureOutputAcceptedForReview=true`
- `structuredFixtureOutputResultReviewRequired=true`
- `schemaValid=true`
- `parsedJson=true`
- `objectRowsPresent=true`
- `textLikeRowsPresent=true`
- `serviceUrlResolvedAtRuntimeOnly=true`
- `serviceUrlValueStoredInRepo=false`
- `serviceUrlValuePersistedOnCpuCallerJob=false`
- `audienceResolvedAtRuntimeOnly=true`
- `audienceValueStoredInRepo=false`
- `audienceValuePersistedOnCpuCallerJob=false`
- `authHeaderCreated=true`
- `identityTokenFetched=true`
- `identityTokenPrinted=false`
- `identityTokenValueStored=false`
- `serviceRuntimeRequestSent=true`
- `modelImportRun=true`
- `modelLoadRun=true`
- `vllmEngineInitialized=true`
- `boundedFixtureInferenceRun=true`
- `metadataOutputCreated=true`
- `metadataOutputAcceptedForReview=true`
- `providerCallsMade=false`
- `workersDispatched=false`
- `supabaseTouched=false`
- `sqlExecuted=false`
- `generatedAssetsCreated=false`
- `publicArtifactsCreated=false`
- `signedUrlsCreated=false`
- `mediaProcessingRun=false`
- `renderExportRun=false`
- `creditMutationCreated=false`
- `betaUnlocked=false`
- `productionUnlocked=false`
- `dryRunPassedClaimed=false`
- `generatedLocalFixturePassedClaimed=false`

## What This Proves

- the fixed Qwen service image builds and deploys;
- the L4 scale-to-zero runtime can load Qwen2.5-VL 7B from the private read-only model-cache mount under the bounded fixture profile;
- the private CPU caller can invoke the internal GPU service and receive schema-valid structured fixture metadata;
- the structured metadata contract can recover the required JSON object and required schema keys;
- the restore path returned the persistent GPU service and CPU caller to fail-closed configuration.

## What This Does Not Prove

- the structured metadata has not yet been product/QA reviewed;
- no user-facing generated asset exists;
- no public artifact, signed URL, Supabase mutation, credit mutation, or final render/export exists;
- no arbitrary media, raw prompt, beta, or production runtime is unlocked;
- `generated_local_fixture_passed` is not claimed.

## Next Prompt

`QWEN2_5_VL_STACK_TOOL_58G-STRUCTURED-FIXTURE-OUTPUT-RESULT-REVIEW: review accepted structured Qwen fixture metadata, no beta/no generated assets`
