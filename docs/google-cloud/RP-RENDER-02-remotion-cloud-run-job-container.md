# RP-RENDER-02 Remotion Cloud Run Job Container Skeleton

## Purpose

RP-RENDER-02 prepares the future Cloud Run Job container/runtime skeleton for ReeditPro preview and export rendering.

This is not a renderer implementation. It does not deploy Cloud Run, install Remotion, import `@remotion/renderer`, render media, access real GCS objects, call providers, read secrets, spend credits, or change frontend behavior.

## Worker Runtime

Cloud Run Job is the future render worker runtime. It is not an always-on VM and not a browser/frontend render path.

Planned jobs:

| Region | Job name | Service account | Image |
| --- | --- | --- | --- |
| `us-east1` | `remotion-render-worker-job` | `sa-remotion-render-worker@reeditpro.iam.gserviceaccount.com` | `us-east1-docker.pkg.dev/reeditpro/reeditpro-runtime/remotion-render-worker:mock` |
| `europe-west1` | `remotion-render-worker-job` | `sa-remotion-render-worker@reeditpro.iam.gserviceaccount.com` | `europe-west1-docker.pkg.dev/reeditpro/reeditpro-runtime/remotion-render-worker:mock` |

## Container Folder

The future container skeleton lives in:

```text
scripts/render/remotion-worker/
```

Files:

- `Dockerfile.placeholder`: commented future image shape only.
- `README.md`: worker contract and gate documentation.
- `deploy-cloud-run-job.example.sh`: example-only deployment shape.
- `run-local-mock-render-worker.example.sh`: example-only mock payload sketch.

The example deploy script is guarded and must not be run by automation. It documents build, push, and create/update steps only. RP-RENDER-02 must not execute production renders.

## Backend Entrypoint

The mock backend entrypoint lives in:

```text
src/backend/render/remotion-worker/remotion-worker-entrypoint.ts
```

It accepts injected env and payload objects, requires:

- `renderJobId`
- `jobId`
- `approvedPlanSnapshotId`
- `creditReservationId`
- `idempotencyKey`

It calls the mock `runRemotionWorkerSkeleton`, returns sanitized JSON, and does not import Node runtime APIs, Remotion, GCS clients, Secret Manager clients, provider SDKs, or render tooling.

## Future Env Vars

Required future environment variables:

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

These are reference names and bucket variables only. They are not raw secret values.

## Render Gates

Remotion renders preview/export only after approval, credit, timing validation, asset readiness, QA, and export gates.

Preview render is not final export. It is a review artifact.

Final export requires all of:

- `previewApproved`
- `qaPassed`
- `exportApproved`

Workers must execute approved snapshots, not raw chat text. Remotion timing must come from the approved timing/render contract.

## Mock-Only Boundary

RP-RENDER-02 adds skeleton readiness only:

- no real Remotion rendering
- no Remotion dependency install
- no Cloud Run deployment
- no GCS reads or writes
- no Supabase service-role access
- no provider calls
- no credit spending
- no frontend behavior changes

Real Remotion rendering remains future backend work after approved snapshot, credit reservation, timing validation, asset readiness, QA, and export gates are fully wired.
