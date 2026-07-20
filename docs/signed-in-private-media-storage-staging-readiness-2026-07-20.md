# Signed-In Private Media Storage Staging Readiness — 2026-07-20

Status: `source_contract_ready_remote_activation_not_run_distributed_large_media_finalization_blocked`

## Outcome

ReEditPro now has one confirmation-gated Google Cloud staging workflow for the
private media storage required by the signed-in website. The workflow is bound
to the exact reviewed continuation branch and SHA, creates or hardens eight
regional staging buckets, and emits an immutable sanitized evidence artifact
that the private browser gateway must consume from the same SHA.

No workflow was dispatched and no Google Cloud resource was changed by this
source slice. The checked-in workflow is activation authority, not evidence
that the live buckets or IAM already match it.

## Exact Storage Contract

The staging lane uses purpose-separated buckets for source media, generated
assets, processed media, previews, exports, thumbnails, QA artifacts, and
worker temporary objects. The activation workflow requires:

- `us-east1`, Standard storage class, uniform bucket-level access,
  public-access prevention, and no object versioning;
- a seven-day soft-delete recovery window;
- explicit staging lifecycle deletion: 30 days for source/exports/thumbnails,
  14 days for generated/processed/QA artifacts, seven days for previews, and
  one day for worker temporary objects;
- exact GitHub Pages CORS only on the source bucket, including `Content-Type`,
  `Content-Range`, committed `Range`, create-only generation preconditions, and
  generation/hash/ETag response evidence;
- `roles/storage.objectUser` only for the API runtime on source media, read-only
  object access for the other seven buckets, and self-scoped `signBlob`
  authority for temporary V4 URLs; and
- no public or all-authenticated bucket principal.

The read-only verifier is:

```bash
npm run staging:verify-signed-in-private-media-storage-readiness
```

Audit mode emits a sanitized report and exits zero even when blocked. Setting
`REEDITPRO_REQUIRE_PRIVATE_MEDIA_STORAGE_READY=true` makes any missing gate
fail the command. The verifier lists/describes resources and reads IAM only; it
does not read or write object bytes, generate signed URLs, create resumable
sessions, mutate cloud state, contact Supabase/providers, or charge anyone.

## Same-SHA Deployment Chain

The required order is:

1. Dispatch `Signed-In Private Media Storage Staging Activation` with both
   exact confirmations and the reviewed source SHA.
2. Preserve its attempt-specific evidence artifact.
3. Dispatch `Private Browser API Gateway Staging Activation` for the same
   branch/SHA and pass the successful storage activation run ID.
4. The gateway workflow verifies the Actions run, downloads the exact artifact,
   validates its closed schema, and derives all eight bucket environment values
   from it before Google Cloud authentication or deployment.
5. Only the matching gateway artifact may feed the signed-in Pages deployment.

This removes the previous disconnected state in which an isolated GCS canary
existed while the actual website API still deployed with
`STORAGE_MODE=gcs_disabled`.

## Honest Large-Media Boundary

The hosted API configuration enables GCS for bounded source/reference
transport, but deliberately sets
`REEDITPRO_LARGE_MEDIA_FINALIZATION_MODE=disabled`. A source above 16 MiB is
rejected before an upload target or resumable credential is issued and before
object bytes leave the browser. This is safer than accepting a huge object
that the deployed system cannot yet finalize.

The existing private single-host finalizer remains valid only for local/mock
testing. Production startup rejects that mode. The reserved future
`distributed` enum value also fails startup and upload admission in this source
build, so configuration cannot silently claim the missing capability. ReEditPro must add a durable,
tenant-isolated distributed finalization authority with dispatch, lease,
heartbeats, restart recovery, exact-byte hashing/probing, capacity admission,
cost evidence, and replay before the hosted high-ceiling upload contract can be
activated.

The source and reference product ceilings remain 1 TiB and 250 GiB. They are
validation ceilings, not current hosted entitlements or throughput claims.

## Evidence

```bash
npm run smoke:signed-in-private-media-storage-readiness
npm run smoke:gcs-upload-integrity-security
npm run smoke:large-media-ingest-readiness
npm run smoke:large-media-background-finalization
npm run smoke:google-api-gateway-readiness
npm run smoke:google-api-gateway-staging-activation
npm run smoke:app-internal-testing-pages-deploy-readiness
npm run typecheck:server
```

The new adversarial proof rejects missing CORS, an incorrect worker-temp
lifecycle, a public bucket member without exposing that principal, missing
runtime signing authority, a conditional substitute for the required
unconditional runtime role, a non-Standard bucket, target substitution,
missing production bucket configuration, and private single-host finalization in production. The
large-media smoke also proves disabled hosted finalization issues no upload
target.

No provider call, model call, customer price, credit, wallet, billing,
Supabase mutation, object write, object delete, deployment, public delivery, or
production promotion is authorized or claimed.
