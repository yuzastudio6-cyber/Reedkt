# Qwen/DeepSeek Synthetic Provider Dry-Run Runbook

Default commands are static/report-only and must not access provider APIs or Secret Manager payloads.

## Static Commands

- `npm run smoke:activation-model-provider-dry-run`
- `npm run activation:model-provider-dry-run:report`
- `npm run activation:model-provider-dry-run:iam-plan`
- `npm run activation:model-provider-dry-run:summary`

## Execute Gate

Execution requires `--execute` plus every confirmation below:

- `GCP_PROJECT_ID` must equal `reeditpro`.
- `GCP_REGION` must equal `us-central1`.
- `REEDITPRO_ENV` must equal `staging`.
- `REEDITPRO_CONFIRM_QWEN_DEEPSEEK_PROVIDER_DRY_RUN` must equal `true`.
- `REEDITPRO_CONFIRM_SUPABASE_MILESTONE_SYNC` must equal `true`.

The execute command is:

```sh
GCP_PROJECT_ID=reeditpro \
GCP_REGION=us-central1 \
REEDITPRO_ENV=staging \
REEDITPRO_CONFIRM_QWEN_DEEPSEEK_PROVIDER_DRY_RUN=true \
REEDITPRO_CONFIRM_SUPABASE_MILESTONE_SYNC=true \
npm run activation:model-provider-dry-run -- --execute
```

## Boundaries

No real user data, raw media, signed URLs, private URLs, provider chaining, tools, workers, routes, browser capture, map rendering, media processing, public artifacts, production, or external beta unlocks are allowed.
