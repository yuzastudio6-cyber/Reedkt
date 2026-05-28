# Activation Phase 34C Real-ESRGAN Runtime Results

Status: ready

## Scope

- Approved model: `RealESRGAN_x4plus`
- Approved model file: `RealESRGAN_x4plus.pth`
- Source URL: `https://github.com/xinntao/Real-ESRGAN/releases/download/v0.1.0/RealESRGAN_x4plus.pth`
- File SHA-256: `4fa0d38905f75ac06eb49a7951b426670021be3018265fd191d2125df9d682f1`
- Aggregate SHA-256: `5cee93bc531570df59a772293ecae30f89c4519f93478cbb74ddce9f0e9bb4a5`
- Model GCS path: `gs://reeditpro-staging-reeditpro-generated-assets/model-weights/real-esrgan/x4plus/`

## Results

- Run ID: `phase34c-20260528T18511`
- Runtime image: `us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-real-esrgan-runtime:staging-real-esrgan-runtime-001`
- Image digest: `sha256:93a57aaed0586f3c0b599382eafffce60095563e83920a39a8c1c1cbe4d5f3c8`
- Cloud Run job: `reeditpro-staging-real-esrgan-runtime-job`
- Execution ID: `reeditpro-staging-real-esrgan-runtime-job-gwfhg`
- GPU: `nvidia-l4`, count 1, CPU 4, memory 16Gi
- Model sync: copied from private GCS and checksum verified
- Generated fixture: private 128x128 synthetic PNG
- Enhanced output: private 512x512 PNG
- Enhancement QA: warning-only, no blocking failures

## Gates

- productionReadyAllowed=false
- externalBetaAllowed=false
- broadRealUserMediaAllowed=false
- fullVideoEnhancementAllowed=false
- slowMotionAllowed=false
- Phase34D readiness: ready for controlled sample planning only

## Blockers

- None for Phase 34C runtime verification.

## Warnings

- Phase 34C is generated-image runtime verification only.
- Real-video enhancement, full-video enhancement, FILM, slow motion, production, external beta, and broad real media remain blocked.
- Real-ESRGAN package dependencies include GFPGAN/facexlib libraries transitively, but no GFPGAN/facexlib weights were present and face enhancement did not run.
- The generated-assets bucket has a pre-existing non-admin broad `roles/storage.objectCreator` binding for the GPU worker service account; Phase 34C added only conditional read/create bindings and did not add broad storage/admin/public roles.

## Artifacts

- Fixture: `gs://reeditpro-staging-reeditpro-generated-assets/activation-enhancement-runtime/phase34c/phase34c-20260528T18511/fixture/synthetic-input.png`
- Enhanced output: `gs://reeditpro-staging-reeditpro-generated-assets/activation-enhancement-runtime/phase34c/phase34c-20260528T18511/enhanced/enhanced.png`
- Metadata: `gs://reeditpro-staging-reeditpro-generated-assets/activation-enhancement-runtime/phase34c/phase34c-20260528T18511/metadata/enhancement-metadata.json`
- QA: `gs://reeditpro-staging-reeditpro-qa-artifacts/activation-enhancement-runtime/phase34c/phase34c-20260528T18511/qa/enhancement-qa.json`
- Report: `gs://reeditpro-staging-reeditpro-qa-artifacts/activation-enhancement-runtime/phase34c/phase34c-20260528T18511/reports/phase34c-report.json`

## QA Summary

- `enhancement_artifacts`: passed
- `render_asset_integrity`: passed
- `sample_first_policy`: passed
- `runtime_safety`: passed
- QA status: warning because the fixture is synthetic and no real-video quality claim is made.

## Runtime Safety

- providerExecuted=false
- modelDownloadedExternally=false
- realMediaUsed=false
- realVideoFrameUsed=false
- filmUsed=false
- slowMotionExecuted=false
- fullVideoEnhancementExecuted=false
- faceEnhanceRan=false
- gfpganWeightsPresent=false
- facexlibWeightsPresent=false
- alternateRealEsrganWeightsPresent=false
- publicAccessEnabled=false
- secretValuesUsed=false
- rtxPro6000Used=false
- revideoUsed=false

## Validation

- `smoke:activation-real-esrgan-runtime`: passed
- `activation:real-esrgan-runtime:report`: passed
- `activation:enhancement-model-download:report`: passed
- `activation:enhancement-model-approval:report`: passed
- `activation:enhancement-model-weight:summary`: passed
- `prod:readiness:summary`: passed; production readiness remains blocked
- `prod:beta:summary`: passed; external beta and real-user-media beta remain blocked
- `activation:staging:healthcheck:summary -- --project reeditpro --region us-central1`: passed with the existing Phase 24B deployment-log blocker
- `lint`: passed
- `build`: passed with the known large chunk warning
- `build:server`: passed
- `git diff --check`: passed
- `package-lock.json`: unchanged
