# PROVIDER-0 Provider Gateway Models Audit Policy

## Scope

PROVIDER-0 audits how ReeditPro should safely introduce future Provider Gateway
support for:

- `qwen_3_7_max` mapped to official provider model ID `qwen3.7-max`.
- `deepseek_v4_pro` mapped to official provider model ID `deepseek-v4-pro`.
- `deepseek_v4_flash` mapped to official provider model ID `deepseek-v4-flash`.

The phase is report-only by default. It may only write a Supabase milestone
record if guarded execution is explicitly confirmed.

## Decisions

- Qwen API keys belong in backend-only Google Secret Manager with
  DashScope-style key semantics and a future ReeditPro reference such as
  `GOOGLE_SECRET_QWEN_DASHSCOPE_API_KEY_NAME`.
- DeepSeek API keys belong in backend-only Google Secret Manager behind a
  future reference such as `GOOGLE_SECRET_DEEPSEEK_API_KEY_NAME`.
- ReeditPro may store secret reference names and metadata only, never key
  values.
- Qwen may later receive sanitized planning context, approved plan snapshot
  metadata, structured edit intent, safe source summaries, and private artifact
  references only after an explicit later execution phase approves it.
- DeepSeek may later receive sanitized code/task context, bounded file
  paths/diffs/diagnostics, and implementation briefs only after an explicit
  later execution phase approves it.
- Raw user media, private row payloads, raw provider responses, service-role
  keys, API keys, bearer tokens, DB URLs, signed URLs as source of truth, public
  artifact URLs as source of truth, payment secrets, and unrestricted raw chat
  are blocked.
- DeepSeek cannot directly execute code.
- Qwen cannot directly execute workers or tools.
- Provider tool-call support is model output only; ReeditPro must validate and
  convert it into candidate approved-plan snapshots before any future worker can
  act.

## Blocked Features

Provider calls, provider secret creation/value reads, worker execution, tool
runtime execution, model inference, media processing, web search, browser
capture, map rendering, Docker, Cloud Run, SQL execution, schema/RLS changes,
historical backfill, public artifacts, signed URLs as source of truth, raw
prompt execution, production, external beta, paid production, and broad media
remain blocked.
