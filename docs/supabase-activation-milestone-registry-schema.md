# Supabase Activation Milestone Registry Schema

This phase adds the activation milestone registry schema for local/staging validation only.

Migration:

- `supabase/migrations/202606050001_activation_milestone_registry_schema_rls.sql`

Tables:

- `activation_milestones`
- `activation_phase_runs`
- `activation_tool_readiness`
- `activation_pr_evidence`
- `activation_artifact_manifests`
- `activation_blockers`
- `activation_allowed_scopes`
- `activation_blocked_scopes`
- `activation_next_phases`
- `activation_human_approvals`
- `activation_sync_audit_log`

The schema stores safe activation metadata, report paths, PR references, blocker codes, safe artifact manifest metadata, allowed/blocked scopes, and redacted human approval references. It does not store secrets, service-role keys, provider keys, signed URLs, raw prompts, raw media/audio/model payloads, private artifact contents, Cloud Run logs, or user PII.

This phase does not backfill Track B rows, write milestone data, run production Supabase, execute tools/workers/routes, call providers, or unlock beta/production.
