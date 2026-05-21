# RP-E2E-READY-01 Upload + Storage Connection

This milestone adds the first server-only bridge between upload intents, temporary upload/download targets, canonical storage records, media assets, and chat source order. It is safe for local editing tests and stays mock/local by default.

## What It Adds

- `STORAGE_MODE=local`: writes test files under `LOCAL_STORAGE_ROOT` and serves them only through backend routes.
- `STORAGE_MODE=gcs_disabled`: fails closed with clear disabled responses.
- `STORAGE_MODE=gcs`: future GCS boundary. The adapter is server-only and only runs when the mode and bucket env are explicitly configured.
- Canonical object paths under `workspaces/{workspaceId}/projects/{projectId}/...`.
- Upload intent creation with a temporary target and a signed URL audit event.
- Local raw body upload through `PUT /v1/upload-intents/:uploadIntentId/local-object`.
- Finalization that verifies the object, creates storage metadata, creates/links a media asset, and updates the upload intent.
- Storage object metadata and temporary download target routes.
- Finalized clip attachment to chat/source sequence order without starting AI planning, provider calls, or rendering.

## Canonical Truth

Canonical storage records store only:

```text
bucketName + objectPath
```

Temporary upload/download targets can be returned to clients and audited in `signed_url_events`, but the URL itself is not stored as canonical truth. This keeps future signed URLs short-lived and replaceable.

## Local Mode Flow

1. Client calls `POST /v1/projects/:projectId/upload-intents`.
2. Server validates purpose, MIME type, expected size, and filename.
3. Server creates an upload intent and returns a temporary backend upload target.
4. Client uploads bytes with `PUT /v1/upload-intents/:uploadIntentId/local-object`.
5. Server writes bytes under `LOCAL_STORAGE_ROOT`, computes size and SHA-256, and returns temporary metadata.
6. Client calls `POST /v1/upload-intents/:uploadIntentId/finalize`.
7. Server verifies the object and returns the upload intent, storage object record, and media asset.
8. Client can attach finalized `mediaAssetIds` to chat source order.

## Future GCS Mode

`@google-cloud/storage` is imported only by `server/storage/gcs-storage-adapter.ts`. GCS remains dormant unless `STORAGE_MODE=gcs` and bucket env is complete. Frontend code never receives credentials and never imports GCS code.

## Safety Rules

- No provider calls.
- No Stripe calls.
- No rendering.
- No Cloud Run deployment.
- No service-role key exposure.
- No signed URLs stored as canonical records.
- Workers still must execute approved snapshots, not raw chat.
- Expensive work still requires approved edit plan, approved credit estimate, and reserved credits.

## Still Not Implemented

- Multipart uploads.
- Production GCS IAM, signed URL policy review, and bucket lifecycle rules.
- Supabase transactional RPCs for finalizing uploads and attaching source sequences atomically.
- Media probing, thumbnails, transcoding, or QA.
- Real provider, render, or worker execution.
