# Canonical Durable Upload-Target Authority

Status: protected local/internal conformance passed; production remains blocked.

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

The in-memory adapter and process-memory escrow are contract fixtures only. They
cannot self-promote because production requires a Postgres transaction adapter,
multi-replica read-after-write, exact idempotency-response association, an
explicit canonical upload-lifecycle projection, authenticated tenant isolation,
live GCS issuance evidence, and envelope-encrypted multi-replica credential
escrow with expiry/deletion evidence. No such live adapter is installed by this
slice, so hosted upload creation continues to fail closed.

Verification:

```text
npm run smoke:canonical-durable-upload-target-authority
npm run smoke:upload-boundary-security
npm run smoke:upload
npm run typecheck:server
```

The focused smoke exercises both the authority directly and the actual
`POST /v1/projects/:projectId/upload-intents` route through the application
runtime injection seam. The route does not use generic response caching for the
temporary target; the domain authority returns the same intent and target.
The frozen local conformance contains 14 adversarial checks and has evidence
digest `bb494e2f2395abc9f72e579de762467b280428a699f643df34c3ee7aa8931432`.

No SQL, migration, Supabase mutation, GCS session, provider request, billing,
deployment, production rendering, or public delivery was performed.
