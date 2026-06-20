# PROVIDER-0 Provider Gateway Models Audit Runbook

PROVIDER-0 is a repository audit and report-only phase for future DeepSeek and
Qwen provider gateway planning. It does not call DeepSeek, Qwen, or any other
provider. It does not add keys, create secrets, run models, execute tools or
workers, deploy Cloud Run, mutate Supabase schema/RLS, or unlock production,
external beta, paid production, broad media, public artifacts, raw prompt
execution, or signed URLs as source of truth.

## Static Commands

```sh
npm run smoke:activation-provider-gateway-models-audit
npm run activation:provider-gateway-models-audit:report
npm run activation:provider-gateway-models-audit:iam-plan
npm run activation:provider-gateway-models:summary
```

Static mode reconstructs deterministic audit records from committed evidence
and does not read Supabase credentials or write milestone rows.

## Guarded Execution

Guarded execution is optional and limited to private JSON artifact upload plus
one Supabase milestone-sync record through the Phase 51D/51B path.

```sh
GCP_PROJECT_ID=reeditpro \
GCP_REGION=us-central1 \
REEDITPRO_ENV=staging \
REEDITPRO_CONFIRM_PROVIDER_GATEWAY_MODELS_AUDIT=true \
REEDITPRO_CONFIRM_SUPABASE_MILESTONE_SYNC=true \
npm run activation:provider-gateway-models-audit -- --execute
```

Execution still does not read provider secret values, create provider secrets,
call provider APIs, run tools/workers/models, run SQL, or mutate Supabase
schema/RLS/Data API settings.

## Expected Outputs

- Provider gateway repo audit.
- DeepSeek integration proposal.
- Qwen integration proposal.
- Data policy.
- Cost policy.
- Secret policy.
- Phase roadmap.
- Blockers and warnings.
- Supabase milestone sync status.
