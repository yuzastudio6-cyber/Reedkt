# Qwen2.5-VL 7B Cloud Run GPU No-deploy Mount Spec

## Status

Decision: `qwen2_5_vl_7b_cloud_run_gpu_no_deploy_mount_spec_ready_for_fail_closed_image_build`

This packet authors the concrete future Cloud Run service revision mount shape for the completed private Qwen2.5-VL 7B model cache. It converts the verified private cache and prefix-scoped IAM evidence into a no-deploy command/spec shape while keeping every runtime and mutation gate closed.

This packet does not deploy Cloud Run, create or update a Cloud Run service, create a Cloud Run job, create or update a Cloud Run volume mount, build Docker, push Docker, create Artifact Registry images, create VMs, create reservations, import Qwen on GPU, load model weights into a runtime, run inference, start an API server, call providers, dispatch workers, touch Supabase, execute SQL, mutate credits, unlock beta, unlock production, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

No GPU instance or Cloud Run GPU service is running from this packet.

## Source Evidence

- `docs/qwen2-5-vl-7b-cloud-run-gpu-private-cache-mount-verify.md`
- `src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-private-cache-mount-verify.ts`
- `docs/qwen2-5-vl-7b-storage-transfer-url-list-result.md`
- `docs/qwen2-5-vl-7b-cloud-run-gpu-no-deploy-service-spec.md`
- `docs/qwen2-5-vl-7b-cloud-run-gpu-dockerfile-source-spec.md`
- `docker/prod/qwen2-5-vl-cloud-run-gpu/Dockerfile`
- `server/workers/qwen2_5_vl_cloud_run_gpu/service.py`
- Cloud Run Cloud Storage volume mounts: `https://docs.cloud.google.com/run/docs/configuring/services/cloud-storage-volume-mounts`
- Cloud Storage FUSE `only-dir` mount option: `https://docs.cloud.google.com/storage/docs/cloud-storage-fuse/mount-bucket`

## Verified Inputs

| Area | Value |
| --- | --- |
| Project | `reeditpro` |
| Region | `us-central1` |
| Service name | `reeditpro-qwen2-5-vl-l4-worker` |
| Runtime identity | `reeditpro-stg-gpu-worker-sa@reeditpro.iam.gserviceaccount.com` |
| Bucket | `reeditpro-staging-reeditpro-generated-assets` |
| Bucket location | `US-CENTRAL1` |
| Model prefix | `model-weights/vlm/qwen2.5-vl-7b-instruct/cc594898137f460bfe9f0759e9844b3ce807cfb5/` |
| Object count | `16` |
| Total bytes | `16595981281` |
| Expected aggregate SHA-256 | `46f05ffcc6127a4caa9a3e8c11ddf298b9a5263c8680afe6b5d017ea91702c8b` |
| Prefix-scoped read binding present | true |
| IAM condition title | `qwen25vl_model_read` |
| Runtime data-plane read proof | still required at deploy/proof time |

## Mount Decision

| Area | Decision |
| --- | --- |
| Volume name | `qwen-model-cache` |
| Volume type | `cloud-storage` |
| Bucket mounted | `reeditpro-staging-reeditpro-generated-assets` |
| Prefix strategy | mount only the approved Qwen2.5-VL revision prefix |
| Mount option | `only-dir=model-weights/vlm/qwen2.5-vl-7b-instruct/cc594898137f460bfe9f0759e9844b3ce807cfb5/` |
| Directory visibility option | `implicit-dirs` |
| Mount path | `/models/qwen2.5-vl-7b-instruct` |
| Read-only | true |
| Model files visible at mount root | expected |
| Request-time model download fallback | false |
| Signed URL source fallback | false |
| Public model source fallback | false |
| Model baked into image | false |
| Cloud Run mount created now | false |

The `only-dir` option is required so the future container sees the model files directly at `/models/qwen2.5-vl-7b-instruct` instead of seeing the whole bucket tree. The runtime identity remains limited by the existing prefix-scoped `roles/storage.objectViewer` binding.

## Future Command Shape

The future deploy or revision command must remain non-executable until a later approved build/deploy prompt. The intended command shape is:

```text
gcloud run deploy reeditpro-qwen2-5-vl-l4-worker
  --project=reeditpro
  --region=us-central1
  --image=APPROVED_FUTURE_QWEN_IMAGE_PLACEHOLDER
  --service-account=reeditpro-stg-gpu-worker-sa@reeditpro.iam.gserviceaccount.com
  --gpu=1
  --gpu-type=nvidia-l4
  --cpu=8
  --memory=32Gi
  --min-instances=0
  --max-instances=1
  --concurrency=1
  --timeout=900
  --no-allow-unauthenticated
  --ingress=internal-and-cloud-load-balancing
  --execution-environment=gen2
  --no-gpu-zonal-redundancy
  '--add-volume=name=qwen-model-cache,type=cloud-storage,bucket=reeditpro-staging-reeditpro-generated-assets,readonly=true,mount-options=only-dir=model-weights/vlm/qwen2.5-vl-7b-instruct/cc594898137f460bfe9f0759e9844b3ce807cfb5/;implicit-dirs'
  --add-volume-mount=volume=qwen-model-cache,mount-path=/models/qwen2.5-vl-7b-instruct
  --set-env-vars=HF_HUB_OFFLINE=1,TRANSFORMERS_OFFLINE=1,HF_HUB_DISABLE_TELEMETRY=1,MODEL_DOWNLOADS_ENABLED=false,RAW_VLM_PROMPT_ENABLED=false,PROVIDER_EXECUTION_ENABLED=false,MEDIA_PROCESSING_ENABLED=false,REAL_MEDIA_INPUT_ENABLED=false,ARBITRARY_MEDIA_INPUT_ENABLED=false,PUBLIC_OUTPUT_ENABLED=false,TRACK_A_EXECUTION_ENABLED=false,QWEN_APPROVED_SNAPSHOT_REQUIRED=true,QWEN_QUEUE_LEASE_REQUIRED=true,QWEN_MODEL_IMPORT_ON_STARTUP=false,QWEN_INFERENCE_ENABLED=false,QWEN_MODEL_CACHE_MOUNT=/models/qwen2.5-vl-7b-instruct,QWEN_MODEL_REVISION=cc594898137f460bfe9f0759e9844b3ce807cfb5,QWEN_MODEL_AGGREGATE_SHA256=46f05ffcc6127a4caa9a3e8c11ddf298b9a5263c8680afe6b5d017ea91702c8b
```

The command above is a shape only. It must not be run from this packet.

## Future Revision YAML Shape

If the team chooses YAML instead of command flags, the no-deploy shape must preserve these fields:

```yaml
spec:
  template:
    metadata:
      annotations:
        run.googleapis.com/execution-environment: gen2
        run.googleapis.com/gpu-zonal-redundancy-disabled: "true"
    spec:
      serviceAccountName: reeditpro-stg-gpu-worker-sa@reeditpro.iam.gserviceaccount.com
      containerConcurrency: 1
      timeoutSeconds: 900
      containers:
        - image: APPROVED_FUTURE_QWEN_IMAGE_PLACEHOLDER
          resources:
            limits:
              cpu: "8"
              memory: 32Gi
              nvidia.com/gpu: "1"
          volumeMounts:
            - name: qwen-model-cache
              mountPath: /models/qwen2.5-vl-7b-instruct
      volumes:
        - name: qwen-model-cache
          csi:
            driver: gcsfuse.run.googleapis.com
            readOnly: true
            volumeAttributes:
              bucketName: reeditpro-staging-reeditpro-generated-assets
              mountOptions: only-dir=model-weights/vlm/qwen2.5-vl-7b-instruct/cc594898137f460bfe9f0759e9844b3ce807cfb5/;implicit-dirs
```

The YAML above is a shape only. It must not be applied from this packet.

## Fail-closed Environment

| Name | Required value |
| --- | --- |
| `HF_HUB_OFFLINE` | `1` |
| `TRANSFORMERS_OFFLINE` | `1` |
| `HF_HUB_DISABLE_TELEMETRY` | `1` |
| `MODEL_DOWNLOADS_ENABLED` | `false` |
| `RAW_VLM_PROMPT_ENABLED` | `false` |
| `PROVIDER_EXECUTION_ENABLED` | `false` |
| `MEDIA_PROCESSING_ENABLED` | `false` |
| `REAL_MEDIA_INPUT_ENABLED` | `false` |
| `ARBITRARY_MEDIA_INPUT_ENABLED` | `false` |
| `PUBLIC_OUTPUT_ENABLED` | `false` |
| `TRACK_A_EXECUTION_ENABLED` | `false` |
| `QWEN_APPROVED_SNAPSHOT_REQUIRED` | `true` |
| `QWEN_QUEUE_LEASE_REQUIRED` | `true` |
| `QWEN_MODEL_IMPORT_ON_STARTUP` | `false` |
| `QWEN_INFERENCE_ENABLED` | `false` |
| `QWEN_MODEL_CACHE_MOUNT` | `/models/qwen2.5-vl-7b-instruct` |
| `QWEN_MODEL_REVISION` | `cc594898137f460bfe9f0759e9844b3ce807cfb5` |
| `QWEN_MODEL_AGGREGATE_SHA256` | `46f05ffcc6127a4caa9a3e8c11ddf298b9a5263c8680afe6b5d017ea91702c8b` |

No API keys, service-role keys, database URLs, provider credentials, model tokens, signed URL tokens, raw prompts, or secret values may be placed in environment variables.

## Startup Verification Requirements For Future Deploy Proof

A later approved deploy/proof prompt must verify:

- the service starts with `minInstances=0` and no public unauthenticated access;
- the runtime identity can read `config.json` and all expected model files through the mount;
- the mount root contains `config.json`, tokenizer files, and five safetensor shards directly;
- the expected object count is `16`;
- the expected byte total is `16595981281`;
- the aggregate SHA-256 check passes before model import;
- health checks do not import or load the full model;
- POST requests remain rejected while inference is disabled;
- no request-time model download occurs;
- no signed URL, public URL, provider call, worker dispatch, Supabase mutation, SQL execution, credit mutation, generated asset, beta unlock, or production unlock occurs.

## Cost And GPU Carry-forward

The selected runtime remains Cloud Run GPU with one NVIDIA L4, `minInstances=0`, `maxInstances=1`, `concurrency=1`, `8` CPU, and `32Gi` memory. With `minInstances=0`, the future service is intended to scale to zero when idle rather than keeping a GPU running while unused. This packet does not start a GPU instance.

## Runtime Gates

- `noDeployMountSpecCreated=true`
- `mountUsesCompletedPrivateCache=true`
- `mountUsesOnlyDir=true`
- `mountReadOnly=true`
- `runtimeIdentitySelected=true`
- `prefixScopedReadIamBindingRequired=true`
- `prefixScopedReadIamBindingPresent=true`
- `futureRuntimeReadProofRequired=true`
- `cloudRunVolumeMountCreated=false`
- `cloudRunDeployCommandExecuted=false`
- `cloudRunServiceCreated=false`
- `cloudRunJobCreated=false`
- `artifactRegistryImageCreated=false`
- `reservationCreated=false`
- `vmCreated=false`
- `dockerBuildRun=false`
- `dockerPushRun=false`
- `dependencyInstallRun=false`
- `modelImportRun=false`
- `modelLoadRun=false`
- `modelInferenceRun=false`
- `apiServerStarted=false`
- `providerCallsMade=false`
- `workersDispatched=false`
- `supabaseTouched=false`
- `sqlExecuted=false`
- `publicArtifactsCreated=false`
- `signedUrlsCreated=false`
- `creditMutationCreated=false`
- `betaUnlocked=false`
- `productionUnlocked=false`
- `dryRunPassedClaimed=false`
- `generatedLocalFixturePassedClaimed=false`

## Remaining Blockers Before Deploy

- No approved Artifact Registry image exists for the Qwen Cloud Run worker.
- No Cloud Run service has been deployed.
- No runtime-side mount read proof has run.
- No Cloud Storage FUSE model-load compatibility proof has run.
- No startup local-copy fallback has been executed.
- No vLLM or SGLang runtime has loaded Qwen on Cloud Run.
- No model inference proof is approved.
- No worker queue dispatch, approved snapshot execution, QA row, or credit gate has been used.

## Next Prompt

`QWEN2_5_VL_STACK_TOOL_23-CLOUD-RUN-GPU-FAIL-CLOSED-IMAGE-BUILD: build and push the fail-closed Qwen Cloud Run image, no deploy/no inference`
