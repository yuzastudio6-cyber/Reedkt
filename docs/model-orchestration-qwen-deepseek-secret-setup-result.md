# Model Orchestration Qwen DeepSeek Secret Setup Result

Decision: `metadata_ready_for_qwen_us_provider_dry_run_rerun`.

Status: `metadata_ready`.

This metadata-only setup pass records the operator-provided DashScope key and region update for a future Qwen-only synthetic provider dry-run rerun. It does not call Qwen, DeepSeek, or any provider, and it does not access, print, store, or commit secret payloads.

US DashScope contract: the selected future Qwen endpoint is `https://dashscope-us.aliyuncs.com/compatible-mode/v1/chat/completions`, based on the US (Virginia) OpenAI-compatible base URL `https://dashscope-us.aliyuncs.com/compatible-mode/v1`.

US model aliases: current metadata records `qwen-plus-us` and `qwen-flash-us` as documented US aliases for the next rerun. Historical PR #320 aliases `qwen3.7-plus` and `qwen3.7-max` remain historical and are not ready for a US rerun in this setup evidence.

Historical evidence preserved: PR #320 Qwen/DashScope attempted four synthetic calls and all four blocked with HTTP 401 `provider_auth_or_permission_failed`. PR #323 classified the blocker as `qwen_secret_present_but_rejected`. DeepSeek passed three synthetic calls and that evidence is preserved without rerun.

Secret validity verified by Codex: `false`.

DashScope model-call permission verified by Codex: `false`.

Qwen/DashScope rerun attempted: `false`.

DeepSeek rerun attempted: `false`.

Plan snapshot contract ready: `false`.

Raw provider output persisted: `false`.

Secret payloads printed, committed, or stored: `false`.

Supabase writes, SQL, and migrations: `false`.

Still blocked until an explicit future rerun passes: workers, tools, routes, raw prompt execution, media processing, storage writes, public artifacts, signed URLs, generated assets, credit spend/reservation, production, external beta, paid production, Demucs runtime, Track A runtime, and plan snapshot contract readiness.

Recommended next prompt: `MODEL-ORCHESTRATION-QWEN-DEEPSEEK-PROVIDER-DRY-RUN-RERUN: rerun approved synthetic Qwen dry-run after secret/region update, no workers/tools/routes`.
