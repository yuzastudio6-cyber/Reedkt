# Activation Enhancement Model Download Runbook

Phase 34B downloads exactly one approved model file:

`RealESRGAN_x4plus.pth`

Approved source:

`https://github.com/xinntao/Real-ESRGAN/releases/download/v0.1.0/RealESRGAN_x4plus.pth`

Approved private staging storage:

`gs://reeditpro-staging-reeditpro-generated-assets/model-weights/real-esrgan/x4plus/`

The download must use a temp directory outside the repo, such as:

`/tmp/reeditpro-enhancement-model-download/real-esrgan-x4plus/`

Phase 34B does not load the `.pth` file with torch, run inference, process frames/video, deploy GPU, run providers, download FILM, download alternate Real-ESRGAN weights, or unblock production/beta/broad real media.

Required execution guards:

- `GCP_PROJECT_ID=reeditpro`
- `GCP_REGION=us-central1`
- `REEDITPRO_ENV=staging`
- `REEDITPRO_CONFIRM_ENHANCEMENT_MODEL_DOWNLOAD=true`

After upload, remove local temp model files and retain only private GCS artifacts plus committed checksum/report metadata.
