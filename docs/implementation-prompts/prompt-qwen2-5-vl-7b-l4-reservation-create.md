# QWEN2_5_VL_STACK_TOOL_9-RESERVATION-CREATE: create bounded L4 reservation for Qwen proof in us-east1-b, no VM/no inference

## Goal

Create one bounded NVIDIA L4 capacity reservation for the Qwen2.5-VL proof path in `us-east1-b`, without creating a VM or running inference.

This prompt is the first reservation mutation gate. It must repeat all safety preflight checks immediately before mutation and stop if the target state is not clean.

## Inputs

- `docs/qwen2-5-vl-7b-l4-reservation-approval-result.md`
- `docs/qwen2-5-vl-7b-l4-capacity-assurance-plan-result.md`
- `docs/qwen2-5-vl-7b-l4-cuda-vllm-import-proof-us-east1-b-result.md`
- `docs/ai-video-broll-generation-gcp-proof-identity-setup-result.md`

## Approved Reservation Shape

- Reservation name: `reeditpro-qwen2-5-vl-l4-proof-reservation`
- Project: `reeditpro`
- Zone: `us-east1-b`
- Machine type: `g2-standard-8`
- Accelerator: one `nvidia-l4`
- Scope: Qwen2.5-VL proof only
- VM creation in this prompt: false
- Inference in this prompt: false
- Serving in this prompt: false

## Required Preflight

- Confirm branch/worktree state.
- Confirm active project and account.
- Confirm no matching reservation exists.
- Confirm no matching VM, disk, address, or reservation exists.
- Confirm regional and global GPU usage are zero.
- Confirm exact machine/GPU shape is visible.
- Confirm proof service account and IAP firewall still match repo evidence.
- Confirm cleanup plan and next prompt before mutation.

## Forbidden Work

- Do not create or delete a VM.
- Do not open SSH.
- Do not run IAP transfer.
- Do not install dependencies on a VM.
- Do not import models.
- Do not run `from_pretrained`.
- Do not call `torch.load`.
- Do not run inference.
- Do not start `vllm serve`.
- Do not start SGLang.
- Do not start an API server.
- Do not call providers.
- Do not dispatch workers.
- Do not touch Supabase.
- Do not execute SQL.
- Do not generate media or assets.
- Do not create public artifacts.
- Do not create signed URLs.
- Do not mutate credits.
- Do not unlock beta or production.
- Do not claim `dry_run_passed`.
- Do not claim `generated_local_fixture_passed`.

## Expected Output

- Reservation create result or clean blocked result.
- Sanitized evidence with no secrets, tokens, connection strings, or provider credentials.
- Cleanup/next-prompt decision.
- All runtime gates remain false except the explicit reservation mutation if it succeeds.
