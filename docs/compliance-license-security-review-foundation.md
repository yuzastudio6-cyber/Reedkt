# Compliance, License, Dependency, and Security Review Foundation

Prompt 16 creates a limited compliance route/service foundation. It is not legal advice and does not approve production use.

## Current Implementation Found

- Tool readiness has static runtime-disabled records under `server/foundation/tool-readiness/`.
- Provider gateway has fail-closed provider metadata and secret-reference boundaries from Prompt 15.
- `package.json` and `package-lock.json` provide dependency inventory evidence, but dependency approval is not implemented.
- No canonical compliance review tables or RLS policies are active yet.

## Canonical Concepts

Prompt 16 treats compliance review records, dependency review records, package review records, license review records, security review records, runtime approval records, model provenance review records, and compliance audit events as future canonical concepts. The current service returns static summaries and backend-required blockers rather than writing these records.

## Responsibilities

- Frontend: display compliance blockers and readiness summaries only; never present them as legal approval.
- Backend API: validate inputs, summarize static evidence, and fail closed for review creation or production unlock.
- Supabase: future append-only/versioned review persistence, RLS, human-review fields, expiration, and audit events.
- Worker/runtime: remain blocked unless compliance, tool readiness, provider gateway, worker isolation, and production unlock gates pass in a future reviewed milestone.

## Lifecycle Boundaries

- Dependency review starts with `package.json`, `package-lock.json`, record-only `npm audit`, and human license/security evidence.
- License/security/model/provenance/codec/build-flag reviews remain human-review requirements.
- Runtime approval requires worker isolation, package/runtime approval, no secrets in evidence, and non-expired approval records.
- Production unlock is explicitly blocked in Prompt 16.

## Validation Results

See `docs/prompt-16-validation-results.md` for command results. SQL/RLS remains draft-only.

## Remaining Blockers

- No legal approval, production approval, dependency approval, package approval, runtime approval, or compliance table persistence exists.
- No tool, provider, worker, render/export, media, storage, credit, Stripe, migration, deployment, or remote Supabase execution is enabled.
