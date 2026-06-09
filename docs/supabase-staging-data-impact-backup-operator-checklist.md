# Supabase Staging Data Impact Backup Operator Checklist

Decision: `blocked_pending_staging_owner_approval`

- [ ] staging target confirmed and production excluded
- [ ] read-only data-impact inventory reviewed
- [ ] staging owner accepts auth/user/workspace/project/media/artifact/milestone data-loss impact
- [ ] backup/export/snapshot method approved
- [ ] backup destination, retention, access control, and cleanup approved
- [ ] restore test or restore verification approved
- [ ] reset/reapply dry-run or preview approved in a separate phase
- [ ] post-reset schema/RLS/migration-history verification approved
- [ ] Track B backfill remains separate after schema verification
- [ ] no direct ad-hoc SQL or migration repair in reset execution
- [ ] no secrets printed or committed

Blocked in this packet: staging reset, migration repair, schema deploy, direct DDL/DML, Track B backfill, production, secrets, providers, tools/workers/routes, media, Track A, beta, and production unlock.
