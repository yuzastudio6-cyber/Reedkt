# Storage Upload Pipeline

## Current Flow

RP-FIX-07 adds a safe planning layer for uploads:

```text
file + purpose + auth/workspace/project context
-> validate MIME, size, and context
-> choose active bucket
-> build workspace/project object path
-> create upload plan
-> optionally call explicit upload helper later
-> create mock typed metadata records
```

No real upload runs automatically.

## Validation

The validation service checks:

- missing file;
- unsupported MIME type;
- planning file size limit;
- signed-in user requirement;
- workspace requirement;
- project requirement for project-scoped purposes.

The current source contract admits video objects up to 1 TiB and reference
video up to 250 GiB. These are high product ceilings, not entitlements or
production-readiness claims. Other planning limits remain purpose-specific.
The backend and browser share the source/reference constants so one surface
cannot promise a file that the other rejects.

The development-only Express raw-body route remains capped at 16 MiB. In GCS
mode, objects above that threshold receive a create-only resumable session and
the browser sends aligned chunks with exact committed-offset recovery. The
browser does not buffer a large file to compute a whole-file checksum; the
backend-computed stored-byte hash remains authority.

After a resumable upload completes, the browser creates and polls a private
large-media finalization job instead of running full-object hash/probe work in
the ordinary finalization request. The single-process/single-host internal
authority has checksum-protected persistence, durable idempotency, one active
lease, heartbeats, bounded retries, expired-lease reclamation, and safe status
views. The browser never calls the internal worker-run route. Small uploads
retain the inline finalization path.

Before a background attempt claims its lease, the current full-stage worker
must prove free filesystem capacity for one complete source copy plus the
larger of 8 GiB or 10% safety headroom. Missing or insufficient capacity starts
no byte traversal and consumes no retry. A process-local reservation prevents
concurrent jobs from double-spending the same observed capacity on that worker.
This is a fail-closed single-process guard, not distributed capacity or
representative huge-object throughput evidence.

## Media Records

`media-asset-service.ts` creates mock typed records from upload plans:

- `MediaAssetRecord` for source, reference, thumbnail, preview, export, and audio storage references;
- `ReferenceAssetRecord` for reference upload placeholders;
- `GeneratedAssetRecord` for generated asset placeholders.

The service does not insert database rows. Production writes should go through backend services when schema and RLS are validated.

## Source Upload Order

`source-upload-flow-service.ts` preserves uploaded order as source sequence context. Uploaded order is not the final edit order. Final edit order remains part of later AI planning, credit estimate, and approval.

Warnings are emitted when order is missing, duplicated, or invalid.

## Generated, Preview, And Export Assets

Generated assets, preview renders, final exports, QA artifacts, and worker temp objects are planned as storage paths only. Real writes should be performed by backend workers after approval, credit reservation, and dependency readiness.

## What Remains Mock-Only

- No file is uploaded to live/cloud storage. The bounded 4K proof writes only
  disposable private local test bytes behind a GCS-compatible adapter.
- No Supabase Storage bucket is created remotely.
- No remote migration or policy deployment is run.
- No provider, rendering, SFX, music, Stripe, or Google Cloud runtime is added.
- Profile and brand upload paths are not production-ready until backend signed uploads or safe workspace-only policies exist.
- Live GCS resumable CORS/IAM/session behavior and genuinely large object tests
  are not proven. The private restart-safe finalization control plane is
  executable and capacity-admitted. A real short 3840x2160 source above the
  resumable threshold now passes interrupted chunk recovery, byte hashing,
  private probe/finalization, replay, and checksum-bound analysis-proxy
  creation. This does not replace genuinely large or long-duration tests;
  distributed dispatch, durable byte
  progress, representative worker I/O/throughput, an executed color-managed
  HDR transform, and deployed recovery are still required before production
  large-video support can be claimed.

See `docs/large-media-ingestion-and-proxy-readiness-2026-07-13.md`.
