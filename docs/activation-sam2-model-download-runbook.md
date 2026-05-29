# Phase 35B SAM2 Model Download Runbook

Phase 35B downloads and stores exactly one approved SAM2 checkpoint/config pair
for later generated/synthetic runtime verification.

## Approved Files

- Checkpoint: `sam2.1_hiera_tiny.pt`
- Config: `sam2.1_hiera_t.yaml`
- Checkpoint source: `https://dl.fbaipublicfiles.com/segment_anything_2/092824/sam2.1_hiera_tiny.pt`
- Config source: `https://raw.githubusercontent.com/facebookresearch/sam2/main/sam2/configs/sam2.1/sam2.1_hiera_t.yaml`
- License: Apache-2.0, based on official `facebookresearch/sam2` source evidence.

## Private Storage Target

`gs://reeditpro-staging-reeditpro-generated-assets/model-weights/sam2/sam2.1-hiera-tiny/`

Only these objects are allowed:

- `sam2.1_hiera_tiny.pt`
- `sam2.1_hiera_t.yaml`
- `file_checksums_sha256.txt`
- `model_tree_manifest.json`
- `source_evidence.json`

## Required Guards

- `GCP_PROJECT_ID=reeditpro`
- `GCP_REGION=us-central1`
- `REEDITPRO_ENV=staging`
- `REEDITPRO_CONFIRM_SAM2_MODEL_DOWNLOAD=true`

## Still Blocked

Phase 35B does not run SAM2, run GPU jobs, process media, deploy Cloud Run,
build/push Docker images, call providers, create public URLs, or enable
production/beta/broad real media.
