# Phase 30 Real Video Private Export Results

Status: completed after Phase 30B IAM retry

Source Phase 28 run: `phase28-20260528T01552`

Source Phase 29 run: `phase29-20260528T02254`

Approved source object:

`gs://reeditpro-staging-reeditpro-source-media/activation-real-video/phase28/phase28-20260528T01552/source-video.mov`

Render/export path:

- staging render worker
- linux/amd64 image tag `staging-phase30b-export-001`
- image digest: `us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-render-worker@sha256:23e20b85b316981e636718cdbd30340aa84d2174fe44b85afc4ed7083b1ab114`
- private MP4 final export
- caption sidecars only
- no public URL or final public delivery

IAM:

Phase 30B added conditional prefix-scoped IAM for `reeditpro-stg-render-sa@reeditpro.iam.gserviceaccount.com` and removed older unconditioned render-service-account storage bindings from the relevant buckets.

Execution:

- Cloud Run execution: `reeditpro-staging-render-job-fpdqq`
- Result: succeeded
- Final export created: yes
- Caption handling: `sidecar_only`
- Logs: `activation-logs/real-video-private-export/phase30b/`

Final export:

`gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase30/phase30-20260528T12421/final-export.mp4`

- Size: `86958606` bytes
- SHA-256: `dea8cb62ffae3e1f593a61b22c3ea594ec30d015e7583f573ac95497bf4390ab`
- Duration: `15.47s`
- Video codec: `h264`
- Audio codec: `aac`
- Audio present: yes

QA:

- `render_asset_integrity=passed`
- `render_timeline_integrity=passed`
- `export_codec_format=passed`
- `export_duration_sync=passed`
- `audio_sync=passed`
- `caption_timing=warning`
- `caption_readability=warning`
- `final_delivery=passed`

Safety:

- no source overwrite
- no public URL
- no provider call
- no GPU
- no model download
- no Revideo
- no color/audio cleanup, masks, enhancement, or slow motion
- no secret values

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
- `realUserMediaTestingAllowed=false` except this single controlled Phase 30 run
