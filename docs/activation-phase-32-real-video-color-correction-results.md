# Phase 32 Real Video Color Correction Results

Status: completed for the single controlled staging real-video chain.

## Scope

- Project: `reeditpro`
- Region: `us-central1`
- Source Phase 28 run: `phase28-20260528T01552`
- Source Phase 29 run: `phase29-20260528T02254`
- Source Phase 30 run: `phase30-20260528T12421`
- Source Phase 31 run: `phase31-20260528T13060`
- Input export: `gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase31/phase31-20260528T13060/audio-normalized-export.mp4`
- Color correction path: FFmpeg-only signal/stat sampling and clean minimal correction
- Render service account: `reeditpro-stg-render-sa@reeditpro.iam.gserviceaccount.com`

## Execution

- Phase 32 run ID: `phase32-20260528T13330`
- Cloud Run execution: `reeditpro-staging-render-job-bcqtm`
- Render image tag: `us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-render-worker:staging-phase32-color-001`
- Image index digest: `sha256:8a0e3b785abad714a2281f77e1426c9e617f1ed516754e091ea4751d9826273b`
- Linux/amd64 image manifest digest used by Cloud Run: `sha256:7a16f99ffd5fcb53192f19c0730578c10a681def88a929d45b1e6a0d79dd1bbf`
- Execution result: succeeded

## IAM

Phase 32 used only conditional bucket IAM for the render service account:

- `roles/storage.objectViewer` on `reeditpro-staging-reeditpro-final-exports/activation-real-video/phase31/phase31-20260528T13060/`
- `roles/storage.objectCreator` on `reeditpro-staging-reeditpro-analysis-artifacts/activation-real-video/phase32/`
- `roles/storage.objectCreator` on `reeditpro-staging-reeditpro-generated-assets/activation-real-video/phase32/`
- `roles/storage.objectCreator` on `reeditpro-staging-reeditpro-final-exports/activation-real-video/phase32/`
- `roles/storage.objectCreator` on `reeditpro-staging-reeditpro-qa-artifacts/activation-real-video/phase32/`
- `roles/storage.objectCreator` on `reeditpro-staging-reeditpro-worker-temp/activation-real-video/phase32/`

No `owner`, `editor`, `storage.admin`, `storage.objectAdmin`, `storage.objectUser`, `allUsers`, or `allAuthenticatedUsers` grants were added.

## Color Analysis

- Input duration: `15.467s`
- Input codec/container summary: H.264/AAC MP4
- Input resolution: `2160x3840`
- Input color space/transfer: `bt709` / `bt709`
- Sampled frame count: `3`
- Underexposed risk: `high`
- Overexposed risk: `low`
- Highlight clipping risk: `low`
- Shadow crushing risk: `warning`
- Saturation risk: `high`
- Skin tone risk: `warning_only_not_measured`
- Shot mismatch: `not_applicable_single_clip`

## Correction Decision

- Decision: `minimal_correction`
- Style: `clean_natural`
- Reason: minimal brightness/contrast lift selected due to underexposure risk
- FFmpeg filter: `eq=brightness=0.025:contrast=1.04:saturation=1.03:gamma=1`
- OpenColorIO/OpenImageIO/LUTs: not used
- Arbitrary FFmpeg arguments: not used

## Color Export

- Export object: `gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase32/phase32-20260528T13330/color-corrected-export.mp4`
- Export size: `94522751` bytes
- Export SHA-256: `78bd798602d221b894a60dfa34ed1528602c9ece7f657e3f9bbea7fd071cc7fa`
- Output duration: `15.467s`
- Output codec/container summary: H.264/AAC MP4
- Output resolution: `2160x3840`
- Audio status: preserved
- Source overwrite: false
- Public URL/signed URL: not created

## Private Artifacts

- Color analysis: `gs://reeditpro-staging-reeditpro-analysis-artifacts/activation-real-video/phase32/phase32-20260528T13330/color/color-analysis.json`
- Color grade recipe: `gs://reeditpro-staging-reeditpro-analysis-artifacts/activation-real-video/phase32/phase32-20260528T13330/color/color-grade-recipe.json`
- Frame signalstats: `gs://reeditpro-staging-reeditpro-generated-assets/activation-real-video/phase32/phase32-20260528T13330/color/frame-signalstats.json`
- Color-corrected export: `gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase32/phase32-20260528T13330/color-corrected-export.mp4`
- QA report: `gs://reeditpro-staging-reeditpro-qa-artifacts/activation-real-video/phase32/phase32-20260528T13330/qa/color-correction-qa.json`
- Phase 32 report: `gs://reeditpro-staging-reeditpro-qa-artifacts/activation-real-video/phase32/phase32-20260528T13330/reports/phase32-report.json`

## QA Summary

- Overall QA status: warning
- `color_exposure`: passed
- `color_skin_tone`: warning, no face/skin model ran
- `color_export_space`: passed
- `color_shot_match`: warning/not applicable for single controlled clip
- `export_codec_format`: passed
- `export_duration_sync`: passed, duration delta `0.000s`
- `audio_sync`: passed
- `final_delivery`: passed for the private Phase 32 color-reviewed export only

## Safety

- Exactly one approved Phase 31 private export was used.
- No GPU was used.
- No providers were called.
- No model weights were downloaded.
- No OpenColorIO or OpenImageIO path ran.
- No audio cleanup rerun, masks, enhancement, or Revideo path ran.
- No secret values were added.
- No public access or signed URL source of truth was created.

## Logs

- Local logs: `activation-logs/real-video-color-correction/phase32/`
- Execution report copy: `activation-logs/real-video-color-correction/phase32/reports/phase32-report.json`

## Launch Gates

- `productionReadyAllowed=false`
- `externalBetaAllowed=false`
- `realUserMediaTestingAllowed=false`, except this single controlled Phase 32 staging run

## Phase 33 Readiness

Ready for controlled Phase 33 planning only. The private Phase 32 color-corrected export exists, QA has no blocking failures, and no provider/GPU/model-download/public-access path was used. Production, external beta, and broad real-media testing remain blocked.
