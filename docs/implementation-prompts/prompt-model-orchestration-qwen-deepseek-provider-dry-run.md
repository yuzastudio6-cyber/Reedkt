# MODEL_ORCHESTRATION - Qwen/DeepSeek Provider Dry-Run Execution

Use this only after the dry-run approval decision is `approved_for_future_qwen_deepseek_provider_dry_run`.

This is a separate execution phase. Provider calls are allowed only with explicit future confirmations for the synthetic cases approved in `docs/activation-model-orchestration-dry-run-approval-reports/dry_run_synthetic_cases.json`.

Future execution must use secret refs `DASHSCOPE_API_KEY` and `DEEPSEEK_API_KEY` through approved environment/Secret Manager handling without printing or committing payloads.

Allowed scope: synthetic prompts only, schema validation, metadata-only audit logs, cost/timeout/rate guardrails, and fail-closed handling.

Still blocked: worker/tool/route execution, raw prompt execution, media processing, public artifacts, signed URLs, Supabase writes, production, external beta, paid production, and real user/private project data.
