# Phase 51A Supabase Data-Plane Audit QA Policy

Mandatory QA gates:

- `repo_supabase_discovery`: committed Supabase clients, config, docs, and migration files are present.
- `env_secret_audit`: service-role and DB URL values are not printed or exposed to frontend code.
- `migration_schema_audit`: migration SQL can be parsed for key data-plane coverage.
- `rls_security_audit`: RLS, storage policy, and signed URL audit coverage are checked from committed SQL.
- `runtime_integration_audit`: runtime Supabase boundaries and table references are identified.
- `remote_activity_audit`: remote count-only checks either complete or are blocked with a precise credential/access reason.
- `data_model_gap_analysis`: P0/P1/P2 gaps are classified.
- `beta_readiness_impact`: Supabase blockers are reflected in internal beta readiness.
- `blocked_features`: writes, migrations, provider calls, media processing, deployment, production, and beta remain blocked.

Static QA can pass the implementation smoke even when remote activity is blocked; the report itself must preserve the blocked remote gate so the readiness decision stays honest.
