# WORKER-6 Cleanup And Rollback Plan

cleanupPlanState: `ready_with_warnings_for_worker_7`

## Local Cleanup

Future WORKER-7 may write ignored local/offline evidence under `<OFFLINE_NOOP_OUTPUT_DIR>`. Cleanup is limited to local ignored outputs for the run id `<WORKER_7_RUN_ID>`.

Committed sanitized evidence must preserve fixture IDs, decisions, checksum summaries, QA summaries, observability summaries, cleanup summaries, and false approval booleans.

## Rollback

If the future controlled no-op gate fails, WORKER-7 must record the failing fixture rows, keep live worker execution blocked, and avoid retry loops. Any partial ignored local output may be removed locally after sanitized failure evidence is committed.

## Blocked Cleanup Categories

- No GCS cleanup because upload is blocked.
- No signed URL cleanup because signed URLs are blocked.
- No public artifact cleanup because public artifacts are blocked.
- No Supabase cleanup because Supabase mutation is blocked.
- No queue cleanup because queue execution is blocked.
- No worker lease cleanup because lease mutation is blocked.
- No job claim rollback because job claiming is blocked.
