# Qwen Runtime Boundary Next Adapter

RP-QWEN-01 prepares the boundary for a later backend Qwen 3.7 Max adapter. It does not implement the adapter.

Boundary statement: symbolic secret references only, disabled resolver only, backend-only, no gcloud, no secret value access, no secret value printed, no provider call, no Qwen call, no Marker Chat runtime change, fake transport first by default.

Verification phrase: Qwen 3.7 Max remains behind symbolic secret references, a disabled resolver, backend-only access, no gcloud command, no secret value access, no provider call, no Qwen call, no Marker Chat runtime change, and fake transport first.

## Recommended Next Milestone

Use `RP-QWEN-02 - Backend Qwen 3.7 Max Adapter` after owner review.

## Default Next Adapter Policy

- Fake transport first by default.
- Real provider call only after explicit owner approval.
- Keep deterministic fallback for Marker Chat.
- Validate Qwen structured responses before saving.
- Preserve all no-provider, no-worker, no-render, no-credit, no-Supabase, and no-Secret-Manager-value boundaries until later gates are approved.

## RP-QWEN-BETA-01 Update

The next adapter step was implemented as a backend-only beta bridge rather than production runtime. Owner approval is beta-scoped, and provider calls still require `REEDITPRO_QWEN_RUNTIME_MODE=beta_enabled` plus Secret Manager/provider config. Deterministic fallback remains required for every unavailable or unsafe runtime condition. Production ready: false.
