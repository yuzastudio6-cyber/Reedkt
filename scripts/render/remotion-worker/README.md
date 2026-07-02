# Remotion Mock Render Worker

This folder contains the mock-only Cloud Run Job container skeleton for future ReeditPro preview and export rendering.

RP-RENDER-03A proves container build, deploy, job payload validation, and sanitized output wiring. It does not render media, install Remotion, import `@remotion/renderer`, access real GCS objects, read Secret Manager values, call providers, spend credits, or deploy automatically.

## Planned Cloud Run Jobs

| Region | Job | Service account | Image |
| --- | --- | --- | --- |
| `us-east1` | `remotion-render-worker-job` | `sa-remotion-render-worker@reeditpro.iam.gserviceaccount.com` | `us-east1-docker.pkg.dev/reeditpro/reeditpro-runtime/remotion-render-worker:mock` |
| `europe-west1` | `remotion-render-worker-job` | `sa-remotion-render-worker@reeditpro.iam.gserviceaccount.com` | `europe-west1-docker.pkg.dev/reeditpro/reeditpro-runtime/remotion-render-worker:mock` |

Cloud Run Job is the future render worker runtime. It is not an always-on VM and not a frontend render path.

## Build Locally

```bash
npm run build:remotion-worker:mock
npm run start:remotion-worker:mock
```

The local start command uses this payload order:

1. `RENDER_WORKER_PAYLOAD` inline JSON.
2. `RENDER_WORKER_PAYLOAD_PATH` local mock JSON file.
3. Embedded mock preview payload.

Local payload-file example:

```bash
npm run build:remotion-worker:mock
RENDER_WORKER_PAYLOAD_PATH=scripts/render/remotion-worker/payloads/mock-preview-render.us-east1.json \
SERVER_RUNTIME_MODE=mock \
npm run start:remotion-worker:mock
```

`RENDER_WORKER_PAYLOAD_PATH` is only for local mock testing. It does not read media, GCS objects, Secret Manager values, provider keys, or signed URLs.

## Build Mock Image

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

## Deploy Mock Job Manually

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

The script builds and pushes one region at a time, creates or updates `remotion-render-worker-job`, and does not execute the job by default.

## Execute A Manual Mock Test

US payload:

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

Europe payload:

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

## Verify Logs

```bash
gcloud logging read 'resource.type="cloud_run_job" AND resource.labels.job_name="remotion-render-worker-job"' \
  --project reeditpro \
  --limit 20 \
  --format json
```

Logs should contain sanitized JSON only. They must not contain secrets, signed URLs, provider keys, raw media paths beyond canonical object paths, or rendered media bytes.

## Required Future Env Vars

```text
PROJECT_ID=reeditpro
RUNTIME_REGION=us-east1 or europe-west1
SERVER_RUNTIME_MODE=mock
SUPABASE_URL_SECRET_NAME=reeditpro-prod-supabase-url
SUPABASE_SERVICE_ROLE_SECRET_NAME=reeditpro-prod-supabase-service-role-key
GCS_PREVIEWS_BUCKET
GCS_EXPORTS_BUCKET
GCS_WORKER_TEMP_BUCKET
```

These are references only. The mock worker does not read Secret Manager values or access GCS.

## Render Gate Rules

- The worker must receive `renderJobId`, `jobId`, `approvedPlanSnapshotId`, `creditReservationId`, and `idempotencyKey`.
- Preview renders are review artifacts, not final exports.
- Final export requires `previewApproved`, `qaPassed`, and `exportApproved`.
- Render jobs must also respect approved snapshot, credit reservation, timing validation, asset readiness, QA, and export gates.

## Do Not Do Yet

- Do not install `remotion` or `@remotion/renderer`.
- Do not run Chromium, FFmpeg, Remotion, or media rendering.
- Do not read Secret Manager values.
- Do not download or upload real media.
- Do not call providers.
- Do not execute production renders.
- Do not bypass approval, credit, timing validation, QA, or export gates.

Real rendering remains future RP-RENDER-03B or RP-RENDER-04 work.
