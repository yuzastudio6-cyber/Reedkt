# Restricted Internal Testing Issue Intake

Severity levels:
- `sev0_stop`: Stop rehearsal immediately; possible secret, production, public artifact, or runtime execution breach.
- `sev1_blocker`: Blocks restricted internal testing start gate.
- `sev2_major`: Needs owner review before start gate but does not indicate execution breach.
- `sev3_minor`: Documentation or metadata cleanup follow-up.

Categories:
- `supabase_milestone_sync_issue`
- `track_b_readiness_issue`
- `docs_runbook_issue`
- `security_or_secret_exposure_issue`
- `runtime_provider_tool_worker_route_execution_attempt`
- `public_artifact_or_signed_url_policy_issue`
- `production_external_beta_or_paid_production_unlock_attempt`
