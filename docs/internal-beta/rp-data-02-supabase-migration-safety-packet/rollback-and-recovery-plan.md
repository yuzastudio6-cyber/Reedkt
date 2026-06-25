# RP-DATA-02 Rollback And Recovery Plan

Decision: `completed_migration_safety_packet_ready_for_static_migration_draft`

Rollback plan status: `planned_not_executed`

## Required Rollback Inputs For Future Execution

- Target environment name and project ref.
- Migration file list and checksums.
- Existing migration history before apply.
- Backup/export posture for any environment with data.
- Object storage bucket creation and policy rollback plan.
- RLS and grant rollback plan.
- Audit trail for who approved the execution.
- Verification commands for post-rollback state.

## Recovery Rules

- If migration apply fails, stop and record the exact failing statement, environment, command, exit code, and whether any partial changes were applied.
- Do not retry destructive or partially applied migrations blindly.
- If advisor output contains security warnings, do not mark internal beta ready until each warning is resolved or explicitly accepted by owner approval.
- If RLS denies expected user reads/writes, repair policies in a new draft and validate before reattempt.
- If RLS allows unauthorized access, block internal beta.
- If storage access permits public or cross-project reads, block internal beta.
- If service-role operations become callable from frontend or client-side code, block internal beta.

## Not Performed In This Phase

- No SQL rollback was generated.
- No Supabase migration history was changed.
- No buckets or storage policies were created.
- No data was inserted, updated, deleted, or read from a Supabase environment.
