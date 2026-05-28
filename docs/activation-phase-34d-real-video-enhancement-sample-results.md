# Activation Phase 34D Real Video Enhancement Sample Results

Status: ready

## Scope

- Source Phase 33D run: `phase33d-20260528T161056`
- Source frame: `gs://reeditpro-staging-reeditpro-generated-assets/activation-real-video/phase33d/phase33d-20260528T161056/representative-frame/frame.png`
- Model: `RealESRGAN_x4plus`
- Model manifest: `real_esrgan_x4plus_staging_v1`
- Model file SHA-256: `4fa0d38905f75ac06eb49a7951b426670021be3018265fd191d2125df9d682f1`
- Aggregate SHA-256: `5cee93bc531570df59a772293ecae30f89c4519f93478cbb74ddce9f0e9bb4a5`

## Results

- Run ID: `phase34d-20260528T20300`
- Real-ESRGAN runtime image: `us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-real-esrgan-runtime:staging-real-esrgan-sample-001`
- Pinned linux/amd64 digest: `sha256:80a032a299a3b4c5b8a6e2f3622668a22ab651d568c29d31aa9c884b04b231e2`
- Real-ESRGAN job execution ID: `reeditpro-staging-real-esrgan-runtime-job-lpp7v`
- GPU: `nvidia-l4`, count 1, CPU 4, memory 16Gi
- Source frame dimensions: `2160x3840`
- Sample crop: `512x512` at `x=824`, `y=1664`
- Enhanced sample: private `2048x2048` PNG
- QA summary: warning-only, no blocking failures

## Gates

- productionReadyAllowed=false
- externalBetaAllowed=false
- broadRealUserMediaAllowed=false
- fullVideoEnhancementAllowed=false
- slowMotionAllowed=false
- Phase34E readiness: ready for next controlled enhancement planning only

## Blockers

- None for Phase 34D bounded sample execution.

## Warnings

- Phase 34D is one bounded enhancement sample only.
- Full-frame enhancement, full-video enhancement, FILM, slow motion, public delivery, Revideo, production, external beta, and broad real media remain blocked.
- Hallucination/detail improvement, oversharpening, and texture artifact risks are warning-only until human before/after review.
- Real-ESRGAN package dependencies may include GFPGAN/facexlib libraries, but no GFPGAN/facexlib weights were present and face enhancement did not run.

## Artifacts

- Input sample: `gs://reeditpro-staging-reeditpro-generated-assets/activation-real-video/phase34d/phase34d-20260528T20300/sample/input-sample.png`
- Enhanced sample: `gs://reeditpro-staging-reeditpro-generated-assets/activation-real-video/phase34d/phase34d-20260528T20300/enhanced/enhanced-sample.png`
- Before/after metadata: `gs://reeditpro-staging-reeditpro-generated-assets/activation-real-video/phase34d/phase34d-20260528T20300/metadata/before-after-metadata.json`
- QA: `gs://reeditpro-staging-reeditpro-qa-artifacts/activation-real-video/phase34d/phase34d-20260528T20300/qa/enhancement-sample-qa.json`
- Report: `gs://reeditpro-staging-reeditpro-qa-artifacts/activation-real-video/phase34d/phase34d-20260528T20300/reports/phase34d-report.json`

## QA Summary

- `enhancement_artifacts`: passed
- `render_asset_integrity`: passed
- `sample_first_policy`: passed
- `hallucination_risk`: warning-only
- `oversharpening_risk`: warning-only
- `texture_artifact_risk`: warning-only
- `runtime_safety`: passed

## Runtime Safety

- approvedPhase33DFrameOnly=true
- exactlyOneBoundedSample=true
- fullFrameEnhanced=false
- fullVideoEnhancementExecuted=false
- secondFrameOrVideoUsed=false
- filmUsed=false
- slowMotionExecuted=false
- faceEnhanceRan=false
- gfpganWeightsPresent=false
- facexlibWeightsPresent=false
- alternateRealEsrganWeightsPresent=false
- providerExecuted=false
- modelDownloadedExternally=false
- publicAccessEnabled=false
- secretValuesUsed=false
- rtxPro6000Used=false
- revideoUsed=false

## Validation

- `smoke:activation-real-video-enhancement-sample`: passed
- `activation:real-video:enhancement-sample:report`: passed
- `activation:real-esrgan-runtime:report`: passed
- `activation:enhancement-model-download:report`: passed
- `activation:enhancement-model-approval:report`: passed
- `activation:enhancement-model-weight:summary`: passed
- `activation:real-video:color-correction:report`: passed after restoring the Phase 32 local report copy from private GCS
- `activation:staging:healthcheck:summary -- --project reeditpro --region us-central1`: command passed with the existing Phase 24B deployment-log blocker
- `prod:readiness:summary`: passed; production readiness remains blocked
- `prod:beta:summary`: passed; external beta and real-user-media beta remain blocked
- `lint`: passed
- `build`: passed with the known large chunk warning
- `build:server`: passed
- `git diff --check`: passed
- `package-lock.json`: unchanged
