# Qwen2.5-VL Private Invoke Frontend Client

Decision: `qwen2_5_vl_7b_cloud_run_gpu_private_invoke_frontend_client_registered_mock_only`

This packet adds a typed frontend-safe client wrapper for the existing Qwen2.5-VL private-invoke dry-run route:

- route id: `jobs.qwen2_5_vl.privateInvoke.dryRun`
- route path: `/api/jobs/qwen2-5-vl/private-invoke/dry-run/mock`
- route runtime: `mock`
- client helper: `callQwen25VlPrivateInvokeDryRun`
- status helper: `getQwen25VlPrivateInvokeFrontendClientStatus`

The client uses ReeditPro's central API boundary through `callReeditProApi`. It does not bypass route registration, backend-required checks, or mock/live runtime gates.

## Scope

The client is a UI/API boundary convenience for mock dry-run inspection only. It may call the mock route that composes:

1. approved-snapshot queue validation
2. private-invoke envelope shaping
3. response classification
4. fail-closed runtime status

It does not create a production API route, deploy a backend service, invoke Cloud Run, fetch identity tokens, resolve service URLs, or run Qwen inference.

## Safety Rules

- `serviceUrlResolvedNow=false`
- `authHeaderCreated=false`
- `identityTokenFetched=false`
- `cloudRunInvocationAttempted=false`
- `serviceRuntimeRequestSent=false`
- `inferenceRun=false`
- `workersDispatched=false`
- `supabaseTouched=false`
- `sqlExecuted=false`
- `generatedAssetsCreated=false`
- `publicArtifactsCreated=false`
- `signedUrlsCreated=false`
- `creditMutationCreated=false`
- `dryRunPassedClaimed=false`
- `generatedLocalFixturePassedClaimed=false`

Raw prompt-shaped fields remain blocked by the mock route before the dry-run coordinator is called. Future real runtime must still use structured approved-snapshot payloads, not raw chat.

## Runtime Boundary

Qwen2.5-VL remains a backend/worker-only VLM metadata tool:

- visual understanding metadata
- B-roll candidate review metadata
- generated asset visual QA metadata
- caption/visual consistency advisory metadata

It is not a B-roll generator, renderer, exporter, OCR source of truth, chart renderer, storage publisher, public artifact delivery system, billing system, or frontend model runtime.

## Next Prompt

`QWEN2_5_VL_STACK_TOOL_58-APPROVED-FIXTURE-INFERENCE-SMOKE-EXECUTE: run first private approved-fixture Qwen inference smoke, no generated assets/no beta`
