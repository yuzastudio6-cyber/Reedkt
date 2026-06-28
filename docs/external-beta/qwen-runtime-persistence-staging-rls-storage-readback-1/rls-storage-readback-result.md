# RLS And Storage Readback Result

Readback target: `Reeditpro` / `wmyyttnynmteqgcdishd` / `staging`

Readback command class: `psql_read_only_catalog_selects`

Remote mutation: `false`

Observed readback:

| Check | Observed |
| --- | ---: |
| Baseline runtime tables present | `13` |
| Baseline runtime tables with RLS enabled | `13` |
| Runtime table policy count | `23` |
| Required ReEditPro private buckets | `8` |
| Public ReEditPro buckets | `0` |
| Storage object authenticated policies | `6` |
| Storage object anon policies | `0` |
| `worker-temp` normal-user policy mentions | `0` |
| QWEN constraints | `6` |
| QWEN indexes | `5` |
| `storage_object_records` signed URL columns | `0` |
| `signed_url_events` URL value columns | `0` |
| Runtime raw prompt columns | `0` |

Storage policies observed:

- `reeditpro_project_editors_update_source_and_thumbnails`
- `reeditpro_project_editors_update_workspace_source_and_thumbnail`
- `reeditpro_project_editors_upload_source_and_thumbnails`
- `reeditpro_project_editors_upload_workspace_source_and_thumbnail`
- `reeditpro_project_members_read_project_objects`
- `reeditpro_project_members_read_workspace_project_objects`

Result: `passed_read_only_rls_storage_catalog_readback`

Private buckets remain private. No anonymous storage object policy was observed. `worker-temp` remains backend/service-role-only by policy absence for normal user storage access.
