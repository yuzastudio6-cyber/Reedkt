# GCP Secret Manager Supabase Secret Matrix

This matrix records required Supabase Secret Manager reference names. It records no secret values and does not verify Secret Manager access.

Current status for every row: `reference_required` and `access_not_verified`.

| Reference name | Environment | Purpose | Allowed usage | Forbidden usage | Metadata discovery allowed? | Frontend visible? | Worker visible? | Service-role required? | Approval required | Rotation required | Evidence allowed in docs | Current status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `GCP_SECRET_REF_SUPABASE_STAGING_PROJECT_REF` | staging | Identify future staging project reference. | Redacted evidence and approved command packet reference only. | Raw project value in docs, logs, SQL, PRs, or frontend. | Future approved metadata-only list. | No | No | No | Yes | Yes | Reference name only. | `reference_required`; `access_not_verified` |
| `GCP_SECRET_REF_SUPABASE_STAGING_DB_URL` | staging | Future staging database connection reference. | Approved staging validation context only. | Raw DB URL, password, connection string, or SQL execution without approval. | Future approved metadata-only list. | No | No | No | Yes | Yes | Reference name only. | `reference_required`; `access_not_verified` |
| `GCP_SECRET_REF_SUPABASE_STAGING_ANON_KEY` | staging | Future staging anon key reference. | Future reviewed public-client config path only. | Direct frontend paste, docs, logs, or PR body value. | Future approved metadata-only list. | No | No | No | Yes | Yes | Reference name only. | `reference_required`; `access_not_verified` |
| `GCP_SECRET_REF_SUPABASE_STAGING_SERVICE_ROLE_KEY` | staging | Future staging service-role key reference. | Approved backend/service account context only. | Frontend, browser, logs, docs, SQL fixtures, or manual unreviewed use. | Future approved metadata-only list. | No | Future approved backend only | Yes | Yes | Yes | Reference name only. | `reference_required`; `access_not_verified` |
| `GCP_SECRET_REF_SUPABASE_STAGING_JWT_SECRET` | staging | Future staging JWT secret reference. | Approved backend verification context only. | Any docs, logs, frontend, PR body, or command output value. | Future approved metadata-only list. | No | Future approved backend only | Yes | Yes | Yes | Reference name only. | `reference_required`; `access_not_verified` |
| `GCP_SECRET_REF_SUPABASE_STAGING_STORAGE_ENDPOINT` | staging | Future staging storage endpoint reference. | Redacted inventory and approved storage policy review only. | Signed URL creation, storage transfer, or raw endpoint value in docs. | Future approved metadata-only list. | No | No | No | Yes | Yes | Reference name only. | `reference_required`; `access_not_verified` |
| `GCP_SECRET_REF_SUPABASE_PRODUCTION_PROJECT_REF` | production | Identify future production project reference. | Redacted production separation evidence only. | Staging packets, docs with raw value, or execution. | Future approved metadata-only list. | No | No | No | Yes | Yes | Reference name only. | `reference_required`; `access_not_verified` |
| `GCP_SECRET_REF_SUPABASE_PRODUCTION_DB_URL` | production | Future production database connection reference. | Future production-approved context only. | Any staging command, raw DB URL, SQL execution, or migration deployment. | Future approved metadata-only list. | No | No | No | Yes | Yes | Reference name only. | `reference_required`; `access_not_verified` |
| `GCP_SECRET_REF_SUPABASE_PRODUCTION_ANON_KEY` | production | Future production anon key reference. | Future reviewed public-client config path only. | Direct frontend paste, docs, logs, or staging use. | Future approved metadata-only list. | No | No | No | Yes | Yes | Reference name only. | `reference_required`; `access_not_verified` |
| `GCP_SECRET_REF_SUPABASE_PRODUCTION_SERVICE_ROLE_KEY` | production | Future production service-role key reference. | Future production backend/service account context only. | Frontend, staging packets, docs, logs, or unreviewed manual use. | Future approved metadata-only list. | No | Future approved backend only | Yes | Yes | Yes | Reference name only. | `reference_required`; `access_not_verified` |
| `GCP_SECRET_REF_SUPABASE_PRODUCTION_JWT_SECRET` | production | Future production JWT secret reference. | Future production backend verification context only. | Any docs, logs, frontend, PR body, or command output value. | Future approved metadata-only list. | No | Future approved backend only | Yes | Yes | Yes | Reference name only. | `reference_required`; `access_not_verified` |
| `GCP_SECRET_REF_SUPABASE_PRODUCTION_STORAGE_ENDPOINT` | production | Future production storage endpoint reference. | Redacted separation evidence only. | Signed URL creation, storage transfer, raw endpoint value, or staging use. | Future approved metadata-only list. | No | No | No | Yes | Yes | Reference name only. | `reference_required`; `access_not_verified` |

## Matrix Notes

- `Frontend visible?` is `No` for Prompt 25A because no value is exposed. Future public client configuration still requires a reviewed path.
- `Worker visible?` is future-only and limited to approved service accounts.
- No row means access is granted.
- No row means staging, production, SQL, storage, or migration execution is approved.
- Metadata discovery means reference existence only. It does not mean payload access or value verification.
