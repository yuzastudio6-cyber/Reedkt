# Qwen2.5-VL 7B Cloud Run GPU Fail-closed Image Build Result

## Status

Decision: `qwen2_5_vl_7b_cloud_run_gpu_fail_closed_image_build_succeeded_no_deploy_no_inference`

This packet records the bounded Cloud Build image build and Artifact Registry push for the fail-closed Qwen2.5-VL 7B Cloud Run GPU worker image. It does not deploy Cloud Run, create a Cloud Run service or job, create a Cloud Run volume mount, start a GPU instance, import Qwen, load Qwen, run inference, call providers, dispatch workers, touch Supabase, execute SQL, mutate credits, unlock beta, unlock production, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

## Source Inputs

- `docs/qwen2-5-vl-7b-cloud-run-gpu-no-deploy-mount-spec.md`
- `docs/qwen2-5-vl-7b-cloud-run-gpu-private-cache-mount-verify.md`
- `docs/qwen2-5-vl-7b-storage-transfer-url-list-result.md`
- `docs/qwen2-5-vl-7b-cloud-run-gpu-dockerfile-source-spec.md`
- `docker/prod/qwen2-5-vl-cloud-run-gpu/Dockerfile`
- `docker/prod/qwen2-5-vl-cloud-run-gpu/requirements.qwen2-5-vl.txt`
- `server/workers/qwen2_5_vl_cloud_run_gpu/service.py`
- `cloudbuild/qwen2-5-vl-cloud-run-gpu-fail-closed.yaml`
- `cloudbuild/qwen2-5-vl-cloud-run-gpu-fail-closed.gcloudignore`

## Build Attempt Summary

| Area | Value |
| --- | --- |
| First build ID | `44b88195-e498-4737-93dd-d9fc04367cd7` |
| First build status | `FAILURE` |
| First blocker | vLLM `0.11.0` required Torch `2.8.0`; bundled SGLang `0.4.10.post2` required Torch `2.7.1` |
| Corrective action | Qwen Cloud Run image changed to vLLM-focused; SGLang remains a separate existing runtime lane |
| Retry build ID | `8626edb5-1275-4fbe-b56f-332b8087037c` |
| Retry build status | `SUCCESS` |
| Retry build duration | `16M35S` |
| Source bundle | `7` files, `7.2 KiB` before compression |
| Docker context | `17.41 KiB` |

The initial failure is preserved because it proved the Qwen-specific Cloud Run image should not duplicate the existing SGLang lane. The corrected image keeps the runtime responsibility narrow: vLLM-focused Qwen fail-closed worker image only.

## Image Result

| Area | Value |
| --- | --- |
| Artifact Registry package | `us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/qwen2-5-vl-7b-cloud-run-gpu` |
| Image tag | `fail-closed-vllm-fc1f95fb-20260627t000018z` |
| Image digest | `sha256:572acc29405cee48a42baf98f39d949915b8ef14df638736b886673efc47b630` |
| Fully qualified digest | `us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/qwen2-5-vl-7b-cloud-run-gpu@sha256:572acc29405cee48a42baf98f39d949915b8ef14df638736b886673efc47b630` |
| Image size | `8395344201` bytes (`7.82 GiB`) |
| Manifest media type | `application/vnd.docker.distribution.manifest.v2+json` |
| Model weights in image | false |
| Service wrapper in image | true |
| Fail-closed env defaults in image | true |

## Dependency Decision

| Area | Value |
| --- | --- |
| Runtime dependency scope | vLLM-focused Qwen image |
| vLLM | `0.11.0` |
| Transformers | `4.57.1` |
| Qwen VL utils | `0.0.11` |
| SGLang bundled into Qwen image | false |
| SGLang lane status | separate existing runtime lane |
| Runtime dependency install at request time | false |
| Model hub download path | disabled |

## Runtime Gates

- `dockerBuildRun=true`
- `dockerPushRun=true`
- `artifactRegistryImageCreated=true`
- `cloudRunDeployCommandExecuted=false`
- `cloudRunServiceCreated=false`
- `cloudRunJobCreated=false`
- `cloudRunVolumeMountCreated=false`
- `gpuServiceStarted=false`
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

## Scale-to-zero Carry-forward

The next Cloud Run service shape remains `minInstances=0`, `maxInstances=1`, `concurrency=1`, L4 GPU, backend-only invocation, and private model-cache mount only. This image build does not create that service. When a future approved deploy happens with `minInstances=0`, the GPU should not remain running when idle.

## Next Prompt

`QWEN2_5_VL_STACK_TOOL_24-CLOUD-RUN-GPU-FAIL-CLOSED-DEPLOY: deploy fail-closed Cloud Run GPU service with private cache mount, no model import/no inference`
