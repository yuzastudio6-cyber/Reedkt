# Upload And Storage Boundary Hardening — 2026-07-10

Status: source-hardened; production deployment remains blocked pending edge and live-environment evidence.

## What changed

### GCS signed uploads are create-only and byte-verified

GCS V4 signed PUT targets now include a signed `x-goog-if-generation-match: 0` header. Replaying a successful upload cannot overwrite the live object. The upload target no longer includes `x-goog-meta-sha256`; custom metadata is caller-controlled and never counts as integrity evidence.

Before source/reference media becomes ready, the backend streams the exact GCS generation, uses CRC32C transport validation, computes SHA-256 over the actual stored bytes, verifies byte count, and rechecks the same generation and ETag. Generation and ETag are preserved with finalized private media metadata. Signed downloads and backend streams are generation-bound.

Failed size/checksum/MIME/integrity verification never creates ready metadata and attempts exact-generation deletion. See `docs/gcs-upload-integrity-hardening-2026-07-10.md` and run `npm run smoke:gcs-upload-integrity-security`.

### Local and GCS media probing use one private staging boundary

Upload finalization no longer hands FFprobe the original local object path and no longer copies GCS bytes with an ordinary `createWriteStream`. For source/reference video or audio, the backend now:

1. reopens the object through its `StorageAdapter`, binding GCS reads to the verified generation and ETag;
2. streams bytes into a random, scope-hashed, create-only private attempt path;
3. enforces the finalized byte count as an exact stream ceiling;
4. recomputes SHA-256 while writing and requires an exact match;
5. gives only the verified private attempt path to FFprobe; and
6. requires root-confined removal of the owned attempt before finalization returns.

Directories use `0700`, staged files use `0600`, raw tenant/upload identifiers do not appear in the staging path, retries use independent create-only attempts, and pre-stage or post-stage ancestor symlink substitution fails without mutating its external destination. Size/checksum contradictions are terminal integrity failures: no media/storage authority is created, the upload intent is failed, and GCS exact-generation cleanup is attempted. Operational stream/disk failures also create no ready authority but leave the upload intent retryable and do not delete valid provider media. An FFprobe-only timeout, missing binary, or unsupported-media parse remains an honest nonblocking `probeStatus: unavailable` after byte integrity has already passed. Cleanup failure blocks finalization and preserves the original terminal classification plus cleanup evidence; it may leave a private orphan attempt requiring reconciliation.

### Private probe attempts have exclusive ownership and bounded local recovery

Every staging attempt now acquires a new canonical UUID directory with create-only semantics and records its filesystem device/inode identity. A pre-existing directory is never adopted, collision retries are bounded, concurrent cleanup callers share one promise, and cleanup removes only the exact directory identity originally created by that attempt. An ancestor or attempt-path substitution therefore fails closed without deleting the replacement.

The local/private maintenance reconciler defaults to inspection only. It scans only the versioned source-probe namespace, enforces a minimum 24-hour orphan age plus hard scope/attempt/file/delete limits, retains process-local active attempts and recent/future-dated content, reports aggregate counts only, and refuses malformed names, symlinks, special entries, nested directories, or identity changes. Deletion requires the explicit single-process maintenance authority asserting both stopped request serving and exclusive ownership of the local storage root. It is serialized only inside one process and is intentionally marked unsafe for shared/distributed storage and not production-ready. See `docs/private-source-probe-orphan-reconciliation-2026-07-13.md`.

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
npm run smoke:private-source-probe-staging
npm run smoke:private-source-probe-orphan-reconciliation
npm run smoke:upload
npm run smoke:gcs-upload-to-private-internal-edit-route
npm run smoke:private-internal-edit-upload-e2e
```

## Residual production blockers

- The rate/concurrency maps are per-process. A distributed edge/WAF quota keyed by verified user, workspace, IP risk, and object-storage operation is still required before external production traffic.
- Signed object-storage limits, required precondition headers, CORS, retention/lifecycle, generation-bound cleanup, and service-account permissions must be verified in the deployed environment.
- Live Supabase RLS/catalog and Storage policy state has not been proven by source changes.
- Upload intent, idempotency, object verification, media-asset creation, storage-object creation, and finalization are not yet one atomic canonical transaction.
- Production malware/content scanning and decompression-bomb/media-parser isolation remain required.
- The source contract now rejects signed-PUT replay with `ifGenerationMatch=0`, but a real deployed GCS replay/overwrite integration test is still required.
- Orphaned uploads that reach GCS but never finalize still require a reviewed lifecycle/reconciliation job.
- FFprobe still consumes a private filesystem path. Malware/content scanning, codec/parser isolation, subprocess sandboxing, resource controls for adversarial media, and deployed representative-media evidence remain required before real-user promotion.
- Abnormal process death or cleanup refusal can still leave a private probe attempt. The bounded local reconciler covers stopped-request, exclusive-root, single-process internal maintenance only; deployed retention scheduling, cross-process/distributed locking, shared-storage semantics, observability, and a dirfd/unlinkat sandbox against hostile same-UID pathname races remain required.

No SQL, Supabase command, remote object operation, provider call, deployment, or credential change was performed in this hardening pass.
