# Production Secret Safety Policy

Secrets must not appear in frontend code, logs, scripts, docs, payloads, or audit summaries. Forbidden examples include service-role keys, provider API keys, auth headers, cookies, and hardcoded secret-like tokens.

Secret values should live only in approved secret managers and backend runtime configuration after human deployment approval.
