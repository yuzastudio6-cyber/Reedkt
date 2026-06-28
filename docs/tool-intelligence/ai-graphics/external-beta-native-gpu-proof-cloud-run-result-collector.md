# AI Graphics External-Beta Native GPU Proof Cloud Run Result Collector

Decision: `ai_graphics_external_beta_native_gpu_proof_cloud_run_result_collector_prepared_local_only`.

This packet prepares the local collector that turns already-saved Cloud Run native GPU proof logs into JSON files accepted by `ai-graphics:gpu-runtime-proof-result:validate`. It does not deploy Cloud Run, execute jobs, start GPU runtime, download model weights, load models, run inference, process media, mutate Supabase/GCS, create signed URLs, create public artifacts, or unlock external beta/production.

## Command

```sh
npm run --silent ai-graphics:external-beta-native-gpu-proof-cloud-run-result-collector -- \
  --source-cloud-run-job-scaffold-packet docs/tool-intelligence/ai-graphics/external-beta-native-gpu-proof-cloud-run-job-scaffold.json \
  --logs-dir .local-artifacts/ai-graphics/cloud-run-native-gpu-proof/profile-results \
  --out-dir .local-artifacts/ai-graphics/gpu-runtime-proof-results/cloud-run-extracted-profile-results
```

Then validate the extracted profile JSON:

```sh
npm run --silent ai-graphics:gpu-runtime-proof-result:validate -- \
  --result-dir .local-artifacts/ai-graphics/gpu-runtime-proof-results/cloud-run-extracted-profile-results \
  > .local-artifacts/ai-graphics/gpu-runtime-proof-results/gpu-runtime-proof-result-packet.json
```

## Expected Logs

The collector expects one log file per native GPU proof profile:

- `native-gpu-profile-gpu_worker_ai_graphics-logs.txt`
- `native-gpu-profile-sam2-logs.txt`
- `native-gpu-profile-birefnet-logs.txt`
- `native-gpu-profile-real_esrgan-logs.txt`
- `native-gpu-profile-rembg-logs.txt`
- `native-gpu-profile-transparent_background-logs.txt`

Each log must contain exactly one approved `reeditpro_ai_graphics_gpu_runtime_readiness` JSON record for the matching profile.

## Covered Tools

- `torch_torchvision`
- `transformers`
- `sam2`
- `birefnet`
- `real_esrgan`
- `kornia`
- `rembg`
- `transparent_background`

## Boundary

This collector only parses local logs and writes local extracted JSON under `.local-artifacts/ai-graphics/`. It performs no cloud, GPU, model, provider, worker, route, media, storage, public artifact, signed URL, beta, or production action.

Current state remains:

- Native GPU proof profiles accepted now: `0/6`
- External beta ready now: `0/21`
- Production ready now: `0/21`
