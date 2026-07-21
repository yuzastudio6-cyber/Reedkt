# Edit Reference upload-intent idempotency hardening

Date: 2026-07-20
Status: local/private route verified; hosted resumable recovery remains gated

## Fixed boundary

`POST /v1/edit-references/:referenceId/upload-intents` previously required an `Idempotency-Key` at middleware but did not pass that key to the upload service's durable domain record. The generic middleware could also retain the response body even though it contains a temporary upload target.

The route now:

- verifies workspace write/editor authority before sensitive-key validation or upload-intent creation;
- validates the key with the sensitive-response middleware;
- passes the exact key into the upload service;
- lets the workspace-scoped upload authority own replay and changed-request conflict detection;
- avoids placing temporary upload-target material in the generic response replay cache.

The focused route smoke proves that a viewer is denied before persistence or sensitive-key handling, an editor advances to the deliberately fail-closed production-persistence gate, the same key and same local/private request return the same upload-intent identity, no generic replay header is used, and the same key with changed file metadata fails with `IDEMPOTENCY_CONFLICT`.

## Honest remaining boundary

This change does not by itself prove browser-reload recovery or live GCS resumable-session recovery. The browser still needs a credential-free recovery descriptor and the shared backend must reissue or recover the upload target without persisting bearer URLs, duplicating a resumable provider session, or losing the verified byte offset.

The shared project upload-intent route has a related middleware/domain-idempotency audit owned by the backend pipeline. This feature change does not modify that route or the shared upload-service implementation.

No provider, cloud, Supabase, SQL, billing, deployment, or public-delivery authority is activated.
