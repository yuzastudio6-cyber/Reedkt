# Supabase Clean Staging Branch Secret Policy

This phase may use `SUPABASE_ACCESS_TOKEN` and a clean-branch DB URL from process env only. Values must never be printed, reported, committed, or copied into docs.

Allowed report fields are presence booleans, env var names, branch name/ref safe metadata, and redacted command classes. DB URLs, passwords, service-role keys, anon keys, access tokens, signed URLs, and private payloads are forbidden.
