# Qwen2.5-VL 7B Structured Fixture Output Fix

Decision: `qwen2_5_vl_structured_fixture_output_source_fix_ready_smoke_retry_required`.

This packet fixes the source-level blocker found by the approved-fixture result review: the controlled Qwen invocation completed, but the sanitized metadata showed `parsedJson=false`, `schemaKeys=[]`, `objectCount=0`, and `textLikeRegionCount=0`. The fix tightens the fixture prompt, adds a schema version and required output keys, hardens JSON-object extraction, normalizes fixture metadata rows, and makes the CPU caller reject future fixture-smoke responses unless structured metadata is valid.

This is source and local parser validation only. It does not build an image, deploy Cloud Run, fetch an identity token, invoke Cloud Run, run Qwen inference, dispatch workers, mutate Supabase, execute SQL, create generated assets, create public artifacts, create signed URLs, process media, render/export, mutate credits, unlock beta, unlock production, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

## Reviewed Evidence

- `docs/qwen2-5-vl-7b-approved-fixture-inference-result-review.md`
- `src/backend/mock/mock-qwen2-5-vl-approved-fixture-inference-result-review.ts`
- `server/workers/qwen2_5_vl_cloud_run_gpu/service.py`
- `server/workers/qwen2_5_vl_private_invoke_cpu_caller/internal_caller.py`
- `model-routing-policy.md`
- `open-source-tool-registry.md`
- `intent-led-edit-planning.md`
- `provider-prompt-architecture.md`

## Source Fix

- Added `FIXTURE_OUTPUT_SCHEMA_VERSION=qwen_fixture_visual_metadata_v1`.
- Added required fixture keys: `schema_version`, `fixture_id`, `use_case`, `objects`, `text_like_regions`, `spatial_relations`, `uncertainty`, and `blocked_actions`.
- Tightened the prompt to request exactly one minified JSON object with no markdown wrapper and no prose.
- Embedded a compact schema target for the synthetic private fixture so the model sees the required shape.
- Added `_extract_json_object(...)` to recover a JSON object from direct JSON, fenced JSON, or prose-wrapped JSON.
- Added `_normalize_fixture_metadata(...)` so object/text rows are sanitized and counted without storing raw output.
- Added `schemaValid`, `requiredSchemaKeysPresent`, `missingSchemaKeys`, `normalizationWarnings`, and `normalizedMetadataSha256` to the sanitized metadata summary.
- Kept `rawOutputStoredInRepo=false`.
- Tightened the CPU caller so a future fixture smoke only passes when structured metadata is accepted.

## Local Parser Evidence

The local source smoke validates parser behavior without loading Qwen:

- direct compact JSON parses with `parsedJson=true`;
- fenced/prose-wrapped JSON parses with `parsedJson=true`;
- required schema keys are detected;
- `schemaValid=true` when all required keys are present;
- object and text-like region counts are non-zero for valid fixture metadata;
- invalid prose remains `parsedJson=false`;
- raw model output text remains uncommitted and unstored.

## Runtime Gates

- `structuredFixtureOutputSourceFixDefined=true`
- `fixturePromptSchemaTargetDefined=true`
- `jsonObjectExtractionDefined=true`
- `fixtureMetadataNormalizationDefined=true`
- `cpuCallerRequiresStructuredMetadata=true`
- `localParserValidationPassed=true`
- `cloudRunServiceDeployed=false`
- `cloudRunInvocationAttempted=false`
- `identityTokenFetched=false`
- `modelImportRun=false`
- `modelLoadRun=false`
- `vllmEngineInitialized=false`
- `inferenceRun=false`
- `structuredOutputSmokeRetried=false`
- `structuredOutputAcceptedForRuntime=false`
- `workersDispatched=false`
- `supabaseTouched=false`
- `sqlExecuted=false`
- `generatedAssetsCreated=false`
- `publicArtifactsCreated=false`
- `signedUrlsCreated=false`
- `mediaProcessingRun=false`
- `renderExportRun=false`
- `creditMutationCreated=false`
- `betaReady=false`
- `productionReady=false`
- `dryRunPassedClaimed=false`
- `generatedLocalFixturePassedClaimed=false`

## Remaining Blocker

The source fix is ready for a bounded retry, but runtime acceptance is still blocked until the fixed service is built, deployed fail-closed, temporarily enabled for one approved private fixture request, and restored fail-closed after the smoke. The next smoke must store only sanitized metadata and must not create generated assets, public artifacts, signed URLs, Supabase rows, SQL, provider calls, media output, render/export output, credit mutations, beta readiness, or production readiness.

## Next Prompt

`QWEN2_5_VL_STACK_TOOL_58F-STRUCTURED-FIXTURE-OUTPUT-SMOKE-RETRY: deploy fixed Qwen fixture source and run controlled private structured output smoke, no beta/no generated assets`
