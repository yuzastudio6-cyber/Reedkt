# Phase 30 Real Video Private Export Results

Status: blocked before export by narrow storage IAM

Source Phase 28 run: `phase28-20260528T01552`

Source Phase 29 run: `phase29-20260528T02254`

Approved source object:

`gs://reeditpro-staging-reeditpro-source-media/activation-real-video/phase28/phase28-20260528T01552/source-video.mov`

Planned render/export path:

- staging render worker
- linux/amd64 image tag `staging-phase30-export-001`
- image digest: `us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-render-worker@sha256:6496221635720ee1dffdd0f40527612ce8c2ff97388fa1233755c0458484fbde`
- private MP4 final export
- caption sidecars only
- no public URL or final public delivery

Deployment:

- `reeditpro-staging-render-job` was redeployed with the Phase 30 render image.
- Command: `node dist-staging-real-video-export-worker/staging-real-video-export-worker-cli.js`
- Service account: `reeditpro-stg-render-sa@reeditpro.iam.gserviceaccount.com`
- GPU: not used
- Providers/model downloads/public access: not used

Execution:

- Cloud Run execution: `reeditpro-staging-render-job-bmngx`
- Result: failed before export
- Final export created: no
- Caption handling: `sidecar_only`, not reached
- Logs: `activation-logs/real-video-private-export/phase30/`

Blocker:

`reeditpro-stg-render-sa@reeditpro.iam.gserviceaccount.com` does not have `storage.objects.get` access to the private Phase 28/29 staging artifacts.

Narrow fix needed before retry:

- read access for the render service account to the approved Phase 29 analysis prefix `activation-real-video/phase29/phase29-20260528T02254/`
- read access to the approved Phase 28 source object and caption sidecars
- read access to the approved Phase 29 QA/report objects
- write access to the Phase 30 final exports and QA/report prefixes

Do not grant owner/editor, public principals, broad provider/model secret access, or unrelated media/model prefixes.

QA:

- `render_asset_integrity=blocked`
- `final_delivery=blocked`
- no source overwrite
- no public URL
- no provider, GPU, model download, Revideo, color/audio cleanup, masks, or enhancement

Phase31 readiness:

Blocked until the narrow storage IAM issue is fixed and Phase 30 creates a private final export with nonblocking export QA.

Validation:

- `smoke:activation-real-video-private-export`: passed
- `activation:real-video:private-export:report`: passed and reports `blocked`
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
