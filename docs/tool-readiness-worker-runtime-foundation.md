# Tool Readiness Worker Runtime Foundation

Prompt 13 adds a backend-safe foundation layer for classifying tool readiness and worker runtime requirements before any production tool execution is allowed.

This is not a runtime activation phase. It does not install packages, probe local binaries, execute workers, process media, call providers, create jobs, transfer storage, generate signed URLs, deploy infrastructure, or unlock production/beta use.

## What It Adds

- A static tool readiness registry under `server/foundation/tool-readiness/`.
- Explicit readiness states for every registered tool.
- Runtime requirement metadata for worker-only tools.
- Static diagnostics for worker boundary and policy consistency.
- Read-only `/v1/tool-readiness` routes.
- Draft-only future RLS smoke tests.

## Readiness States

- `not_configured`: fail-closed default for unknown tools.
- `planning_only`: can appear in plans but cannot run.
- `readiness_check_only`: can be discussed by readiness diagnostics only.
- `mock_only`: mock-safe only.
- `disabled`: explicitly unavailable.
- `blocked_missing_runtime`: blocked until a runtime exists.
- `blocked_missing_approval`: blocked until approval evidence exists.
- `blocked_missing_secret`: blocked until safe secret handling exists.
- `blocked_by_policy`: blocked by product/security policy.
- `ready_for_future_activation`: evidence is sufficient for a future activation prompt, but Prompt 13 still does not execute it.
- `never_public`: internal-only and never user-facing.

## Boundary Model

Heavy tools stay worker-side. The frontend may read sanitized readiness classifications, but it must not execute FFmpeg, Remotion, Sharp, OCR, VLM, audio tools, model runtimes, browser capture, or provider calls.

Prompt 13 keeps `allowedInRuntime=false` for every tool. Future prompts must add immutable approval snapshots, private artifact evidence, worker execution contracts, idempotency, RLS validation, and explicit runtime approval before any tool can run.

## Still Blocked

Production, external beta, broad real media, providers, signed URLs as source of truth, Docker builds, Cloud Run jobs, real worker claims, model downloads, media processing, rendering, export, SQL execution, and remote Supabase mutation remain blocked.
