# Staging Timeline Composition Canary

Status: implemented and fail-closed; live staging dispatch is not yet run.

RP-EDIT-01 is the first real timeline composition gate. It proves ReEditPro can generate one controlled staging source video, analyze it with FFprobe/FFmpeg, build a deterministic edit timeline, invoke the private Cloud Run `/canary/render` Remotion service, create and verify a preview artifact in GCS, record bounded render/QA metadata, clean smoke records/artifacts, and fail if leftovers remain.

This gate does not use production resources, Stripe/payment flows, external provider generation, customer media, broad E2E suites, queue drains, existing user jobs, signed URLs as canonical truth, or service account JSON keys. It uses OIDC/WIF for GitHub Actions to private Cloud Run.

## Required Flow

1. Create a `rp-e2e-smoke-<uuid>` smoke run ID.
2. Check previous smoke leftovers.
3. Generate one tiny `3s`, `160x90`, `15fps` MP4 fixture.
4. Upload/register it as a smoke-tagged GCS source media object.
5. Run FFprobe metadata extraction and FFmpeg thumbnail/audio-presence analysis.
6. Store source and analysis artifacts as bucket/object-path canonical records.
7. Build a fixed edit timeline:
   - one trimmed source segment covering the full `3s` fixture;
   - resize/crop to `160x90` with `objectFit: cover`;
   - one caption placeholder layer;
   - one lower-third/safe-zone overlay;
   - frame-bounded timing map at `15fps` / `45` frames.
8. Store timeline/edit-decision metadata in smoke-safe Supabase records.
9. Invoke Cloud Run with `mode=staging_timeline_composition_canary`.
10. Render via Remotion `renderMedia / bundle / selectComposition`.
11. Store and verify a smoke-tagged preview artifact in GCS.
12. Record render metadata and QA metadata.
13. Cleanup smoke-tagged Supabase records and GCS artifacts.
14. Run strict exact-ID leftover detection.

## GCS Paths

Source media path:

```text
workspaces/{workspaceId}/projects/{projectId}/source-media/{smokeRunId}/tiny-timeline-source.mp4
```

Analysis artifact path:

```text
workspaces/{workspaceId}/projects/{projectId}/media-analysis/{smokeRunId}/...
```

Preview artifact path:

```text
workspaces/{workspaceId}/projects/{projectId}/previews/{renderId}/...
```

Canonical records store bucket name, object path, MIME type, size, checksum, purpose, region, and status only. Signed URLs, raw video bytes, data URLs, customer-media paths, provider payloads, and secrets are forbidden.

## Required Tools

- FFprobe: required for source media metadata.
- FFmpeg: required for fixture generation, thumbnail extraction, and audio presence checks.
- Remotion: required for timeline preview composition and rendering.

Optional tools remain warning-only until future gates explicitly enable them: Sharp/libvips, OpenCV, AudioFlux, Signalsmith Stretch, Whisper variants, PySceneDetect, Playwright, and VapourSynth.

## Strict Guard

Live strict mode requires:

- `SUPABASE_E2E_SMOKE_MODE=live`
- `SUPABASE_E2E_ALLOW_WRITES=true`
- `SUPABASE_E2E_ALLOW_RENDER_EXECUTION=true`
- `SUPABASE_E2E_ALLOW_CLOUD_RUN=true`
- `SUPABASE_E2E_ALLOW_TIMELINE_COMPOSITION=true`
- `SUPABASE_E2E_CLEANUP=true`
- `STORAGE_MODE=gcs`
- bounded `SUPABASE_E2E_MAX_WAIT_SECONDS`
- smoke IDs matching `rp-e2e-smoke-<uuid>`
- staging/smoke/canary GCS buckets
- no provider env
- no Stripe/payment env
- no production-looking project or bucket
- no customer-media paths
- no queue drain

## Workflow

Workflow: `RP E2E Staging Timeline Composition Canary`

The workflow is manual-only and uses `contents: read`, `id-token: write`, and `google-github-actions/auth@v3` with OIDC/WIF. It requests a Cloud Run ID token for the private staging canary service and does not use a service account JSON key.

Before live dispatch, rebuild/redeploy the staging Cloud Run canary image from the readiness commit because RP-EDIT-01 changes the Cloud Run service validator and Remotion entrypoint. Also confirm the workflow entrypoint is visible from the default Actions branch.

```powershell
& "C:\Program Files\GitHub CLI\gh.exe" workflow run "RP E2E Staging Timeline Composition Canary" `
  -R yuzastudio6-cyber/Reedkt `
  --ref codex/reeditpro-e2e-readiness `
  -f allow_writes=true `
  -f allow_render_execution=true `
  -f allow_cloud_run=true `
  -f allow_timeline_composition=true `
  -f cleanup=true `
  -f max_wait_seconds=180 `
  -f smoke_user_id=bb300bde-97fa-438d-ab97-a47dec0ca7d1 `
  -f previous_write_smoke_run_id=rp-e2e-smoke-79ce5e86-b894-4bf4-967d-d702a1c16ccf `
  -f previous_persisted_render_smoke_run_id=rp-e2e-smoke-c60fc032-7fee-4810-bc4e-4d799d2a1438 `
  -f previous_sandbox_render_smoke_run_id=rp-e2e-smoke-5a57ff5e-2017-4cf1-963b-703097fc9ec8 `
  -f previous_render_infrastructure_smoke_run_id=rp-e2e-smoke-299243de-9589-4f4a-9d02-5d1ca5fd4b35 `
  -f previous_real_video_smoke_run_id=rp-e2e-smoke-a7606dae-f697-40cb-ae0a-644cd32b4bc9 `
  -f previous_media_analysis_smoke_run_id=rp-e2e-smoke-c52baa68-bb67-43c1-b9bc-380cc44d9121
```

## Pass Criteria

The gate can be recorded as passed only when:

- prior smoke leftover checks are clean before invocation;
- FFmpeg, FFprobe, and Remotion readiness pass;
- source, analysis, and preview artifacts are smoke-tagged;
- timeline metadata includes one source segment, caption placeholder, lower-third/safe-zone overlay, and frame-bounded timing;
- Cloud Run path is `/canary/render`;
- Remotion path is `renderMedia / bundle / selectComposition`;
- render status reaches `preview_ready`;
- Supabase cleanup errors are empty;
- GCS cleanup errors are empty;
- leftover records and leftover query errors are empty;
- the run confirms no production, Stripe/payment, provider generation, customer media, broad E2E, queue drain, or service account JSON key path ran.

## Difference From Previous Gates

The Cloud Run / Remotion infrastructure canary proved the private render path with a synthetic Remotion fixture. The real-video upload-to-preview canary proved one uploaded generated source video can render a preview through Cloud Run/Remotion. RP-MEDIA-01 proved deterministic media analysis with FFprobe/FFmpeg.

RP-EDIT-01 combines those boundaries into a simple real edit timeline: source media plus analysis metadata plus approved timeline layers rendered into a bounded staging preview. It is still smoke-only and does not authorize production/customer rendering.
