# GCS Upload Integrity Hardening — 2026-07-10

Status: `source_hardened_live_gcs_unverified`

This change closes the source-level signed-upload overwrite and false-checksum boundary. It did not contact Google Cloud, upload an object, change IAM, create a bucket, deploy code, or mutate Supabase.

## Security contract

### Signed PUT is create-only

Every GCS V4 signed PUT now signs and returns:

```text
x-goog-if-generation-match: 0
```

Cloud Storage accepts that special precondition only when no live object exists at the target name. A repeated signed request therefore receives `412 Precondition Failed` instead of replacing the first upload. ReeditPro object paths already contain an upload-intent UUID, so an accepted upload remains immutable at that path.

The client must send every returned signed header exactly. ReeditPro no longer asks the client to send `x-goog-meta-sha256` because custom object metadata is caller-controlled and is not byte-integrity evidence.

Google's relevant provider contract is documented in:

- <https://cloud.google.com/storage/docs/request-preconditions>
- <https://cloud.google.com/storage/docs/xml-api/reference-headers#xgoogifgenerationmatch>

### Ready requires backend byte evidence

GCS metadata lookup now returns provider size, MIME, generation, ETag, and metageneration, but never treats custom `metadata.sha256` as trusted.

Before a source or reference upload can become `ready`, the backend:

1. reads provider metadata and requires generation plus ETag;
2. binds the object stream to that exact generation;
3. enables the GCS client's CRC32C transport validation;
4. hashes the actual stored bytes with SHA-256 on the backend;
5. compares actual byte count with provider and upload-intent size;
6. compares the backend hash with the optional user-declared checksum;
7. re-reads the exact generation and requires the same ETag;
8. records checksum provenance as `server_computed_bytes`.

`upload-service.ts` refuses to finalize source/reference media unless `integrityVerified` is true and `checksumSource` is `server_computed_bytes`. A syntactically valid client checksum string is therefore insufficient.

### Durable object identity and generation-bound delivery

Finalized media metadata preserves:

- GCS generation;
- GCS ETag;
- optional metageneration;
- backend-computed SHA-256.

The current noncanonical database history has no dedicated generation/ETag columns on `storage_object_records`, so the runtime also stores the identity in the existing private `media_assets.metadata.storageObjectIdentity` object and resolves it for later delivery. A future canonical schema should promote generation and ETag to constrained first-class columns before production migration.

GCS signed downloads require the finalized generation and ETag. The generated signed read targets the exact generation. Backend streams first resolve and validate a generation/ETag snapshot, then stream that generation rather than the mutable live object name.

Backend-owned GCS writes also use create-only generation preconditions. A retry after a lost response is accepted only when the existing object's server-computed byte count and SHA-256 exactly match; a collision is rejected without deleting the pre-existing generation.

### Rejected-object cleanup

Size, stored-byte-count, or SHA-256 mismatch prevents finalization. The adapter attempts deletion using the exact verified generation and an `ifGenerationMatch` precondition. MIME or missing-integrity evidence also causes the upload service to attempt exact-generation deletion and mark the upload intent failed.

Deletion failure never makes an object ready. Cleanup warnings remain backend evidence only.

Uploads that are accepted by GCS but never finalized remain orphan candidates. They require a reviewed bucket lifecycle rule and reconciliation worker; source code alone cannot guarantee their deletion.

## Focused evidence

Run:

```bash
npm run smoke:gcs-upload-integrity-security
npm run smoke:upload
npm run smoke:upload-boundary-security
npm run smoke:gcs-upload-to-private-internal-edit-route
npm run smoke:gcs-source-media-processing-staging
npm run smoke:gcs-private-internal-test-run-route
```

The focused GCS integrity smoke proves with a deterministic provider double:

- the signed V4 configuration includes the create-only header;
- the first PUT succeeds and replay/overwrite fails;
- caller-controlled custom SHA-256 metadata is ignored;
- actual generation bytes are hashed;
- false checksum verification fails;
- the rejected generation is deleted with exact identity;
- generation and ETag survive verification;
- signed download and backend reads bind to the finalized generation;
- ETag mismatch is rejected.
- backend write retries accept only byte-identical existing output and never delete a mismatched collision.

The upload service smoke separately proves a forged checksum metadata value cannot finalize without trusted byte-evidence provenance and triggers cleanup.

## Deployment constraints still open

Production remains blocked until deployed evidence proves:

1. GCS CORS allows the required `content-type` and `x-goog-if-generation-match` request headers and no broader unsafe upload headers.
2. The signing identity has least privilege. Prefer object creation plus required read/cleanup permissions; do not grant broad bucket administration.
3. A real signed PUT replay returns `412` in the configured bucket.
4. Real metadata exposes stable generation/ETag and CRC32C validation completes for representative video sizes.
5. Bucket versioning, retention, soft-delete, and lifecycle settings match exact-generation cleanup semantics.
6. Orphaned unfinalized uploads are reconciled and expired safely.
7. Malware/content scanning and isolated media parsing run before external-beta readiness.
8. Canonical persistence has first-class generation/ETag constraints and two-tenant negative tests.
9. Distributed upload quotas and edge/WAF controls are deployed.

No production-security claim should be made until those live integration checks pass.
