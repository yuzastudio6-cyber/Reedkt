# Staging Media Analysis Canary

Status: passed staging gate.

RP-MEDIA-01 is the first media-analysis worker gate. It proves the staging runner can take one generated smoke MP4, store it as source media in GCS, record canonical staging Supabase metadata, run required FFprobe/FFmpeg analysis, write smoke-tagged analysis artifacts, clean everything, and verify no leftovers.

This gate does not use Cloud Run, Remotion, providers, Stripe/payment, production resources, customer media, broad E2E suites, queue drains, existing user jobs, or service account JSON keys.

## Passed Gate Record

The guarded workflow `RP E2E Staging Media Analysis Canary` passed as run `26349869644`, job `77566075442`, at head SHA `287e33bead1dcfdab086494723f6e250bc262804`.

- Smoke run ID: `rp-e2e-smoke-c52baa68-bb67-43c1-b9bc-380cc44d9121`
- Result: `PASS`
- FFprobe metadata: `3s`, `160x90`, `mpeg4`, `mp4` container, one video stream, no audio
- FFmpeg thumbnail artifact: `image/jpeg`, `160x90`, `3,364` bytes
- GCS cleanup: `5` objects deleted, cleanup errors `[]`
- Supabase cleanup: `15` records deleted, cleanup errors `[]`
- Leftovers: records `[]`, query errors `[]`
- Optional tool slots produced warnings only
- Safety confirmed: no production, Stripe/payment, provider generation, customer media, broad E2E, queue drain, Cloud Run render invocation, or service account JSON key path ran

## Required Flow

1. Create a `rp-e2e-smoke-<uuid>` smoke run ID.
2. Check prior smoke leftovers.
3. Generate one tiny `3s`, `160x90`, `15fps` MP4 fixture with FFmpeg.
4. Upload/register it as a GCS source media object.
5. Create upload intent, media asset, and source `storage_object_records` metadata in staging Supabase.
6. Download the source from GCS in the workflow runner.
7. Run FFprobe for duration, dimensions, codecs, stream count, container, and file size.
8. Run FFmpeg to extract exactly one thumbnail frame and check audio stream presence.
9. Write analysis artifacts to GCS:
   - `thumbnail.jpg`
   - `probe-summary.json`
   - `audio-summary.json`
   - `media-analysis-report.json`
10. Record a `media_analysis` job and completion event with bounded report metadata.
11. Clean smoke Supabase records and GCS artifacts.
12. Run strict exact-ID leftover detection.

## GCS Paths

Source media path:

```text
workspaces/{workspaceId}/projects/{projectId}/source-media/{smokeRunId}/tiny-media-analysis-source.mp4
```

Analysis artifact path:

```text
workspaces/{workspaceId}/projects/{projectId}/media-analysis/{smokeRunId}/...
```

Canonical records store only bucket/object path metadata, MIME type, size, checksum, purpose, region, and status. Signed URLs, raw media bytes, provider payloads, and secrets are forbidden as canonical truth.

## Required Tools

- FFprobe: required for media metadata.
- FFmpeg: required for the fixture, thumbnail extraction, and audio stream presence check.
- Remotion: not required for this gate.

Optional readiness slots are reported as warnings only until a later worker gate enables them:

- PySceneDetect scene detection
- Whisper/faster-whisper/whisper.cpp transcript/word timing
- OpenCV visual QA
- AudioFlux rhythm/onset analysis

## Strict Guard

Live strict mode requires:

- `SUPABASE_E2E_SMOKE_MODE=live`
- `SUPABASE_E2E_ALLOW_WRITES=true`
- `SUPABASE_E2E_ALLOW_MEDIA_ANALYSIS=true`
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

Stable blocker codes include:

- `MEDIA_ANALYSIS_WRITES_DISABLED`
- `MEDIA_ANALYSIS_NOT_ALLOWED`
- `MEDIA_ANALYSIS_CLEANUP_REQUIRED`
- `MEDIA_ANALYSIS_GCS_REQUIRED`
- `MEDIA_ANALYSIS_FFPROBE_REQUIRED`
- `MEDIA_ANALYSIS_FFMPEG_REQUIRED`
- `MEDIA_ANALYSIS_SOURCE_NOT_SMOKE_TAGGED`
- `MEDIA_ANALYSIS_ARTIFACT_NOT_SMOKE_TAGGED`
- `MEDIA_ANALYSIS_SIGNED_URL_CANONICAL_FORBIDDEN`

## Workflow

Workflow: `RP E2E Staging Media Analysis Canary`

The workflow is manual-only and uses OIDC/WIF credentials for GCS. It does not request a Cloud Run ID token because this gate runs FFprobe/FFmpeg analysis inside the GitHub Actions runner.

Before live dispatch, confirm workflow visibility from the default branch entrypoint if needed.

```powershell
& "C:\Program Files\GitHub CLI\gh.exe" workflow run "RP E2E Staging Media Analysis Canary" `
  -R yuzastudio6-cyber/Reedkt `
  --ref codex/reeditpro-e2e-readiness `
  -f allow_writes=true `
  -f allow_media_analysis=true `
  -f cleanup=true `
  -f max_wait_seconds=180 `
  -f smoke_user_id=bb300bde-97fa-438d-ab97-a47dec0ca7d1 `
  -f previous_write_smoke_run_id=rp-e2e-smoke-79ce5e86-b894-4bf4-967d-d702a1c16ccf `
  -f previous_persisted_render_smoke_run_id=rp-e2e-smoke-c60fc032-7fee-4810-bc4e-4d799d2a1438 `
  -f previous_sandbox_render_smoke_run_id=rp-e2e-smoke-5a57ff5e-2017-4cf1-963b-703097fc9ec8 `
  -f previous_render_infrastructure_smoke_run_id=rp-e2e-smoke-299243de-9589-4f4a-9d02-5d1ca5fd4b35 `
  -f previous_real_video_smoke_run_id=rp-e2e-smoke-a7606dae-f697-40cb-ae0a-644cd32b4bc9
```

## Pass Criteria

The gate can be recorded as passed only when:

- prior smoke leftover checks are clean before analysis;
- FFprobe and FFmpeg readiness passes;
- the source object and analysis artifacts are smoke-tagged;
- analysis metadata is recorded without signed URLs;
- Supabase cleanup errors are empty;
- GCS cleanup errors are empty;
- leftover records and leftover query errors are empty;
- the run confirms no production, Stripe/payment, provider generation, customer media, broad E2E, queue drain, Cloud Run render invocation, or service account JSON key path ran.

## Difference From Previous Gates

The Cloud Run / Remotion infrastructure canary proved private Cloud Run, Remotion, GCS preview artifact create/delete, and render metadata. The real-video upload-to-preview canary proved one generated source video can render a preview through Cloud Run/Remotion.

RP-MEDIA-01 is earlier in the editing pipeline. It proves deterministic source analysis with FFprobe/FFmpeg before edit planning or timeline composition. It does not render a preview and does not call providers.
