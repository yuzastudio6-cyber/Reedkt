# Phase 33B Mask Model Download Results

Status: completed.

## Model

- Model: `ZhengPeng7/BiRefNet`
- Manifest ID: `birefnet_main_staging_v1`
- Purpose: staging single-frame background-removal runtime preparation
- Resolved revision: `e2bf8e4460fc8fa32bba5ea4d94b3233d367b0e4`
- Aggregate SHA-256: `1e4044aa39d94e3f9c07e2e73d7ff78883c4838e90d678bcb8f3fc075db811e7`
- File count: `9` model snapshot files
- Total model size: `444584498` bytes
- Uploaded object count: `11` objects, including checksum and tree manifest
- Sanitized temp path: `/tmp/reeditpro-mask-model-download/birefnet-main/snapshot`
- Downloaded at: `2026-05-28T14:38:34Z`
- Uploaded at: `2026-05-28T14:40:05Z`

Downloaded snapshot files:

- `.gitattributes`
- `.gitignore`
- `BiRefNet_config.py`
- `README.md`
- `birefnet.py`
- `config.json`
- `handler.py`
- `model.safetensors`
- `requirements.txt`

Temporary Hugging Face cache metadata was removed from the staging GCS model path
before checksum/upload and is not part of the checksum manifest.

## Custom Code Warning

The snapshot includes Python/custom-code files:

- `BiRefNet_config.py`
- `birefnet.py`
- `handler.py`

Phase 33B records and stores these files as part of the approved snapshot, but
does not execute them. Phase 33C must explicitly review runtime loading behavior
before any inference.

## Private Staging Storage

- Model prefix: `gs://reeditpro-staging-reeditpro-generated-assets/model-weights/birefnet/main/`
- Checksum manifest: `gs://reeditpro-staging-reeditpro-generated-assets/model-weights/birefnet/main/file_checksums_sha256.txt`
- Tree manifest: `gs://reeditpro-staging-reeditpro-generated-assets/model-weights/birefnet/main/model_tree_manifest.json`
- Source-media bucket used: no
- Public bucket/object access: no public principals found in bucket IAM
- Signed URL source of truth: no

`gcloud storage` emitted a parallel composite upload warning for the large
`model.safetensors` object. ReeditPro retains SHA-256 checksum manifests as the
model evidence source of truth.

## Blocked

- SAM2 download/execution
- mask execution
- text-behind-subject
- GPU deploy/job
- providers
- production/external beta/broad real media

## Readiness

- Phase 33C: ready for runtime verification planning only
- Phase 33D: blocked until Phase 33C runtime verification and mask QA pass

## Launch Gates

- `productionReadyAllowed=false`
- `externalBetaAllowed=false`
- `broadRealUserMediaAllowed=false`
- GPU deploy/job: blocked
- Provider execution: blocked
- Mask execution: blocked
- Text-behind-subject execution: blocked
- Model files in git: not committed
