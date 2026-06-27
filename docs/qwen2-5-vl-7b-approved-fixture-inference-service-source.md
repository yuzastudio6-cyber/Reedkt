# Qwen2.5-VL 7B Approved Fixture Inference Service Source

Decision: `qwen2_5_vl_approved_fixture_inference_service_source_defined_fail_closed_default`.

This packet adds the source-level implementation needed before the first private approved-fixture Qwen inference smoke can be deployed. The Cloud Run GPU service now has a gated, lazy vLLM fixture inference path, and the CPU-only private caller can validate either the existing fail-closed contract response or the future fixture inference response.

This packet does not build an image, deploy Cloud Run, run the service, fetch an identity token, invoke Cloud Run, import the model, load model weights, initialize vLLM, run inference, dispatch a worker, mutate Supabase, execute SQL, create generated assets, create public artifacts, create signed URLs, mutate credits, unlock beta, unlock production, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

## Source Changes

- `server/workers/qwen2_5_vl_cloud_run_gpu/service.py`
  - keeps the default `/`, `/healthz`, `/readyz`, `/contract`, and `POST` behavior fail-closed;
  - validates the approved-snapshot runtime contract before any runtime work;
  - adds `QWEN_APPROVED_FIXTURE_INFERENCE_ENABLED=true` plus `QWEN_INFERENCE_ENABLED=true` as the explicit future smoke gate;
  - lazy-loads vLLM from the private model mount only after contract validation and fixture gate approval;
  - generates one in-memory private synthetic fixture for visual metadata only;
  - returns sanitized metadata summary without raw token, URL, media bytes, generated asset, public artifact, or signed URL output.
- `server/workers/qwen2_5_vl_private_invoke_cpu_caller/internal_caller.py`
  - preserves the existing default 403 fail-closed contract-smoke expectation;
  - adds `QWEN_CPU_CALLER_EXPECT_FIXTURE_INFERENCE=true` for the future 200 fixture-smoke response;
  - reports sanitized metadata-output shape and runtime side-effect booleans.

## Runtime Selection

- selected runtime: Google Cloud Run GPU
- selected GPU: NVIDIA L4
- region: `us-central1`
- model: `Qwen/Qwen2.5-VL-7B-Instruct`
- model revision: `cc594898137f460bfe9f0759e9844b3ce807cfb5`
- model aggregate SHA-256: `46f05ffcc6127a4caa9a3e8c11ddf298b9a5263c8680afe6b5d017ea91702c8b`
- runtime engine: `vllm`
- cost posture: run-on-use, scale-to-zero, min instances 0, first-smoke max scale 1
- CPU fallback for real Qwen VLM inference: false

## Future Fixture Gate

The future deployment/execution path must set all of these before the service can run the fixture inference branch:

- `QWEN_APPROVED_FIXTURE_INFERENCE_ENABLED=true`
- `QWEN_INFERENCE_ENABLED=true`
- approved runtime request contract passes;
- runtime request contains no raw prompt fields;
- source-of-truth refs are private references;
- model policy revision and checksum match the pinned Qwen values;
- future smoke keeps no generated assets, no public artifacts, no signed URLs, no render/export, no beta, and no production.

`QWEN_MODEL_IMPORT_ON_STARTUP` can remain false so model load is lazy and tied to the single approved fixture request.

## Default Fail-Closed Behavior

With default environment values:

- `QWEN_APPROVED_FIXTURE_INFERENCE_ENABLED=false`
- `QWEN_INFERENCE_ENABLED=false`
- `QWEN_MODEL_IMPORT_ON_STARTUP=false`
- valid contract POST returns HTTP `403`
- reason remains `qwen_inference_disabled_after_contract_check`
- `runtimeContractExecutesNow=false`
- `modelInferenceEnabled=false`
- `inferenceRun=false`

## Runtime Flags

- `serviceSourceSupportsApprovedFixtureInference=true`
- `cpuCallerSupportsFixtureInferenceExpectation=true`
- `defaultFailClosedPreserved=true`
- `imageBuilt=false`
- `imagePushed=false`
- `cloudRunServiceDeployed=false`
- `cpuCallerImageBuilt=false`
- `cpuCallerJobUpdated=false`
- `fixtureInferenceSmokeExecuted=false`
- `modelImportRun=false`
- `modelLoadRun=false`
- `vllmEngineInitialized=false`
- `inferenceRun=false`
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

## Next Prompt

`QWEN2_5_VL_STACK_TOOL_58A-APPROVED-FIXTURE-INFERENCE-SERVICE-DEPLOY: build and deploy gated Qwen fixture inference service source, no fixture inference yet`
