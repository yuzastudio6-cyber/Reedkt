# Canonical Durable Upload-Target Authority

Status: protected local/internal conformance and canonical V3 loopback
Postgres/PostgREST lifecycle passed; production remains blocked.

This slice closes the source-level ordering defect that could create a temporary
GCS resumable session before ReEditPro had durably committed the corresponding
upload intent and one-use issuance claim. The upload service now supports one
injected, process-branded authority pair:

- a serializable upload-intent/target-issuance transaction port; and
- a server-only temporary-credential escrow.

When injected, the order is fixed: authenticated scope check, immutable intent
commit, one-use issuance claim, storage target creation, credential escrow, and
issuance commit. A lost HTTP response reads the committed intent and returns the
same escrowed target. An unknown target-creation, escrow, or commit outcome is
terminal for that issuance attempt and cannot create a second storage session.
A concurrent same-key request observes the bounded active claim and waits for
exact readback instead of marking it failed. An expired credential is never
returned and is never replaced silently; recovery remains fail-closed until a
separate reviewed reissue lifecycle exists.

Canonical persistence contains target metadata and SHA-256 digests only. It
does not contain the session URL, upload headers, bearer credential, raw media,
customer price, customer credits, service fee, wallet mutation, or billing
authority. The existing private upload-media authority remains the downstream
local lifecycle/finalization projection; the new port is the pre-media intent
and temporary-target authority and does not create a second queue or worker.

The in-memory adapter and process-memory escrow are contract fixtures only. A
2026-07-29 canonical V3 local follow-up now provides a real loopback
Postgres/PostgREST transaction adapter with forced RLS, authenticated tenant
isolation, exact idempotency-response association, restart-safe lifecycle
state, and backup/reset/restore evidence. A second local-only follow-up stores
the temporary target as AES-256-GCM ciphertext with a separately wrapped data
key, proves fresh-process recovery, wrong-key rejection, tenant isolation,
expiry scrubbing, and deletion, and never stores the plaintext credential in
canonical Postgres. Both adapters remain loopback-only and still report
multi-replica durability, live GCS issuance, Cloud KMS, remote database
mutation, and production authority as false.

Production still requires multi-replica read-after-write evidence, live GCS
issuance, an envelope-encrypted multi-replica credential escrow with
expiry/deletion evidence, and released hosted deployment/RLS evidence. Hosted
upload creation therefore continues to fail closed.

The local-only authority also supports a bounded authenticated
`resumable_content_range_v1` target for source files above 16 MiB. Each request
remains at or below the original raw-body cap, carries an exact byte range and
chunk SHA-256, and may resume only from the status route's server-verified
offset. Target and status routes are encrypted in the existing escrow and
digest-bound in canonical issuance metadata; they are not stored as plaintext
canonical state.

Verification:

```text
npm run smoke:canonical-durable-upload-target-authority
npm run smoke:canonical-durable-upload-target-local-postgres
npm run smoke:upload-boundary-security
npm run smoke:upload
npm run smoke:local-resumable-source-upload
npm run typecheck:server
```

The original focused smoke exercises both the authority directly and the actual
`POST /v1/projects/:projectId/upload-intents` route through the application
runtime injection seam. The route does not use generic response caching for the
temporary target; the domain authority returns the same intent and target.
The frozen local conformance contains 14 adversarial checks and has evidence
digest `bb494e2f2395abc9f72e579de762467b280428a699f643df34c3ee7aa8931432`.

The canonical V3 follow-up adds migration
`202607210021_canonical_durable_upload_target_rpc.sql`, followed by encrypted
escrow migration `202607210022_canonical_upload_target_credential_escrow_rpc.sql`,
fixed RPC adapters, a real loopback PostgREST smoke, SQL postconditions, and
inclusion in the 61-table destructive local backup/reset/restore rehearsal. See
`docs/canonical-v3-local-durable-upload-target-verification-2026-07-29.md`.

No remote SQL, remote migration, live GCS session, provider request, billing,
deployment, production rendering, or public delivery was performed.
