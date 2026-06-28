# AI Graphics External-Beta Native GPU Proof Cloud Run Job Scaffold

Decision: `ai_graphics_external_beta_native_gpu_proof_cloud_run_job_scaffold_prepared_local_only`.

This packet prepares the external-beta on-demand GPU proof path for the 8 model/GPU AI graphics tools. It generates local Cloud Run Job operator files only. It does not deploy Cloud Run, execute a job, start GPU runtime, download model weights, load models, run inference, process media, mutate Supabase/GCS, create signed URLs, create public artifacts, or unlock external beta/production.

## Command

```sh
npm run --silent ai-graphics:external-beta-native-gpu-proof-cloud-run-job-scaffold -- \
  --source-operator-handoff-packet docs/tool-intelligence/ai-graphics/external-beta-native-gpu-proof-operator-handoff.json \
  --private-model-weight-delivery-mode prebaked_private_image_layer \
  --out-dir .local-artifacts/ai-graphics/cloud-run-native-gpu-proof
```

## Generated Files

- `cloud-run-native-gpu-proof-job-plan.json`
- `deploy-cloud-run-native-gpu-proof-job.sh`
- `execute-cloud-run-native-gpu-proof-job.sh`
- `cloud-run-native-gpu-proof-operator-checklist.md`

## Runtime Target

- Platform: Google Cloud Run Jobs.
- GPU: one `nvidia-l4` GPU.
- CPU/memory: `4` CPU and `16Gi` memory.
- Job shape: `tasks=1`, `parallelism=1`, `max-retries=0`.
- Runtime model: on-demand proof job only, never an idle GPU service.

The generated deploy/execute scripts refuse to run unless `REEDITPRO_AI_GRAPHICS_CLOUD_RUN_GPU_PROOF_CONFIRM=deploy-or-run-on-demand-l4-proof-job` is set by an operator in the private proof environment.

## Covered Tools

- `torch_torchvision`
- `transformers`
- `sam2`
- `birefnet`
- `real_esrgan`
- `kornia`
- `rembg`
- `transparent_background`

The generated execute script runs one Cloud Run Job execution per native proof profile:

- `gpu_worker_ai_graphics`
- `sam2`
- `birefnet`
- `real_esrgan`
- `rembg`
- `transparent_background`

After the job writes profile logs, the next local-only step is:

```sh
npm run --silent ai-graphics:external-beta-native-gpu-proof-cloud-run-result-collector -- \
  --source-cloud-run-job-scaffold-packet docs/tool-intelligence/ai-graphics/external-beta-native-gpu-proof-cloud-run-job-scaffold.json \
  --logs-dir .local-artifacts/ai-graphics/cloud-run-native-gpu-proof/profile-results \
  --out-dir .local-artifacts/ai-graphics/gpu-runtime-proof-results/cloud-run-extracted-profile-results
```

## Private Model Policy

Model-weight delivery must use a reviewed private image layer or an approved private runtime mount. Raw `gs://`, raw `gcs://`, `http://`, `https://`, `signed-url://`, and `public://` references are not accepted as committed proof evidence.

## Current State

This scaffold improves the external beta proof path by making the on-demand Cloud Run L4 job plan deterministic. It still does not make any tool external-beta-ready by itself.

- Private checksum evidence: `0/5`
- Reviewed private model manifests: `0/5`
- Native GPU proof profiles: `0/6`
- External beta ready now: `0/21`
- Production ready now: `0/21`

GPU remains off now. It starts only when a future operator executes the guarded proof job, and that proof still keeps tool execution, provider calls, media processing, storage mutation, signed URLs, public artifacts, beta, and production disabled.
