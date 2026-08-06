# Canonical V3 Local Encrypted Upload-Target Credential Escrow Verification

Date: 2026-07-29
Status: local envelope encryption, restart recovery, expiry, and deletion
verified; distributed and hosted production remain blocked.

## Outcome

The canonical V3 local upload-target flow no longer depends on process-memory
storage for a resumable upload-session URI. A server-only adapter now:

1. normalizes and validates the temporary `UploadTarget`;
2. encrypts its strict canonical JSON with a random 256-bit data key using
   AES-256-GCM;
3. wraps that data key with a separate process-branded key-wrap capability;
4. sends only ciphertext, wrapped-key material, nonces, authentication tags,
   expiry, and SHA-256 lineage to fixed PostgREST RPCs; and
5. decrypts only after a fresh server process re-reads and revalidates the
   encrypted record.

The local proof deliberately uses a controlled in-process wrapping key that is
supplied again to a fresh adapter instance. The wrapping key is not written to
PostgreSQL, the manifest, logs, receipts, or source. This proves the
envelope-encryption and restart contract, not Cloud KMS, workload identity,
secret rotation, or multi-replica key availability.

## Durable database surface

Migration
`202607210022_canonical_upload_target_credential_escrow_rpc.sql` adds two
forced-RLS, RPC-only tables:

- `canonical_upload_target_credential_escrow`;
- `canonical_upload_target_credential_escrow_audit_events`.

It exposes exactly three authenticated, server-signed functions:

- `reeditpro_put_upload_target_credential_envelope_v1`;
- `reeditpro_read_upload_target_credential_envelope_v1`;
- `reeditpro_delete_upload_target_credential_envelope_v1`.

The database never accepts plaintext target JSON. Active rows contain
AES-GCM ciphertext and wrapped-key fields only. Deletion scrubs the ciphertext,
wrapped key, nonces, tags, encryption metadata, and envelope digest while
retaining a non-secret tombstone and immutable audit lineage.

## Executed proof

The loopback Postgres/PostgREST smoke verified:

- one real encrypted write in the upload-intent-before-target issuance flow;
- a fresh transaction adapter, HTTP client, key-wrap capability, and escrow
  adapter recover the exact target without creating a second session;
- a same-credential put is an exact replay and does not replace the first
  ciphertext;
- a different key cannot decrypt the record;
- another authenticated tenant cannot read the record;
- an expired credential is never decrypted or returned and its encrypted
  material is scrubbed;
- explicit deletion is idempotent and leaves no encrypted material;
- an unknown target-creation outcome still blocks a duplicate side effect;
- forced RLS, direct-table denial, fixed RPC grants, envelope/audit hashes, and
  plaintext exclusion pass SQL postconditions; and
- the encrypted records and deletion history survive the private data-only
  backup, destructive reset, and restore rehearsal.

The canonical recovery inventory is 61 reviewed data tables. The active local
fixture contains one encrypted credential record and two scrubbed tombstones.
No upload URL, upload header, bearer credential, plaintext data key, wrapping
key, media byte, customer price, credit amount, or service fee is present in
canonical persistence.

The upload change was also regressed through both genuine-media signed-in
private-edit canaries. The browser-local and real loopback Supabase-auth flows
each uploaded the 24,208-byte source
`5f88f9c5a16bfe5b3747a874b77b31892dbc753d79d3c3c0c6f00d729e46babd`,
created and approved a canonical plan, executed the private work graph,
loaded the initial review, requested an exact caption revision, created and
reapproved plan version 2, rendered the revision, accepted it, and downloaded
the 220,608-byte final
`00a6d3b50523f4fcf70a11de7374a972c54a84bd69e298005426d54a486a469e`.
Those canaries use backend-local private media and do not claim live GCS,
multi-replica escrow, provider execution, public delivery, or production.

Executed commands included:

```text
database/canonical-v3-local/run-local-verification.sh
npm run test:internal-testing:local-private-review-e2e
npm run test:internal-testing:supabase-auth-local-private-review-e2e
npm run smoke:prod-tool-registry
npm run smoke:canonical-private-tool-summary
npm run lint
npm run build
npm run check:frontend-boundary
npm run check:secrets
```

## Authority boundary

The escrow descriptor truthfully reports:

- `implementationClass=server_envelope_encrypted_ephemeral_store`;
- `envelopeEncryptionVerified=true`;
- `expiryAndDeletionVerified=true`;
- `multiReplicaRecoveryVerified=false`;
- `productionAuthority=false`.

Production remains blocked on a released Cloud KMS or equivalent key-wrap
authority, workload identity, rotation and revocation, independent
multi-replica read-after-write evidence, hosted RLS/deployment proof, and live
GCS resumable-session issuance. The local controlled target still uses the
non-routable `storage.invalid` host.

No remote SQL, remote migration, live secret access, Google Cloud mutation,
customer billing, provider execution, worker dispatch, rendering, deployment,
or public delivery was performed.
