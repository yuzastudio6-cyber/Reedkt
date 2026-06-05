# Multi-Agent Dry-Run Runbook

Phase 52C runs a deterministic multi-agent dry-run on existing evidence only.

Default commands are static and non-mutating:

```sh
npm run activation:multi-agent-dry-run:report
npm run activation:multi-agent-dry-run:iam-plan
npm run activation:multi-agent:summary
npm run smoke:activation-multi-agent-dry-run
```

Confirmed execution requires:

```sh
GCP_PROJECT_ID=reeditpro \
GCP_REGION=us-central1 \
REEDITPRO_ENV=staging \
REEDITPRO_CONFIRM_MULTI_AGENT_DRY_RUN=true \
REEDITPRO_CONFIRM_SUPABASE_MILESTONE_SYNC=true \
npm run activation:multi-agent-dry-run -- --execute
```

Execution produces deterministic JSON for evidence context, scenarios, findings, edit intents, Producer gates, QA/Safety gates, the dry-run manifest, QA, report, and one Supabase milestone sync record.

Private artifacts are written under:

- `gs://reeditpro-staging-reeditpro-generated-assets/activation-agents/phase52c/<runId>/`
- `gs://reeditpro-staging-reeditpro-qa-artifacts/activation-agents/phase52c/<runId>/`

No tools, workers, models, providers, web search, browser capture, map rendering, media processing, migrations, schema changes, Docker, Cloud Run, production, external beta, or broad media execution is allowed.
