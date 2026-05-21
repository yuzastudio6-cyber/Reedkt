# RP-E2E-READY-01 Basic Render Smoke

This milestone adds the first no-AI local render smoke path. It proves ReeditPro can move from controlled uploaded media metadata into worker-claimed FFprobe/FFmpeg execution and preview-ready local storage metadata.

It does not use Remotion, AI providers, Stripe, Google Cloud deployment, secrets, signed URLs as canonical records, or production rendering.

## What It Does

When FFmpeg and FFprobe are available, the smoke path:

1. Generates a tiny synthetic MP4 fixture locally.
2. Treats it as finalized source media with canonical storage metadata.
3. Requires approved snapshot, credit reservation, render job, and worker claim IDs.
4. Probes the source with FFprobe.
5. Trims/encodes a short MP4 preview with FFmpeg.
6. Stores the preview under the local storage root with a canonical object path.
7. Creates mock preview storage object, render metadata, and QA report metadata.
8. Emits worker/job events through the existing claim runner.
9. Returns a preview-ready result.

## Required Tools

- `ffmpeg`
- `ffprobe`

Host Codex currently has both missing, so the default host smoke skips with a warning. Strict mode fails clearly.

## Commands

Host non-strict smoke:

```bash
npm run smoke:render
```

Host strict smoke:

```bash
npm run smoke:render:strict
```

Smoke test wrapper:

```bash
npm run smoke:render:test
```

Docker path, when Docker is installed:

```bash
npm run docker:worker:build
npm run docker:worker:render-smoke
```

## Running Prompt 6 Through GitHub Actions

This branch includes `.github/workflows/e2e-render-smoke.yml` so Prompt 6 can be validated through CI without requiring FFmpeg and FFprobe on every local host.

The workflow runs on `pull_request` and `workflow_dispatch`, installs FFmpeg/FFprobe on `ubuntu-latest`, verifies `ffmpeg -version` and `ffprobe -version`, then runs the strict render smoke path:

```bash
npm run smoke:render:strict
npm run smoke:render:test
```

Local FFmpeg is optional if you rely on CI for strict validation. You can still run `npm run smoke:render:strict` locally after installing FFmpeg and FFprobe on your machine.

The CI path remains no-AI and no-provider: it does not use Remotion, call provider APIs, deploy Cloud Run, add secrets, or run Stripe.

## Route

```http
POST /v1/render-jobs/:renderJobId/basic-smoke-preview
Authorization: Bearer <token>
Idempotency-Key: render-smoke-001
```

The route requires local mode, auth, idempotency, approved snapshot ID, credit reservation ID, source storage object ID, and worker claim execution. In mock mode, source storage metadata may be supplied in the request body for local testing.

## Expected Missing Tool Result

```json
{
  "ok": false,
  "status": "skipped",
  "error": {
    "code": "RENDER_SMOKE_SKIPPED",
    "message": "Basic render smoke skipped because required FFmpeg/FFprobe tools are unavailable."
  }
}
```

## Expected Success Shape

```json
{
  "ok": true,
  "status": "preview_ready",
  "renderId": "render_...",
  "previewStorageObjectId": "storage_object_...",
  "qaReportId": "qa_report_...",
  "outputObjectPath": "workspaces/.../projects/.../previews/.../basic-smoke-preview.mp4",
  "checksumSha256": "...",
  "warnings": []
}
```

## Failure Modes

- Missing FFmpeg or FFprobe: skipped in non-strict mode, blocked in strict mode.
- Non-local storage mode: blocked with `LOCAL_STORAGE_REQUIRED`.
- Missing approved snapshot or credit reservation ID: blocked before execution.
- Missing source storage object metadata in mock mode: blocked with `STORAGE_OBJECT_NOT_FOUND`.
- FFprobe or FFmpeg command failure: blocked with `FFPROBE_FAILED` or `FFMPEG_RENDER_FAILED`.

## What Remains

Prompt 7 should connect this smoke path to stronger local/staging database records, refine render/QA persistence, and later introduce Remotion only after the FFmpeg/FFprobe foundation is stable.
