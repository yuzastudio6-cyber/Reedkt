# Qwen2.5-VL 7B Private Invoke CPU Caller Source

Decision: `qwen2_5_vl_private_invoke_cpu_caller_source_defined_no_deploy_no_inference`.

Mode: `qwen2_5_vl_private_invoke_cpu_caller_source_only`.

This packet records the CPU-only internal caller harness source for the future Qwen2.5-VL private-invoke contract path. It defines a no-model, no-vLLM, no-CUDA, no-inference caller source and image specification. It does not build an image, push an image, deploy a Cloud Run Job, execute the caller, fetch an identity token, call Cloud Run, run inference, dispatch workers, mutate Supabase, execute SQL, create generated assets, create signed URLs, mutate credits, unlock beta, or unlock production.

## Source Artifacts

- worker package: `server/workers/qwen2_5_vl_private_invoke_cpu_caller/`
- caller module: `server/workers/qwen2_5_vl_private_invoke_cpu_caller/internal_caller.py`
- caller README: `server/workers/qwen2_5_vl_private_invoke_cpu_caller/README.md`
- image source: `docker/prod/qwen2-5-vl-private-invoke-cpu-caller/Dockerfile`
- image README: `docker/prod/qwen2-5-vl-private-invoke-cpu-caller/README.md`
- image ignore file: `docker/prod/qwen2-5-vl-private-invoke-cpu-caller/Dockerfile.dockerignore`

## Caller Source Behavior

- Default mode prints a redacted status payload and exits.
- Default mode does not fetch an identity token.
- Default mode does not resolve or print target service values.
- Default mode does not send a request.
- The structured contract payload uses approved-snapshot, queue lease, idempotency, private manifest, checksum, model policy, and runtime gate fields.
- Raw prompt-shaped fields remain blocked.
- Runtime gates keep provider execution, media processing, public output, Track A execution, and model inference disabled.
- The future execution path requires an explicit runtime gate plus target/audience values supplied only inside a future Cloud Run Job runtime.

## Cost And Runtime Posture

The caller source is CPU-only and intentionally uses standard-library Python only. It includes no Qwen model packages, no model weights, no CUDA image, no GPU packages, and no vLLM dependency. The future Cloud Run Job shape remains one task, zero retries, no GPU, no minimum instances, Direct VPC egress through the dedicated `qwen-private-caller-us-central1` subnet, and no idle GPU.

NVIDIA L4 remains the selected GPU for the separate Qwen worker service. This caller does not change the GPU service, does not increase GPU max scale, and does not keep the GPU service warm.

## Remaining Blockers

- Caller image has not been built.
- Caller image has not been pushed.
- Cloud Run Job caller has not been deployed.
- Caller service account has not been created or changed by this packet.
- Direct VPC egress has not been configured on a caller job.
- No private invoke contract request has been sent from the caller.
- No fail-closed contract response has been observed from the internal caller path.

## Runtime Gates

- `cpuOnlyCallerSourceDefined=true`
- `cpuOnlyCallerImageSourceDefined=true`
- `cpuOnlyCallerImageBuilt=false`
- `cpuOnlyCallerImagePushed=false`
- `cpuOnlyCallerImageDeployed=false`
- `cpuOnlyCallerImageDefined=true`
- `callerHarnessDeployAllowedNow=false`
- `callerHarnessDeployed=false`
- `callerHarnessExecuted=false`
- `directVpcEgressConfigured=false`
- `identityTokenFetched=false`
- `identityTokenPrinted=false`
- `identityTokenValueStored=false`
- `cloudRunInvocationAttempted=false`
- `serviceRuntimeRequestSent=false`
- `modelImportRun=false`
- `modelLoadRun=false`
- `vllmEngineInitialized=false`
- `promptProcessed=false`
- `forwardPassRun=false`
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

`QWEN2_5_VL_STACK_TOOL_55D-PRIVATE-INVOKE-CPU-CALLER-DEPLOY: deploy controlled CPU-only internal caller harness, no inference`
