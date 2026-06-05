# Prompt 26C - Supabase Advisor Draft Remediation Packet

## Summary

Prompt 26C creates a draft remediation packet for Supabase advisor findings recorded in Prompt 26A and planned in Prompt 26B.

- Branch: `codex/rp-foundation-26c-supabase-advisor-draft-remediation-packet`
- PR title: `[foundation] Prompt 26C Supabase advisor draft remediation packet`
- PR base: `codex/rp-foundation-26b-supabase-advisor-hardening-plan`
- Exact capability enabled: none; Supabase advisor draft remediation packet only.

## Allowed Scope

- Documentation.
- Static diagnostics.
- Tracker updates.
- Draft SQL sketches as Markdown files under `docs/draft-sql/supabase-advisor-remediation/`.

## Forbidden Scope

- Active migration files.
- Supabase lifecycle commands.
- SQL execution.
- Staging, remote, or production Supabase execution.
- Google Cloud or Secret Manager calls.
- No provider, tool, worker, render, media, storage, credit, Stripe, telemetry, deployment, human approval, staging approval, production approval, or beta unlock.

## Deliverables

- Advisor draft remediation packet.
- RLS no-policy draft packet.
- SECURITY DEFINER draft packet.
- Function search-path draft packet.
- FK index draft packet.
- Execution readiness gates.
- Draft SQL Markdown sketches with explicit DRAFT ONLY and DO NOT EXECUTE labels.
- Static diagnostic and foundation runner wiring.
- Tracker updates.

## Validation Checklist

- `git diff --check`
- `git diff --check origin/codex/rp-foundation-26b-supabase-advisor-hardening-plan...HEAD`
- `npm ci`
- `npm run lint`
- `npm run typecheck:server`
- `npm run foundation:validate`
- `npm run --silent supabase:advisor:draft-remediation:diagnostics`
- Existing Supabase/GCP/staging diagnostics
- Local Supabase toolchain probe/preflight only
- RLS list-tests and dry-run only

## Acceptance Criteria

- Required Prompt 26C docs exist.
- Draft SQL sketches exist only as `.sql.md` files outside active migration paths.
- Diagnostics pass.
- Active migrations are not changed.
- No Supabase/Google Cloud/Secret Manager/SQL/runtime execution is enabled.
- Advisor remediation remains future-only.

## Next Prompt

Recommended next prompt: Prompt 26D - RLS No-Policy Table Classification and Policy Contract. Prompt 23A and Prompt 24D remain required before staging execution.
