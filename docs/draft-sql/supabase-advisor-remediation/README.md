# Supabase Advisor Remediation Draft SQL Sketches

This directory contains Prompt 26C draft SQL sketches as Markdown review artifacts.

Every file in this directory is:

- DRAFT ONLY.
- DO NOT EXECUTE.
- Not validated.
- Not applied to Supabase.
- Requires future prompt.

These files are intentionally outside `supabase/migrations/`. They are not active migrations, are not selected by the Supabase CLI, and do not prove advisor remediation.

## Files

| File | Purpose |
| --- | --- |
| `rls-no-policy-draft.sql.md` | Sketches table access models for RLS-enabled/no-policy findings. |
| `security-definer-grants-draft.sql.md` | Sketches function/grant review questions for SECURITY DEFINER exposure. |
| `function-search-path-draft.sql.md` | Sketches future fixed-search-path function hardening. |
| `fk-indexes-draft.sql.md` | Sketches additive FK index candidates. |

## Rules

- Do not paste secrets, keys, connection strings, signed URLs, private media, or project refs.
- Do not copy these sketches into active migrations without a future reviewed prompt.
- Do not treat comments here as execution approval.
- Do not run SQL from this directory.
