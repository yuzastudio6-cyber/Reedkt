# Upload And Storage Boundary Hardening — 2026-07-10

Status: source-hardened; production deployment remains blocked pending edge and live-environment evidence.

## What changed

### GCS signed uploads are create-only and byte-verified

GCS V4 signed PUT targets now include a signed `x-goog-if-generation-match: 0` header. Replaying a successful upload cannot overwrite the live object. The upload target no longer includes `x-goog-meta-sha256`; custom metadata is caller-controlled and never counts as integrity evidence.

Before source/reference media becomes ready, the backend streams the exact GCS generation, uses CRC32C transport validation, computes SHA-256 over the actual stored bytes, verifies byte count, and rechecks the same generation and ETag. Generation and ETag are preserved with finalized private media metadata. Signed downloads and backend streams are generation-bound.

Failed size/checksum/MIME/integrity verification never creates ready metadata and attempts exact-generation deletion. See `docs/gcs-upload-integrity-hardening-2026-07-10.md` and run `npm run smoke:gcs-upload-integrity-security`.

### Production uploads do not traverse an Express raw-body path

The compatibility endpoint `PUT /v1/upload-intents/:uploadIntentId/local-object` is now restricted to non-production `local`/`mock` runtimes using local storage. Production and non-local runtimes fail closed before the raw-body parser and direct the client to the temporary signed/direct object-storage target returned by the upload-intent endpoint.

The local route has a separate 16 MiB hard cap. It requires:

- a supported `Content-Type`;
- an uncompressed body;
- no chunked transfer encoding;
- a positive, bounded `Content-Length`;
- exact equality between declared and received bytes;
- exact MIME and expected-size agreement with the authorized upload intent.

This is a development and focused-test compatibility boundary, not a production media transport. Large media continues to use object storage directly.

The authenticated project upload-intent route is limited to user-originated source and reference media. Worker temp, processed, generated, QA, preview, and export writes remain backend/worker responsibilities rather than user-selectable upload purposes.

### Upload authorization precedes idempotency mutation

Upload-intent creation, finalization, signed-URL event recording, and download-target creation now run their workspace/project/resource authorization middleware before `requireIdempotency`. A denied tenant request therefore cannot reserve or poison an idempotency key before authorization.

The underlying services repeat the resource checks so authorization is not dependent only on route order.

### Finalization preserves intent constraints

Finalization can no longer replace an upload intent's declared size or checksum with different client values. Verified object metadata is checked again against purpose-specific size rules, and a storage-reported MIME type must match the upload intent when available.

### Storage-object reads derive scope from canonical records

User-facing storage metadata and delivery routes no longer allow access simply because `upload_intent_id` is absent. Access now:

1. validates the requested workspace against the stored record;
2. uses the stored project, or the authorized upload intent's project when present;
3. verifies current workspace/project access;
4. rejects projectless records;
5. rejects `worker_temp` and `other` objects from user delivery;
6. requires `preview_review` for processed media and `qa_review` for QA artifacts.

This keeps worker-only artifacts behind an explicit delivery boundary instead of treating missing upload-intent provenance as authorization.

### Bounded process-local abuse controls

Without adding a dependency, the upload router now applies small per-user, process-local windows:

- local raw bytes: 12 attempts/minute and 2 concurrent requests;
- upload metadata writes: 60 attempts/minute and 8 concurrent requests.

These controls reduce accidental or single-instance abuse. They are not a distributed quota system.

## Evidence

Focused evidence is in `server/smoke/upload-boundary-security-smoke.ts`. It covers:

- authorization before idempotency;
- missing and oversized `Content-Length` rejection before raw parsing;
- a bounded authorized local upload;
- production fail-closed behavior;
- storage objects without upload intents;
- worker-temp denial;
- explicit processed-media and QA delivery boundaries;
- denial of unscoped storage records.

Run it with:

```sh
npx tsx server/smoke/upload-boundary-security-smoke.ts
```

## Residual production blockers

- The rate/concurrency maps are per-process. A distributed edge/WAF quota keyed by verified user, workspace, IP risk, and object-storage operation is still required before external production traffic.
- Signed object-storage limits, required precondition headers, CORS, retention/lifecycle, generation-bound cleanup, and service-account permissions must be verified in the deployed environment.
- Live Supabase RLS/catalog and Storage policy state has not been proven by source changes.
- Upload intent, idempotency, object verification, media-asset creation, storage-object creation, and finalization are not yet one atomic canonical transaction.
- Production malware/content scanning and decompression-bomb/media-parser isolation remain required.
- The source contract now rejects signed-PUT replay with `ifGenerationMatch=0`, but a real deployed GCS replay/overwrite integration test is still required.
- Orphaned uploads that reach GCS but never finalize still require a reviewed lifecycle/reconciliation job.

No SQL, Supabase command, remote object operation, provider call, deployment, or credential change was performed in this hardening pass.
