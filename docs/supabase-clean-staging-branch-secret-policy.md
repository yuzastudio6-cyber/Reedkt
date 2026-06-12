# Supabase Clean Staging Branch Secret Policy

This phase may use `SUPABASE_ACCESS_TOKEN` and a clean-branch DB URL from process env only. Values must never be printed, reported, committed, or copied into docs.

Allowed report fields are secret reference names, payload access status, presence booleans, env var names, branch name/ref safe metadata, and redacted command classes. DB URLs, passwords, service-role keys, anon keys, access token values, signed URLs, and private payloads are forbidden.

Token payload access requires `REEDITPRO_CONFIRM_SUPABASE_ACCESS_TOKEN_SECRET_INJECTION=true` and stores the token only in the current process as `SUPABASE_ACCESS_TOKEN`.
