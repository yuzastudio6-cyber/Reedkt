# RP-DATA-02 Target Environment Guardrails

Decision: `completed_migration_safety_packet_ready_for_static_migration_draft`

Target environment status: `not_selected`

This packet does not name a live Supabase project, apply SQL, create buckets, or touch an environment. A later guarded execution prompt must name the exact target and approval boundary before any SQL can run.

## Required Before Any Guarded Supabase Execution

- Environment name and project reference are explicitly supplied by the owner.
- Environment class is non-production unless a separate production migration approval exists.
- Current migration history is read back and recorded.
- Backup and rollback posture is documented.
- `supabase --version` and command help output are captured before CLI use.
- Supabase advisors are planned for the draft migration before apply.
- Service-role credentials are never exposed to frontend code or PR text.
- Data API exposure grants are reviewed separately from RLS.
- RLS is enabled on exposed-schema tables before any user or authenticated role access.
- Storage buckets remain private by default.
- Bucket object paths include workspace/project scoping and cleanup/retention policy.

## Blocked In This Phase

- Remote Supabase migration execution.
- Local or remote SQL execution.
- Storage bucket creation.
- RLS policy deployment.
- Storage object access.
- Service-role backend mutation.
- Worker job execution.
- Provider/model calls.
- Signed URL creation.
- Public artifact creation.
- Internal beta unlock.
- External beta unlock.
- Production unlock.

## Guarded Future Execution Requirement

Future migration execution must use a new prompt that names:

- target environment;
- branch and exact head SHA;
- migration file list;
- advisors and expected findings;
- rollback and backup evidence;
- private storage policy;
- service-role boundary;
- validation commands;
- explicit no-production/no-public-artifact constraints.
