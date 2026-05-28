# Phase 33C BiRefNet Runtime Results

Status: completed for generated-image runtime verification.

## Runtime

- Image: `us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-birefnet-runtime:staging-birefnet-runtime-001`
- Image index digest: `sha256:dfcd781b679c97fd40dac4345d1558feabac20ce48f0c5cb457b925a81404051`
- Linux/amd64 image digest used by Cloud Run: `sha256:857febc82bf6434c7006af4f593424f5336f55a728fc86953908e0c9023a716a`
- Cloud Run Job: `reeditpro-staging-birefnet-runtime-job`
- Execution: `reeditpro-staging-birefnet-runtime-job-rvdlk`
- GPU: `nvidia-l4`, count `1`
- CPU/memory: `4 CPU`, `16Gi`
- Parallelism/retries: `1`, max retries `0`
- Service account: `reeditpro-stg-gpu-worker-sa@reeditpro.iam.gserviceaccount.com`

## Model

- Model: `ZhengPeng7/BiRefNet`
- Manifest: `birefnet_main_staging_v1`
- Revision: `e2bf8e4460fc8fa32bba5ea4d94b3233d367b0e4`
- Aggregate SHA-256: `1e4044aa39d94e3f9c07e2e73d7ff78883c4838e90d678bcb8f3fc075db811e7`
- Private GCS path: `gs://reeditpro-staging-reeditpro-generated-assets/model-weights/birefnet/main/`
- Runtime path: `/tmp/reeditpro-model-weights/birefnet/main`
- Model sync: copied from private GCS, verified `file_checksums_sha256.txt`, and matched the Phase 33B aggregate checksum.

## Custom Code Scan

- Scanned files: `BiRefNet_config.py`, `birefnet.py`, `handler.py`
- Executed allowlist: `BiRefNet_config.py`, `birefnet.py`
- Never imported: `handler.py`
- Blockers: none
- Warning: `handler.py` contains network helper code and was intentionally never imported or executed in Phase 33C.

## Generated Fixture

- Input type: generated synthetic image only
- Dimensions: `512x512`
- Fixture artifact: `gs://reeditpro-staging-reeditpro-generated-assets/activation-mask-runtime/phase33c/phase33c-20260528T15394/fixture/synthetic-input.png`
- Real media used: false
- Real video frame used: false

## Mask Output

- Run ID: `phase33c-20260528T15394`
- Status: completed
- Mask artifact: `gs://reeditpro-staging-reeditpro-generated-assets/activation-mask-runtime/phase33c/phase33c-20260528T15394/mask/mask.png`
- RGBA cutout artifact: `gs://reeditpro-staging-reeditpro-generated-assets/activation-mask-runtime/phase33c/phase33c-20260528T15394/mask/cutout.png`
- Mask metadata: `gs://reeditpro-staging-reeditpro-generated-assets/activation-mask-runtime/phase33c/phase33c-20260528T15394/mask/mask-metadata.json`
- Mask dimensions: `512x512`
- Non-zero mask ratio: `0.2535`
- Mean alpha: `0.2487`

## QA Summary

- QA report: `gs://reeditpro-staging-reeditpro-qa-artifacts/activation-mask-runtime/phase33c/phase33c-20260528T15394/qa/mask-qa.json`
- Phase 33C report: `gs://reeditpro-staging-reeditpro-qa-artifacts/activation-mask-runtime/phase33c/phase33c-20260528T15394/reports/phase33c-report.json`
- Overall QA status: warning
- Blockers: none
- `mask_edge_quality`: passed
- `mask_subject_coverage`: passed
- `render_asset_integrity`: passed
- `mask_temporal_stability`: not applicable for a single generated frame

## IAM Notes

Phase 33C added conditional storage bindings for the GPU worker service account:

- `roles/storage.objectViewer` on `reeditpro-staging-reeditpro-generated-assets/model-weights/birefnet/main/`
- `roles/storage.objectCreator` on `reeditpro-staging-reeditpro-generated-assets/activation-mask-runtime/phase33c/`
- `roles/storage.objectCreator` on `reeditpro-staging-reeditpro-qa-artifacts/activation-mask-runtime/phase33c/`
- `roles/storage.objectCreator` on `reeditpro-staging-reeditpro-worker-temp/activation-mask-runtime/phase33c/`

No Phase 33C grant used owner/editor, `storage.admin`, `storage.objectAdmin`,
public principals, provider secrets, or public bucket access. Pre-existing
non-admin staging grants for the GPU worker service account were observed and
recorded as warnings; Phase 33C did not create them.

## Safety Gates

- Runtime Hugging Face/model download: false
- Provider execution: false
- SAM2 used: false
- Real media or real video frame used: false
- Text-behind-subject executed: false
- Secret values used: false
- Public access enabled: false
- RTX PRO 6000 used: false
- Revideo used: false

## Phase33D Readiness

Phase 33D is ready for an explicit controlled real-video mask test proposal
because the BiRefNet runtime loaded the approved private-GCS snapshot, verified
the checksum, generated a synthetic-image mask artifact, and emitted mask QA
with no blocking failures. Text-behind-subject execution remains blocked until
Phase 33D is explicitly approved and passes controlled mask/composition QA.

## Validation

- `smoke:activation-birefnet-runtime`: passed
- `activation:birefnet-runtime:report`: passed; Phase 33D ready is `true`
- `activation:mask-model-download:report`: passed
- `activation:mask-model-approval:report`: passed
- `activation:mask-model-weight:summary`: passed
- `prod:readiness:summary`: passed command execution; production remains blocked
- `prod:beta:summary`: passed command execution; external beta remains blocked
- `activation:staging:healthcheck:summary -- --project reeditpro --region us-central1`: passed command execution with pre-existing Phase 24B deployment-log blocker
- `lint`: passed
- `build`: passed with the existing Vite large chunk warning
- `build:server`: passed
- `build:staging-birefnet-runtime-worker`: passed
- `package-lock.json`: unchanged

## Launch Gates

- `productionReadyAllowed=false`
- `externalBetaAllowed=false`
- `broadRealUserMediaAllowed=false`
- `textBehindSubjectAllowed=false`
