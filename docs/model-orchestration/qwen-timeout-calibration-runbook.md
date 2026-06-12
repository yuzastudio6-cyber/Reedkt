# Qwen Timeout Calibration Runbook

Decision: `qwen_schema_timeout_calibrated_ready_for_model_dryrun`.

Run `activation:qwen-timeout-calibration -- --execute` only with `GCP_PROJECT_ID=reeditpro`, `GCP_REGION=us-central1`, `REEDITPRO_ENV=staging`, and `REEDITPRO_CONFIRM_QWEN_SCHEMA_TIMEOUT_CALIBRATION=true`.

Secret source is Google Secret Manager only for `DASHSCOPE_API_KEY`, `DASHSCOPE_BASE_URL`, and `DASHSCOPE_REGION`. Do not provide DashScope payload env vars.

The calibration is Qwen-only and synthetic-only. DeepSeek, the full Qwen/DeepSeek dry-run, tools, workers, routes, Supabase writes, SQL, migrations, media, public artifacts, signed URLs, production, external beta, and paid production remain blocked.
