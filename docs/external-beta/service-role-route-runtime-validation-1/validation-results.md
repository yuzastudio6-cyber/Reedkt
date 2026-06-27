# Validation Results

Packet: `RP-EXTERNAL-BETA-SERVICE-ROLE-ROUTE-RUNTIME-VALIDATION-1`

Decision: `completed_service_role_storage_object_metadata_read_route_runtime_validation`

Execution: `completed_guarded_in_process_service_role_storage_object_metadata_read_route_validation`

Target: `Reeditpro` / `wmyyttnynmteqgcdishd` / `staging`

Run ID: `2026-06-27T01-48-16-104Z-82f6c630`

Output directory: `/tmp/reeditpro-rp-external-beta-service-role-route-runtime-validation-1/2026-06-27T01-48-16-104Z-82f6c630`

Product-ready end-to-end local OSS tools: `0`

Package-lock: `unchanged`

Generated artifacts committed: `none`

## Guarded Route Readback

- App factory: `createReeditProApiApp`
- Route middleware: `requestIdMiddleware`, `requireAuth`, `errorHandlerMiddleware`
- Service factory: `createUploadService`
- Admin client: `supabase_service_role_client_from_ephemeral_process_env`
- Route auth mode: generated mock auth context for guarded in-process route harness only
- Route: `GET /v1/storage-objects/:storageObjectRecordId`
- HTTP status: `200`
- Route `ok`: `true`
- canonicalOnly: `true`
- Storage bucket: `previews`
- Database object purpose: `preview_render`
- Route object purpose: `preview`
- Storage object status: `ready`
- Route checksum SHA-256: `e427bf7c375cc1a52272fffb4c12a12c1d8b04d6a586320566c2a3461ade0253`
- Signed URL returned: `false`
- signed URL creation: `false`
- public artifact creation: `false`

## Fixture Setup And Cleanup

The confirmed runner inserted a generated workspace, workspace member, project, and `storage_object_records` row for route readback, then deleted the generated rows after the route read.

- Workspace inserted: `1`
- Workspace member inserted: `1`
- Project inserted: `1`
- Storage object record inserted: `1`
- Route fixture cleanup residue count: `0`
- Workspace residue: `0`
- Workspace member residue: `0`
- Project residue: `0`
- Storage object record residue: `0`
- Persistent rows created: `false`

No Supabase storage object was created, read, or deleted by this route proof. No upload, signed URL, download target, local object, worker, render, provider, job write, or credit write route was executed.

## Artifacts And Checksums

Local evidence remained under `/tmp` and was not committed.

| File | Bytes | SHA-256 |
| --- | ---: | --- |
| `artifact-manifest.json` | 1615 | `682eb65b765996e9a3aa669c7f76575ca204de92b9734a66b967918b8ea27acb` |
| `validation-report.json` | 5839 | `25772fc0efe3d6d1aa699a1408ec621cc7df0dbe13bb52fe526b3939030fbb65` |
| `route-fixture-setup-readback.json` | 612 | `6fca56f02fd4b60d7153194a5ab7493e9c746a1c6720b7865c7766099d3af57d` |
| `service-role-storage-object-read-route-readback.json` | 957 | `f272691f64611c74dadcfd24e0de624e5f62b1574a1909e2d7b4b4a5567e686c` |
| `route-fixture-cleanup-residue-readback.json` | 92 | `832cefec4ad7a3eae635e1adbb7d75150abcd6d92b2347a477277d6acf496b33` |

## Validation Commands

- `npm ci --no-audit --no-fund --progress=false`: passed
- `REEDITPRO_CONFIRM_EXTERNAL_BETA_SERVICE_ROLE_ROUTE_RUNTIME_VALIDATION=true npm run rp-external-beta-service-role-route-runtime-validation-1-confirmed`: passed on second accepted run after correcting the proof expectation to match the existing route adapter contract (`preview_render` database value maps to route `preview`)
- `git diff --check`: passed
- `npm run lint`: passed
- `npm run typecheck:server`: passed
- `npm run build`: passed
- `npm run build:server`: passed
- `npm run --silent rp-external-beta-service-role-route-runtime-validation-1:diagnostics`: passed
- `npm run --silent rp-external-product-beta-current-readiness-rollup-1:diagnostics`: passed
- `npm run --silent rp-external-beta-private-artifact-storage-access-guarded-remote-write-1:diagnostics`: passed
- `git diff --cached --check`: passed
- Non-executing changed-file and staged safety scans: passed
