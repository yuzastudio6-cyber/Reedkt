# Validation Results

Packet: `RP-EXTERNAL-BETA-PRIVATE-ARTIFACT-STORAGE-ACCESS-GUARDED-REMOTE-WRITE-1`

Decision: `completed_private_artifact_storage_access_guarded_remote_write_readback`

Execution: `completed_guarded_generated_private_storage_object_write_read_delete_and_transaction_rolled_back_artifact_metadata_readback`

Target: `Reeditpro` / `wmyyttnynmteqgcdishd` / `staging`

Run ID: `2026-06-27T01-26-45-265Z-df201682`

Output directory: `/tmp/reeditpro-rp-external-beta-private-artifact-storage-access-guarded-remote-write-1/2026-06-27T01-26-45-265Z-df201682`

Product-ready end-to-end local OSS tools: `0`

Package-lock: `unchanged`

Generated artifacts committed: `none`

## Remote Readback

- Expected private buckets: `8`
- Present private bucket count: `8`
- Missing private buckets: `[]`
- private bucket public count: `0`
- Anonymous storage object policy count: `0`
- Storage bucket used: `previews`
- Storage payload mime type: `application/json`
- Storage payload bytes: `373`
- Storage payload SHA-256: `91d573dfbbc72fdc0cf7f0532c90e8de719eb4d081419ad2c871b0a117e65d94`
- Storage object upload completed: `true`
- Storage object readback completed: `true`
- Storage object checksum matched: `true`
- Storage object cleanup completed: `true`
- Post-delete readback blocked: `true`
- storage object residue count: `0`
- signed URL creation: `false`
- public artifact creation: `false`

## Metadata Transaction Readback

The runner used `set local role service_role` inside a generated validation transaction, inserted/read back `storage_object_records`, `artifact_manifests`, `artifact_manifest_items`, and `audit_events`, then rolled back.

- `storage_object_records` inserted/read back: `1`
- `artifact_manifests` inserted/read back: `1`
- `artifact_manifest_items` inserted/read back: `1`
- Audit event inserted/read back: `1`
- Storage object purpose: `preview_render`
- Storage object status: `ready`
- Artifact manifest role: `preview`
- Artifact manifest status: `ready`
- Artifact manifest item role: `preview`
- artifact metadata rollback residue count: `0`

## Artifacts And Checksums

Local evidence remained under `/tmp` and was not committed.

| File | Bytes | SHA-256 |
| --- | ---: | --- |
| `artifact-manifest.json` | 2055 | `16ee022cb847d5367f05678880c69cf50b4f83f407f10f174e3351b039960b2d` |
| `validation-report.json` | 4918 | `809bea0a749e09cd63da4893e607420c719ab79d72da9d712d56bb3c91263686` |
| `private-storage-object-write-read-delete-readback.json` | 579 | `d77f891561faefc114f64d41bfc481576aef3a20780967945868ad1a660154d8` |
| `private-bucket-policy-readback.json` | 166 | `a24c768f4eb5d7732ce3d1d42d4b9014ad7628e2e60fb11e6c31333f2f0608ed` |
| `private-artifact-metadata-write-readback.json` | 781 | `8ef4e302e9de3b1e99e55f9bca53665ad3d1d418c8adc2d8b0c5be0da4d9d5c5` |
| `rollback-residue-readback.json` | 107 | `997207e57bfb3c9463b2258b630bdb614ef661ef8b7fc6c064475201755825af` |

## Validation Commands

- `npm ci --no-audit --no-fund --progress=false`: passed
- `REEDITPRO_CONFIRM_EXTERNAL_BETA_PRIVATE_ARTIFACT_STORAGE_ACCESS_REMOTE_WRITE=true npm run rp-external-beta-private-artifact-storage-access-guarded-remote-write-1-confirmed`: passed
- `git diff --check`: passed
- `npm run lint`: passed
- `npm run typecheck:server`: passed
- `npm run build`: passed
- `npm run build:server`: passed
- `npm run --silent rp-external-beta-private-artifact-storage-access-guarded-remote-write-1:diagnostics`: passed
- `npm run --silent rp-external-product-beta-current-readiness-rollup-1:diagnostics`: passed
- `npm run --silent rp-external-beta-job-queue-lease-event-guarded-remote-write-1:diagnostics`: passed
- `git diff --cached --check`: passed
- Non-executing changed-file and staged safety scans: passed
