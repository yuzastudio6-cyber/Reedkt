# RP-RENDER-02 Remotion Worker Container Skeleton

This folder documents the future Cloud Run Job container for ReeditPro preview and export rendering.

It is mock-only. It does not install Remotion, run `@remotion/renderer`, render media, read secrets, access real GCS objects, call providers, spend credits, or deploy Cloud Run.

## Planned Cloud Run Jobs

| Region | Job | Service account | Image |
| --- | --- | --- | --- |
| `us-east1` | `remotion-render-worker-job` | `sa-remotion-render-worker@reeditpro.iam.gserviceaccount.com` | `us-east1-docker.pkg.dev/reeditpro/reeditpro-runtime/remotion-render-worker:mock` |
| `europe-west1` | `remotion-render-worker-job` | `sa-remotion-render-worker@reeditpro.iam.gserviceaccount.com` | `europe-west1-docker.pkg.dev/reeditpro/reeditpro-runtime/remotion-render-worker:mock` |

Cloud Run Job is the future render worker runtime. It is not an always-on VM and not a frontend render path.

## Required Future Environment Variables

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

These are reference names and bucket variables only. Do not commit raw Supabase keys, signed URLs, provider keys, or service account credentials.

## Render Gate Rules

- The worker must receive `renderJobId`, `jobId`, `approvedPlanSnapshotId`, `creditReservationId`, and `idempotencyKey`.
- Preview renders are review artifacts, not final exports.
- Final export requires `previewApproved`, `qaPassed`, and `exportApproved`.
- Render jobs must also respect approved snapshot, credit reservation, timing validation, asset readiness, QA, and export gates.

## Files

- `Dockerfile.placeholder` is a commented future image shape only.
- `deploy-cloud-run-job.example.sh` is an example-only deployment script and must not be run by automation.
- `run-local-mock-render-worker.example.sh` is an example-only local mock runner sketch.

RP-RENDER-02 stops at worker/container skeleton readiness. Real Remotion execution remains a later backend worker milestone.
