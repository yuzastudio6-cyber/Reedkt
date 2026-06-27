# Qwen2.5-VL 7B Private Invoke CPU Caller Deploy Result

Decision: `qwen2_5_vl_private_invoke_cpu_caller_deployed_no_execution_no_inference`.

Mode: `qwen2_5_vl_private_invoke_cpu_caller_deploy_result`.

This packet records the controlled Google Cloud deployment of the CPU-only internal caller harness for the future Qwen2.5-VL private-invoke contract path. It built and pushed the caller image, created a dedicated caller service account, granted that caller service account narrow service-level invoker permission on the Qwen GPU worker, and deployed a Cloud Run Job configured for Direct VPC egress through the dedicated private subnet. It did not execute the job, fetch an identity token, call Cloud Run, run inference, dispatch workers, mutate Supabase, execute SQL, create generated assets, create signed URLs, mutate credits, unlock beta, or unlock production.

## Deployed Caller

- job name: `reeditpro-qwen2-5-vl-private-caller`
- project: `reeditpro`
- region: `us-central1`
- image package: `qwen2-5-vl-private-invoke-cpu-caller`
- image tag: `20260627-8983a7a3`
- image digest: `sha256:8339d107266d86a4563173fbc0d7f6a8b146b873997331599c1639e95b26a1dc`
- service account: `qwen-private-caller-sa@reeditpro.iam.gserviceaccount.com`
- target service invoker binding: service-level `roles/run.invoker`
- CPU: `1`
- memory: `512Mi`
- tasks: `1`
- max retries: `0`
- timeout: `60s`
- Direct VPC network: `default`
- Direct VPC subnet: `qwen-private-caller-us-central1`
- VPC egress: `all-traffic`
- execution label: `disabled`
- inference label: `disabled`

## Image Build

- build id: `f2423861-afcf-45b8-9238-8320d17df9f5`
- build context: temporary caller-only context
- uploaded context size before compression: `11.7 KiB`
- source file count: `5`
- image build status: `SUCCESS`
- image push status: `SUCCESS`

The build context contained only the caller Dockerfile and CPU caller source files. It did not include model weights, generated media, environment files, secrets, local caches, or full repository artifacts.

## Runtime Configuration

The deployed job keeps these environment gates disabled:

- `QWEN_CPU_CALLER_EXECUTION_ENABLED=false`
- `QWEN_MODEL_IMPORT_ON_STARTUP=false`
- `QWEN_INFERENCE_ENABLED=false`
- `RAW_VLM_PROMPT_ENABLED=false`
- `PROVIDER_EXECUTION_ENABLED=false`
- `MEDIA_PROCESSING_ENABLED=false`
- `PUBLIC_OUTPUT_ENABLED=false`
- `TRACK_A_EXECUTION_ENABLED=false`

The job does not store a target service URL or audience in repository evidence. Future contract-smoke execution must provide runtime-only target/audience values without printing or storing token values.

## Verification Result

- job Ready condition: `true`
- job executions listed after deploy: none
- default subnet changed: `false`
- dedicated subnet Private Google Access: `true`
- Cloud Run Job executed by this packet: `false`
- identity token fetched by this packet: `false`
- service runtime request sent by this packet: `false`
- inference run: `false`

## Runtime Gates

- `cpuOnlyCallerDeployResultRecorded=true`
- `gcpImageBuildOccurred=true`
- `cpuOnlyCallerImageBuilt=true`
- `cpuOnlyCallerImagePushed=true`
- `serviceAccountCreated=true`
- `targetServiceInvokerIamChanged=true`
- `cpuOnlyCallerJobDeployed=true`
- `callerHarnessDeployed=true`
- `callerHarnessReady=true`
- `tasks=1`
- `maxRetries=0`
- `gpuRequired=false`
- `directVpcEgressConfigured=true`
- `dedicatedCallerSubnetPrivateGoogleAccess=true`
- `defaultSubnetChanged=false`
- `callerHarnessExecuted=false`
- `jobExecutionCount=0`
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

## Remaining Blocker

The controlled CPU-only caller job exists and is ready, but it has not yet been executed. The next gate is one controlled private-invoke contract smoke from this caller with inference still disabled, no model import, no generated assets, no public artifacts, no signed URLs, no Supabase mutation, and no beta or production unlock.

## Next Prompt

`QWEN2_5_VL_STACK_TOOL_55E-PRIVATE-INVOKE-CPU-CALLER-CONTRACT-SMOKE: execute one controlled CPU-only caller contract smoke, no inference`
