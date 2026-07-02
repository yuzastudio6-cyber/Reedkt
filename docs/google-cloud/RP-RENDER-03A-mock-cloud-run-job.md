# RP-RENDER-03A Mock Remotion Cloud Run Job

## Purpose

RP-RENDER-03A turns the Remotion worker skeleton into a deployable mock Cloud Run Job container path.

It proves container build, deploy, job execution wiring, payload validation, and sanitized output. It does not render media, install Remotion, import `@remotion/renderer`, access real GCS objects, read Secret Manager values, call providers, spend credits, or run Cloud Run from Codex.

## What The Mock Job Does

- Reads a render payload from `RENDER_WORKER_PAYLOAD`, a local mock JSON path in `RENDER_WORKER_PAYLOAD_PATH`, or an embedded mock preview payload.
- Requires `renderJobId`, `jobId`, `approvedPlanSnapshotId`, `creditReservationId`, and `idempotencyKey`.
- Runs the existing Remotion worker preflight and mock manifest path.
- Prints sanitized JSON only.
- Exits nonzero when payload parsing, required fields, runtime mode, or preflight checks block execution.

## What The Mock Job Does Not Do

- No video rendering.
- No Remotion or `@remotion/renderer`.
- No Chromium or FFmpeg.
- No provider calls.
- No GCS reads or writes.
- No Secret Manager value reads.
- No credit spending.
- No production render execution.

## Build

```bash
npm run build:remotion-worker:mock
```

Local mock payload file test:

```bash
npm run build:remotion-worker:mock
RENDER_WORKER_PAYLOAD_PATH=scripts/render/remotion-worker/payloads/mock-preview-render.us-east1.json \
SERVER_RUNTIME_MODE=mock \
npm run start:remotion-worker:mock
```

`RENDER_WORKER_PAYLOAD_PATH` is a local mock convenience only. It reads a JSON payload file from the local filesystem; it does not read media, GCS objects, Secret Manager values, provider keys, or signed URLs.

US image:

```bash
docker build \
  -f scripts/render/remotion-worker/Dockerfile.mock \
  -t us-east1-docker.pkg.dev/reeditpro/reeditpro-runtime/remotion-render-worker:mock \
  .
```

Europe image:

```bash
docker build \
  -f scripts/render/remotion-worker/Dockerfile.mock \
  -t europe-west1-docker.pkg.dev/reeditpro/reeditpro-runtime/remotion-render-worker:mock \
  .
```

## Manual Deploy Commands

US:

```bash
REEDITPRO_ALLOW_MOCK_RENDER_JOB_DEPLOY=mock-only \
PROJECT_ID=reeditpro \
RUNTIME_REGION=us-east1 \
bash scripts/render/remotion-worker/deploy-mock-cloud-run-job.example.sh
```

Europe:

```bash
REEDITPRO_ALLOW_MOCK_RENDER_JOB_DEPLOY=mock-only \
PROJECT_ID=reeditpro \
RUNTIME_REGION=europe-west1 \
bash scripts/render/remotion-worker/deploy-mock-cloud-run-job.example.sh
```

The script is example/manual only. It does not execute the job by default.

## Manual Mock Execution

US:

```bash
PAYLOAD="$(tr -d '\n' < scripts/render/remotion-worker/payloads/mock-preview-render.us-east1.json)"
gcloud run jobs update remotion-render-worker-job \
  --project reeditpro \
  --region us-east1 \
  --set-env-vars "^@@^RENDER_WORKER_PAYLOAD=${PAYLOAD}@@SERVER_RUNTIME_MODE=mock"

gcloud run jobs execute remotion-render-worker-job \
  --project reeditpro \
  --region us-east1 \
  --wait
```

Europe:

```bash
PAYLOAD="$(tr -d '\n' < scripts/render/remotion-worker/payloads/mock-preview-render.europe-west1.json)"
gcloud run jobs update remotion-render-worker-job \
  --project reeditpro \
  --region europe-west1 \
  --set-env-vars "^@@^RENDER_WORKER_PAYLOAD=${PAYLOAD}@@SERVER_RUNTIME_MODE=mock"

gcloud run jobs execute remotion-render-worker-job \
  --project reeditpro \
  --region europe-west1 \
  --wait
```

## Log Verification

```bash
gcloud logging read 'resource.type="cloud_run_job" AND resource.labels.job_name="remotion-render-worker-job"' \
  --project reeditpro \
  --limit 20 \
  --format json
```

Logs should show sanitized JSON only. They must not include secrets, signed URLs, provider keys, media bytes, or real render output.

## Gate Policy

Preview render is not final export. It is a review artifact.

Final export requires:

- `previewApproved`
- `qaPassed`
- `exportApproved`

Future real rendering must still enforce approved snapshot, credit reservation, timing validation, asset readiness, QA, and export gates. RP-RENDER-03A only validates the mock payload and proves the Cloud Run Job container path.

Real rendering comes later in RP-RENDER-03B or RP-RENDER-04.
