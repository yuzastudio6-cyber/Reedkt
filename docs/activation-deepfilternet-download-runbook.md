# Phase 36B DeepFilterNet Download Runbook

Phase 36B is the approved DeepFilterNet-only artifact download/load phase. It
may download exactly the selected official DeepFilterNet `v0.5.6` CLI and ONNX
model archive and upload them with checksum/evidence manifests to private
staging GCS.

## Commands

- `npm run activation:deepfilternet-download:plan`
- `npm run activation:deepfilternet-download:report`
- `npm run smoke:activation-deepfilternet-download`

The default commands are static/report-only. Actual execution requires:

```sh
GCP_PROJECT_ID=reeditpro \
GCP_REGION=us-central1 \
REEDITPRO_ENV=staging \
REEDITPRO_CONFIRM_DEEPFILTERNET_ARTIFACT_DOWNLOAD=true \
PROVIDER_EXECUTION_ENABLED=false \
REEDITPRO_PRODUCTION_READY=false \
REEDITPRO_EXTERNAL_BETA_READY=false \
REEDITPRO_BROAD_REAL_MEDIA_READY=false \
npm run activation:deepfilternet-download -- --execute
```

## Selected Artifacts

- `deep-filter-0.5.6-x86_64-unknown-linux-musl`
- `DeepFilterNet3_onnx.tar.gz`

No other DeepFilterNet assets, RNNoise assets, Demucs assets, datasets, demos,
Hugging Face assets, unpinned snapshots, or runtime dependencies are approved by
Phase 36B.

## Private Storage

Target prefix:

`gs://reeditpro-staging-reeditpro-generated-assets/model-weights/audio-ai/deepfilternet/v0.5.6/`

Uploaded objects must be limited to the selected artifacts plus:

- `file_checksums_sha256.txt`
- `model_tree_manifest.json`
- `source_evidence.json`
- `license_evidence.json`
- `download_report.json`

## Exit State

If all downloads, checksums, uploads, and private object verification pass,
Phase 36C may plan generated-audio DeepFilterNet runtime verification only.
DeepFilterNet runtime, real-video audio AI cleanup, production, external beta,
paid production, broad real media, providers, Revideo, FILM, and slow motion
remain blocked.
