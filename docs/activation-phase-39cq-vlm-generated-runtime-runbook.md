# Phase 39C-Q VLM Generated Runtime Runbook

Phase 39C-Q runs only after a Phase 39B-Q candidate has been downloaded, checksummed, uploaded to private GCS, and verified.

Runtime confirmations:

```bash
export REEDITPRO_CONFIRM_VLM_PRIVATE_GCS_READ=true
export REEDITPRO_CONFIRM_VLM_RUNTIME_EXECUTE=true
export REEDITPRO_CONFIRM_VLM_RUNTIME_ARTIFACT_UPLOAD=true
export REEDITPRO_CONFIRM_VLM_RUNTIME_DOCKER_BUILD=true
export REEDITPRO_CONFIRM_VLM_RUNTIME_DOCKER_PUSH=true
export REEDITPRO_CONFIRM_VLM_STAGING_CLOUD_RUN_JOB=true
export REEDITPRO_CONFIRM_VLM_L4_GPU_EXECUTE=true
```

Staging job:

- Job: `reeditpro-stg-vlm-runtime-phase39c-l4-compatible`
- Region: `us-central1`
- Service account: `reeditpro-stg-gpu-worker-sa@reeditpro.iam.gserviceaccount.com`
- GPU: `1 x nvidia-l4`
- CPU: `8`
- Memory: `32Gi`
- Endpoint: none; Cloud Run Job only

The worker receives an exact asset manifest in `REEDITPRO_VLM_EXPECTED_ASSETS_JSON`, copies each private GCS object by exact path, verifies per-file and aggregate SHA-256, prepares a local model directory, sets offline/cache guards, and starts vLLM using the local model path only.

Required generated fixtures:

- `generated-object-layout`
- `generated-ui-safe-zone`
- `generated-ocr-vlm-comparison`
- `generated-ambiguous-scene`
- `generated-spatial-reasoning`

Phase 39C-Q passes only if generated fixture inference, structured JSON validation, object-region QA, safe-zone QA, hallucination/safety QA, and private artifact upload all pass.
