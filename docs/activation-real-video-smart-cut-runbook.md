# Activation Real Video Smart Cut Runbook

Phase 29 runs one controlled smart-cut + captions metadata test against the
approved Phase 28 video/artifact set only.

Allowed execution:

- source: `gs://reeditpro-staging-reeditpro-source-media/activation-real-video/phase28/phase28-20260528T01552/source-video.mov`
- artifacts: only `activation-real-video/phase28/phase28-20260528T01552/`
- confirmation: `REEDITPRO_CONFIRM_REAL_VIDEO_SMART_CUT=true`
- environment: `REEDITPRO_ENV=staging`, `GCP_PROJECT_ID=reeditpro`, `GCP_REGION=us-central1`

Run:

```sh
npm run activation:real-video:smart-cut -- --mode execute
```

The default mode is report-only. Execution loads private Phase 28 transcript,
word timestamp, caption, media probe, and QA artifacts, builds a conservative
SmartCutPlan, creates timeline metadata, uploads private Phase 29 artifacts,
and leaves final export blocked.

Do not run providers, GPU, model downloads, audio cleanup, color, masks,
enhancement, final export, public URLs, or a second source video.
