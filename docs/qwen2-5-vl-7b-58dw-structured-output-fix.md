# Qwen2.5-VL 7B 58DW Structured Output Fix

Decision: `qwen2_5_vl_58dw_structured_output_fix_ready_for_bounded_retry_2`.

This packet fixes the bounded 58DW retry blocker. The prior private fixture inference ran and produced parseable JSON, but the model returned a generic top-level object row with keys `confidence`, `label`, and `region` instead of the required `qwen_fixture_visual_metadata_v1` fixture metadata object. The retry was correctly rejected with `structured_metadata_schema_invalid_after_bounded_58dw_retry`.

This is source, prompt, parser, and local smoke validation only. It does not deploy Cloud Run, fetch an identity token, invoke Cloud Run, execute a Cloud Run job, run Qwen inference, dispatch workers, mutate Supabase, execute SQL, create generated assets, create public artifacts, create signed URLs, process media, render/export, mutate credits, unlock beta, unlock production, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

## Reviewed Evidence

- `docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-bounded-retry-prompt-result.md`
- `src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-bounded-retry-prompt-result.ts`
- `server/workers/qwen2_5_vl_cloud_run_gpu/service.py`
- `server/workers/qwen2_5_vl_private_invoke_cpu_caller/internal_caller.py`
- `server/cli/qwen2-5-vl-58dw-bounded-private-inference-retry.ts`
- `model-routing-policy.md`
- `open-source-tool-registry.md`
- `intent-led-edit-planning.md`

## Source Fix

- Added strictness marker `qwen_fixture_visual_metadata_v1_strict_after_58dw`.
- The fixture prompt now explicitly rejects the failed top-level row shape `{label, region, confidence}`.
- The fixture prompt now states the exact top-level key set and minimum row counts.
- The fixture prompt now requires all blocked action markers: `no_generated_assets`, `no_public_artifacts`, `no_signed_urls`, and `no_raw_prompt_execution`.
- The schema summary now reports `schemaCompletenessValid`, `topLevelObjectRowRejected`, `schemaValidationReasons`, and minimum count thresholds.
- `schemaValid=true` now requires complete keys, no top-level object-row failure, minimum object/text/spatial/blocked-action counts, and all required blocked actions.
- The CPU caller now requires the strict schema fields and an empty `schemaValidationReasons` array before accepting a fixture response.
- The bounded retry runner now gives the fixture enough output budget for the full schema and restores the full synthetic fixture image size.

## Local Parser Evidence

The local smoke validates parser behavior without loading Qwen:

- valid full fixture metadata is accepted with `schemaValid=true`;
- generic top-level `{label, region, confidence}` output is rejected;
- output missing `text_like_regions` is rejected;
- output missing required blocked actions is rejected;
- invalid prose remains rejected;
- raw model output text remains uncommitted and unstored.

## Runtime Gates

- `sourceFixDefined=true`
- `cloudRunServiceDeployed=false`
- `cloudRunInvocationAttempted=false`
- `cloudRunJobExecuted=false`
- `identityTokenFetched=false`
- `modelImportRun=false`
- `modelLoadRun=false`
- `vllmEngineInitialized=false`
- `inferenceRun=false`
- `boundedRetry2Run=false`
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
- `betaReady=false`
- `productionReady=false`
- `dryRunPassedClaimed=false`
- `generatedLocalFixturePassedClaimed=false`

## External-Agent Readiness Impact

Qwen is ready only for a new explicit bounded private fixture retry prompt. This does not authorize broad external-agent execution, paid production, public artifacts, generated assets, Supabase mutation, provider calls, worker dispatch outside the approved retry runner, or beta unlock.

The retry must keep scale-to-zero and fail-closed restoration requirements:

- service starts fail-closed;
- job starts fail-closed;
- target URL and audience are resolved at runtime only;
- the service is temporarily enabled for one bounded approved fixture request;
- the service is restored fail-closed after the attempt;
- output evidence remains sanitized metadata only.

## Next Prompt

`QWEN2_5_VL_STACK_TOOL_58DW-RETRY-2: run one bounded approved-fixture private inference retry after strict structured-output fix, no generated assets/no mutation`
