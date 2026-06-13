# WORKER-3 Cleanup And Rollback Plan

Cleanup state: `planned_for_worker_4`

## Local Offline Cleanup

Future WORKER-4 may create ignored local evidence only. Cleanup must remove temporary local/offline outputs when they are not needed and preserve committed sanitized summaries only.

## Failed Dry-Run Rollback

If future WORKER-4 fixture validation, manifest validation, QA validation, or no-runtime-import checks fail, the dry-run must fail closed, preserve sanitized blocker evidence, and avoid retry loops.

## Blocked Cleanup Domains

- No GCS cleanup is needed because upload remains blocked.
- No signed URL cleanup is needed because signed URLs remain blocked.
- No public artifact cleanup is needed because public artifacts remain blocked.
- No Supabase cleanup is needed because Supabase mutation remains blocked.
- No worker lease rollback is needed because job claim and lease mutation remain blocked.
- No queue cleanup is needed because queue execution remains blocked.

Supabase update required: `docs/status only`
Supabase update status: `docs_only`
Supabase environment touched: `none`
SQL executed: `none`
Migration deployed: `no`
Supabase milestone sync: `not_performed`
