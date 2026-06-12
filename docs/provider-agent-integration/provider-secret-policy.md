# Provider Secret Policy

PROVIDER-1 records secret reference names only:

- `GOOGLE_SECRET_DEEPSEEK_API_KEY_NAME` for DeepSeek key semantics
- `GOOGLE_SECRET_QWEN_DASHSCOPE_API_KEY_NAME` for DashScope/Qwen key semantics
- `QWEN_API_KEY` as an alternate name to verify only if a future provider path
  requires it

Rules:

- Google Secret Manager only.
- Backend / Provider Gateway only.
- No frontend exposure.
- No payload printed.
- No payload committed.
- No provider secret creation or value read in PROVIDER-1.
- No live provider calls in PROVIDER-1.

Docs, git, logs, Supabase rows, GCS artifacts, PR text, screenshots, and frontend
environment variables must never contain raw provider key values.
