# Qwen2.5-VL 7B 58DY External Agent Wrapper Execution Result

Decision: `qwen2_5_vl_58dy_external_agent_wrapper_execution_passed_result_review_required`.

This packet records the successful canonical external-agent wrapper execution for Qwen2.5-VL 7B after the 58DX result review accepted the bounded approved-fixture path for the explicit external-agent gate.

This is result evidence for the explicit external-agent approved-fixture Qwen path only. It does not create generated assets, create public artifacts, create signed URLs, mutate Supabase, execute SQL, call providers, process media, render/export, mutate credits, unlock beta, unlock production, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

## Source Rule

External agents execute approved snapshots, structured tool envelopes, and approved fixture contracts, not raw chat. The accepted path for this result was:

`external-agent next-command -> guarded Qwen wrapper -> bounded approved-fixture runner -> private Cloud Run service -> CPU caller job -> sanitized metadata result -> fail-closed restore`

Raw chat execution, arbitrary user media, public delivery, and generated asset creation remain blocked.

## Executed Command

The successful wrapper run used the canonical command emitted by `npm run external-agent-tool-next-command`:

`REEDITPRO_CONFIRM_EXTERNAL_AGENT_QWEN_EXECUTION=true npm run external-agent-tool-execute-qwen -- --execute --json`

The wrapper then re-ran the live next-command preflight, confirmed the Qwen explicit gate, and delegated only to:

`REEDITPRO_CONFIRM_QWEN_58DW_BOUNDED_RETRY=true npm run qwen2-5-vl-58dw-bounded-private-inference-retry -- --execute --json`

## Reviewed Run

- wrapper mode: `external_agent_qwen_execution_delegated_result`
- wrapper status: `passed`
- delegated mode: `qwen2_5_vl_58dw_bounded_private_inference_retry_result`
- delegated status: `passed`
- run id: `qwen58dw-20260701T215300`
- caller execution: `reeditpro-qwen2-5-vl-private-caller-x64s2`
- job exit code: `0`
- selected GPU: `nvidia_l4`
- service restored fail-closed: `true`
- target URL stored in repo: `false`
- audience stored in repo: `false`
- identity token printed: `false`
- identity token stored: `false`

## Wrapper Behavior Accepted

- `npm run external-agent-tool-execute-qwen` reports a static guard without `--execute`;
- `REEDITPRO_CONFIRM_EXTERNAL_AGENT_QWEN_EXECUTION=true` is required for execution mode;
- the wrapper re-runs `npm run external-agent-tool-next-command` immediately before delegation;
- the wrapper requires `executionAllowedNow=true`;
- the wrapper requires `qwenLivePreflightPassed=true`;
- the wrapper requires `staticExplicitToolGateReady=true`;
- the wrapper delegates only to the bounded approved-fixture runner;
- the wrapper parses delegated JSON even when npm prints script preamble text;
- service target and audience are resolved at runtime only;
- sanitized result evidence excludes concrete service URLs, identity tokens, service-account values, raw model output, and secrets.

## Runtime Result

- `boundedRetryPromptExecuted=true`
- `temporaryFixtureInferenceServiceRevisionDeployed=true`
- `cpuCallerJobExecuted=true`
- `serviceRestoredFailClosed=true`
- `serviceTargetResolvedAtRuntimeOnly=true`
- `audienceResolvedAtRuntimeOnly=true`
- `modelImportRun=true`
- `modelLoadRun=true`
- `vllmEngineInitialized=true`
- `inferenceRun=true`
- `metadataOnlyEvidenceCreated=true`
- `rawModelOutputStored=false`
- `generatedAssetsCreated=false`
- `publicArtifactsCreated=false`
- `signedUrlsCreated=false`
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

## Fail-Closed Verification

After the wrapper execution completed:

- Qwen approved fixture inference gate restored to `false`;
- Qwen inference gate restored to `false`;
- model import on startup remained `false`;
- temporary VLLM/fixture runtime keys were removed;
- service minimum scale remained absent;
- service template max scale remained `1`;
- CPU caller execution gate restored to `false`;
- CPU caller fixture expectation restored to `false`;
- CPU caller target URL was not persisted;
- CPU caller audience was not persisted.

## What This Proves

- The canonical external-agent Qwen wrapper can execute the bounded approved-fixture path end to end.
- The wrapper can parse delegated result JSON from npm script output.
- The Qwen Cloud Run service and CPU caller job can complete the approved fixture run and return to fail-closed state.
- Qwen is ready for explicit external-agent approved-fixture execution after live preflight.

## What This Does Not Prove

- This does not approve arbitrary user media execution.
- This does not approve raw chat execution.
- This does not approve generated asset creation.
- This does not approve public artifacts, signed URLs, Supabase mutation, SQL, provider calls, media processing, render/export, credits, beta, production, or paid production.
- This does not unblock B-roll, which remains blocked by `GPUS_ALL_REGIONS` quota.

## Next Prompt

`AI-VIDEO-BROLL-GEN-9J-GPU-GLOBAL-QUOTA-USER: request GPUS_ALL_REGIONS quota increase to 1 in Google Cloud Console, no repo changes`
