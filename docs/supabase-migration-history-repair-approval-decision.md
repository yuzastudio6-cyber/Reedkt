# Supabase Migration-History Repair Approval Decision

Decision: `blocked_pending_remote_history_evidence`

The PR #223 audit identifies a deterministic repair candidate: mark 12 older local migration versions as `applied` in staging migration history. The target activation milestone registry migration `202606050001_activation_milestone_registry_schema_rls.sql` remains pending and is not part of the repair candidate.

This packet does not approve repair execution because committed safe evidence does not prove the 12 historical migration schemas already exist in staging. Per Supabase migration guidance, `migration repair` updates migration history only and does not apply SQL, so marking versions as applied is safe only when the remote schema state is known to match.

Blocked actions remain:

- `supabase migration repair`
- schema deploy
- direct SQL
- Track B backfill writes
- production Supabase
- secret payload printing
- provider/tool/worker/route execution
- Track A
- beta or production unlock

Next action: provide remote schema equivalence evidence and a separate guarded repair execution prompt before any migration-history mutation.
