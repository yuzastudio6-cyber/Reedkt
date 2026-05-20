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

Planning limits are placeholders: source media 2 GB, references/generated assets 1 GB, previews 2 GB, exports 5 GB, thumbnails/profile/brand 20 MB, and audio assets 200 MB.

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

- No file is uploaded by this task.
- No Supabase Storage bucket is created remotely.
- No remote migration or policy deployment is run.
- No provider, rendering, SFX, music, Stripe, or Google Cloud runtime is added.
- Profile and brand upload paths are not production-ready until backend signed uploads or safe workspace-only policies exist.
