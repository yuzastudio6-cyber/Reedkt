# Qwen2.5-VL 7B Private Invoke CPU Caller Contract Smoke Result

Decision: `qwen2_5_vl_private_invoke_cpu_caller_contract_smoke_passed_fail_closed_no_inference`.

Mode: `qwen2_5_vl_private_invoke_cpu_caller_contract_smoke_result`.

This packet records the controlled CPU-only private invoke caller contract smoke for Qwen2.5-VL 7B. The goal was to prove the private Cloud Run caller path can send the approved-snapshot-shaped runtime contract to the GPU service and observe the expected fail-closed contract response while model import and inference remain disabled.

The result is a contract-path pass only. It does not run Qwen inference, import the model on startup, load vLLM, process media, dispatch a worker, mutate Supabase, execute SQL, create generated assets, create public artifacts, create signed URLs, mutate credits, unlock beta, unlock production, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

## What Changed Before The Smoke

- CPU caller Docker command was corrected so the deployed job runs `internal_caller.py` by default instead of `--print-status`.
- CPU caller response handling now parses the service JSON body and requires:
  - `httpStatus=403`
  - `serviceReason=qwen_inference_disabled_after_contract_check`
  - `contractSatisfiedForFutureRuntime=true`
  - `runtimeContractExecutesNow=false`
  - `modelInferenceEnabled=false`
- CPU caller image was rebuilt and deployed with tag `20260627-e9260862-contract-json`.
- GPU service image was refreshed with the current fail-closed contract handler:
  - build id: `2b87b01b-0ceb-4a17-ade1-559fdc0266b5`
  - image tag: `fail-closed-contract-handler-e9260862-20260627t1519z`
  - image digest: `sha256:5afbcbd7ec65b02c3be8971402648cc8484ff3f0b4ec9094d9e6ad046597ef9d`
  - revision: `reeditpro-qwen2-5-vl-l4-worker-00004-b72`

The service remained fail-closed after the image refresh:

- `MODEL_DOWNLOADS_ENABLED=false`
- `RAW_VLM_PROMPT_ENABLED=false`
- `PROVIDER_EXECUTION_ENABLED=false`
- `MEDIA_PROCESSING_ENABLED=false`
- `REAL_MEDIA_INPUT_ENABLED=false`
- `ARBITRARY_MEDIA_INPUT_ENABLED=false`
- `PUBLIC_OUTPUT_ENABLED=false`
- `TRACK_A_EXECUTION_ENABLED=false`
- `QWEN_MODEL_IMPORT_ON_STARTUP=false`
- `QWEN_INFERENCE_ENABLED=false`
- max scale: `1`
- scale-to-zero posture preserved

## Smoke Execution

- caller job: `reeditpro-qwen2-5-vl-private-caller`
- execution: `reeditpro-qwen2-5-vl-private-caller-nlc88`
- request id: `qwen25-private-caller-contract-smoke-20260627-e9260862-service-contract`
- result: completed successfully with exit code `0`
- `httpStatus=403`
- `expectedHttpStatus=403`
- `serviceReason=qwen_inference_disabled_after_contract_check`
- `contractSatisfiedForFutureRuntime=true`
- `runtimeContractExecutesNow=false`
- `identityTokenFetched=true`
- `identityTokenPrinted=false`
- `serviceRuntimeRequestSent=true`
- `modelInferenceEnabled=false`

The caller fetched an audience-bound identity token inside the Cloud Run Job and did not print or store token values. The target URL and audience were provided only as per-execution runtime overrides and were not persisted on the job.

## Post-Smoke Persistent Config

- CPU caller job image: `20260627-e9260862-contract-json`
- CPU caller default execution gate: `QWEN_CPU_CALLER_EXECUTION_ENABLED=false`
- `targetOverridePersisted: false`
- `audienceOverridePersisted: false`
- GPU service ready: true
- GPU service model import on startup: false
- GPU service inference enabled: false
- GPU service provider execution: false
- GPU service media processing: false
- GPU service public output: false
- GPU service Track A execution: false

## Runtime Flags

- `contractSmokeResultRecorded=true`
- `cpuOnlyCallerDockerCommandFixed=true`
- `cpuOnlyCallerResponseBodyParsed=true`
- `cpuOnlyCallerImageBuilt=true`
- `cpuOnlyCallerImagePushed=true`
- `cpuOnlyCallerJobImageUpdated=true`
- `gpuServiceContractHandlerImageBuilt=true`
- `gpuServiceContractHandlerImagePushed=true`
- `gpuServiceImageUpdated=true`
- `callerHarnessExecuted=true`
- `jobExecutionCount=1`
- `identityTokenFetched=true`
- `identityTokenPrinted=false`
- `identityTokenValueStored=false`
- `cloudRunInvocationAttempted=true`
- `serviceRuntimeRequestSent=true`
- `failClosedResponseObserved=true`
- `contractSatisfiedForFutureRuntime=true`
- `runtimeContractExecutesNow=false`
- `modelImportRun=false`
- `modelLoadRun=false`
- `vllmEngineInitialized=false`
- `promptProcessed=false`
- `forwardPassRun=false`
- `inferenceRun=false`
- `providerCallsMade=false`
- `workersDispatched=false`
- `supabaseTouched=false`
- `sqlExecuted=false`
- `generatedAssetsCreated=false`
- `publicArtifactsCreated=false`
- `signedUrlsCreated=false`
- `creditMutationCreated=false`
- `betaUnlocked=false`
- `productionUnlocked=false`
- `dryRunPassedClaimed=false`
- `generatedLocalFixturePassedClaimed=false`

## Remaining Blocker

The private invoke contract path is proven, but real runtime remains blocked. The next step must review this fail-closed smoke and define the first approved-fixture inference smoke with explicit approval snapshot, private artifact, QA, cost, no-public-output, and no-beta boundaries.

## Next Prompt

`QWEN2_5_VL_STACK_TOOL_56-PRIVATE-INVOKE-RUNTIME-READINESS-REVIEW: review contract smoke and plan first approved-fixture inference smoke, no generated assets/no beta`
