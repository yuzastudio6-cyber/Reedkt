# Phase 30B Render IAM Retry Results

Status: completed with private export created

Goal:

Grant narrow conditional GCS access to `reeditpro-stg-render-sa@reeditpro.iam.gserviceaccount.com`, then retry the Phase 30 private final export.

Approved inputs:

- Phase 28: `phase28-20260528T01552`
- Phase 29: `phase29-20260528T02254`

Gcloud/auth:

- Active account: `aiediting@reeditpro.com`
- Active project: `reeditpro`
- `gcloud projects describe reeditpro`: passed
- `REEDITPRO_ENV=staging`
- `REEDITPRO_CONFIRM_REAL_VIDEO_PRIVATE_EXPORT=true`

IAM:

- Added conditional `roles/storage.objectViewer` for the approved Phase 28/29 input prefixes.
- Added conditional `roles/storage.objectCreator` for the approved Phase 30 output prefixes.
- Removed older unconditioned render-service-account `objectViewer`/`objectCreator` bindings from the relevant Phase 30B buckets.
- Verified no render-service-account `owner`, `editor`, `storage.admin`, `storage.objectAdmin`, or `storage.objectUser`.
- Verified no `allUsers` or `allAuthenticatedUsers` bindings on the checked buckets.
- Verified old `reeditpro-staging-api-sa` was not used.

IAM condition scopes:

- `reeditpro-staging-reeditpro-source-media`: viewer on `activation-real-video/phase28/phase28-20260528T01552/`
- `reeditpro-staging-reeditpro-analysis-artifacts`: viewer on `activation-real-video/phase28/phase28-20260528T01552/`
- `reeditpro-staging-reeditpro-transcripts`: viewer on `activation-real-video/phase28/phase28-20260528T01552/`
- `reeditpro-staging-reeditpro-qa-artifacts`: viewer on `activation-real-video/phase28/phase28-20260528T01552/`
- `reeditpro-staging-reeditpro-analysis-artifacts`: viewer on `activation-real-video/phase29/phase29-20260528T02254/`
- `reeditpro-staging-reeditpro-transcripts`: viewer on `activation-real-video/phase29/phase29-20260528T02254/`
- `reeditpro-staging-reeditpro-qa-artifacts`: viewer on `activation-real-video/phase29/phase29-20260528T02254/`
- `reeditpro-staging-reeditpro-final-exports`: creator on `activation-real-video/phase30/`
- `reeditpro-staging-reeditpro-previews`: creator on `activation-real-video/phase30/`
- `reeditpro-staging-reeditpro-qa-artifacts`: creator on `activation-real-video/phase30/`
- `reeditpro-staging-reeditpro-worker-temp`: creator on `activation-real-video/phase30/`

Render image:

- Tag: `staging-phase30b-export-001`
- Digest: `us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-render-worker@sha256:23e20b85b316981e636718cdbd30340aa84d2174fe44b85afc4ed7083b1ab114`
- Platform: `linux/amd64`

Export retry:

- Cloud Run job: `reeditpro-staging-render-job`
- Execution ID: `reeditpro-staging-render-job-fpdqq`
- Result: succeeded

Final export:

- Object: `gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase30/phase30-20260528T12421/final-export.mp4`
- Size: `86958606` bytes
- SHA-256: `dea8cb62ffae3e1f593a61b22c3ea594ec30d015e7583f573ac95497bf4390ab`
- Duration: `15.47s`
- Expected timeline duration: `15.443s`
- Video codec: `h264`
- Audio codec: `aac`
- Audio present: yes
- Caption handling: `sidecar_only`

Artifacts:

- Final export MP4 in private final exports bucket
- Render manifest in private final exports bucket
- Caption sidecars copied privately: JSON, SRT, WebVTT, ASS
- Export QA report in private QA bucket
- Phase 30 report in private QA bucket

QA summary:

- `render_asset_integrity`: passed
- `render_timeline_integrity`: passed
- `export_codec_format`: passed
- `export_duration_sync`: passed, `0.027s` delta
- `audio_sync`: passed, audio stream present
- `caption_timing`: warning, sidecar-only captions
- `caption_readability`: warning, based on Phase 28/29 sidecar QA
- `final_delivery`: passed for this controlled private export only

Phase31 readiness:

Ready for private-review follow-up planning. Production, external beta, and broad real-media testing remain blocked.

Validation:

- `smoke:activation-real-video-private-export`: passed
- `smoke:activation-real-video-private-export-iam`: passed
- `activation:real-video:private-export:report`: passed
- `activation:real-video:smart-cut:report`: passed
- `activation:first-video:speech-caption:report`: passed
- `activation:staging:healthcheck:summary -- --project reeditpro --region us-central1`: passed
- `prod:readiness:summary`: passed
- `prod:beta:summary`: passed
- `lint`: passed
- `build`: passed with the known large chunk warning only
- `build:server`: passed
- `git diff --check`: passed
- `package-lock.json`: unchanged (`bbc17b3cb96f642deb5316c680074b1c7e76fd8410bf30ea7db516f10db5ebe3`)

Launch gates:

- `productionReadyAllowed=false`
- `externalBetaAllowed=false`
- `realUserMediaTestingAllowed=false` except this single controlled Phase 30 retry
