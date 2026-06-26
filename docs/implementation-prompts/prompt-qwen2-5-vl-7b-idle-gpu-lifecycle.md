# QWEN2_5_VL_STACK_TOOL_10-IDLE-GPU-LIFECYCLE: define on-demand L4 GPU lifecycle so Qwen runs only when queued and stops when idle

## Goal

Define the Qwen2.5-VL 7B GPU runtime lifecycle so the model runs only when ReEditPro has an approved queued visual-understanding, planning, or QA job, then stops or scales to zero when idle.

This is the next required architecture step after repeated bounded L4 reservation-create stockouts. The default runtime must not be an always-on GPU VM and must not hold idle GPU capacity without explicit, time-bounded proof or production approval.

## Inputs

- `docs/qwen2-5-vl-7b-l4-reservation-create-us-east4-a-result.md`
- `docs/qwen2-5-vl-7b-l4-capacity-remediation-result.md`
- `docs/qwen2-5-vl-7b-stack-tool-integration.md`
- `docs/qwen2-5-vl-7b-wheelhouse-import-proof-result.md`
- `docs/qwen2-5-vl-7b-linux-l4-wheelhouse-prep-result.md`
- `docs/qwen2-5-vl-7b-private-model-download-result.md`
- `docs/model-routing-policy.md`
- `intent-led-edit-planning.md`
- `approved-plan-snapshot-policy.md`
- `editing-agent-execution-architecture.md`
- `async-edit-work-graph.md`
- `editing-asset-manifest.md`
- `pricing-and-credits.md`

## Required Decision

Choose an on-demand GPU lifecycle:

1. Preferred path: Cloud Run GPU scale-to-zero review for Qwen2.5-VL if container size, model-cache mounting, cold-start, region quota, concurrency, and private networking constraints are acceptable.
2. Fallback path: ephemeral Compute Engine L4 worker VM with no public IP, proof service account, queue lease, max runtime cap, idle timeout, and guaranteed delete/stop cleanup.
3. Rejected default: always-on GPU service or long-held idle reservation.

## Required Controls

- Approved plan snapshot or explicit pending-snapshot test scope.
- Structured visual-understanding/edit intent input, not raw chat execution.
- Tool-call ranking for Qwen as visual understanding, source-frame QA, OCR/layout QA, caption/visual collision QA, and planning advisor.
- Wan remains the generated B-roll route.
- Queue/job lease and idempotency key.
- Cost cap and credit estimate path before production use.
- One active L4 worker cap until beta evidence says otherwise.
- Idle timeout and max job runtime.
- Cleanup verification for VM, disk, reservation, Cloud Run revision/service, logs, temporary files, and private artifacts.
- No public IP by default.
- No provider secrets in frontend.
- No model inference until an explicitly approved bounded proof prompt.

## Forbidden Work

- Do not create a VM.
- Do not create a reservation.
- Do not create a Cloud Run service or job.
- Do not build or push Docker images.
- Do not start a GPU service.
- Do not run inference.
- Do not install dependencies on a VM.
- Do not call `from_pretrained`.
- Do not call `torch.load`.
- Do not start `vllm serve`.
- Do not start SGLang.
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

- On-demand GPU lifecycle plan and decision record.
- Cost-friendly GPU shape ranking for Qwen proof, beta, and production candidates.
- Tool-call ranking for Qwen versus deterministic tools, Wan, Hailuo, Veo, OCR/layout tools, and human review.
- Idle timeout and cleanup policy.
- Future implementation prompts for Cloud Run GPU review and ephemeral GCE fallback.
- Diagnostics proving no always-on GPU, no reservation, no VM, no inference, and no beta/production claim.
