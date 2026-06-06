# Prompt 26G - SECURITY DEFINER Exposure Migration Plan

## Implementation Record

- Branch: `codex/rp-foundation-26g-security-definer-exposure-migration-plan`
- PR: pending
- Base branch: `origin/codex/rp-foundation-26f-function-search-path-hardening-migration-plan`
- Status: open / pending validation
- Production capability enabled: none; SECURITY DEFINER exposure migration plan only

## Scope

Prompt 26G creates documentation, draft-only SQL Markdown, static diagnostics, and tracker updates for SECURITY DEFINER exposure advisor findings. It covers:

- `has_workspace_role`
- `is_workspace_owner_or_admin`
- `is_workspace_owner_record`
- `set_updated_at`
- `can_export_render`
- `is_project_editor`
- `is_project_member`

## Deliverables

- SECURITY DEFINER exposure migration plan
- function classification matrix
- grant review contract
- invoker decision contract
- future test matrix
- rollback/cleanup plan
- staging evidence requirements
- stricter draft-only SQL Markdown labels
- Node built-ins-only diagnostic
- tracker updates

## Non-Execution Statement

No Supabase lifecycle command, SQL, local SQL, raw `psql`, active migration, grant/revoke, function alteration, Google Cloud API, Secret Manager API, provider/tool/worker/render/storage/credit/Stripe command, deployment, telemetry, staging approval, production readiness, or beta unlock is enabled.

## Validation

Validation status is recorded in `docs/prompt-26g-validation-results.md`.

## Next Prompt

Recommended next prompt: `Prompt 26G-1 - SECURITY DEFINER Local Migration Candidate` or `Prompt 26H - FK Index Hardening Migration Plan`.
