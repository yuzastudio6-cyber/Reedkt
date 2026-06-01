# Tool Readiness Policy

Prompt 13 is fail-closed by default.

## Allowed

- Static readiness classification.
- Static worker/runtime requirement metadata.
- Read-only readiness routes.
- Static diagnostics.
- Draft-only RLS planning.

## Not Allowed

- Tool package installation.
- Runtime execution or local binary probing.
- Provider calls.
- Media processing.
- Browser capture.
- Rendering/export.
- Job creation.
- Worker claim/execution.
- Storage transfer.
- Signed URL creation.
- Remote Supabase migration or SQL execution.
- Production, external beta, paid production, or broad real media unlocks.

## Required Flags

For Prompt 13, there is no confirmation environment variable that enables runtime work. The registry is a report-only readiness layer.

## Tool Policy Notes

- Track A completed tools may be `ready_for_future_activation` or `readiness_check_only`, but runtime remains disabled.
- DeepFilterNet is readiness-check-only until future worker execution hardening.
- Demucs remains blocked until model license/provenance and approval manifest evidence exists.
- Qwen/VLM/vLLM remain blocked by policy until a later approved VLM resolution.
- Provider tools remain disabled.
- Signed URLs are never a source of truth.
