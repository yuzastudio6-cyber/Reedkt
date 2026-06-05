# Agent-To-Tool Plan Bridge Runbook

Phase 52D converts Phase 52C multi-agent findings and edit-intent candidates into candidate approved-plan snapshot records and cross-track handoff packets.

Default commands are static and non-mutating:

- `npm run activation:agent-tool-plan-bridge:report`
- `npm run activation:agent-tool-plan-bridge:iam-plan`
- `npm run activation:agent-tool-plan:summary`
- `npm run smoke:activation-agent-tool-plan-bridge`

Confirmed execution requires:

- `GCP_PROJECT_ID=reeditpro`
- `GCP_REGION=us-central1`
- `REEDITPRO_ENV=staging`
- `REEDITPRO_CONFIRM_AGENT_TO_TOOL_PLAN_BRIDGE=true`
- `REEDITPRO_CONFIRM_SUPABASE_MILESTONE_SYNC=true`

Execution builds deterministic JSON artifacts under private `activation-agents/phase52d/<runId>/` prefixes and writes one Phase 52D milestone sync record through the Phase 51D/51B registry path.

Phase 52D must not execute tools, workers, models, providers, media processing, web search, browser capture, map rendering, migrations, historical backfill, Docker, Cloud Run, production, external beta, paid production, or broad media paths.
