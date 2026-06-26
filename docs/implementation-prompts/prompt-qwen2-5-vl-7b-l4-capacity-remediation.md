# QWEN2_5_VL_STACK_TOOL_9-CAPACITY-REMEDIATION: choose Qwen L4 capacity remediation or alternate no-inference proof path after multi-zone reservation stockout

## Goal

Choose the next safe Qwen2.5-VL proof path after repeated NVIDIA L4 capacity stockouts across bounded reservation-create attempts.

This is a no-mutation decision prompt. It must inspect repo evidence and current read-only GCP capacity/quota metadata, then select one next path without creating reservations, VMs, disks, addresses, buckets, jobs, workers, provider calls, generated media, or runtime unlock claims.

## Inputs

- `docs/qwen2-5-vl-7b-l4-reservation-create-us-east1-b-retry-result.md`
- `docs/qwen2-5-vl-7b-l4-reservation-create-us-east1-c-result.md`
- `docs/qwen2-5-vl-7b-l4-reservation-create-us-west4-c-result.md`
- `docs/qwen2-5-vl-7b-l4-reservation-create-us-west4-a-result.md`
- `docs/qwen2-5-vl-7b-l4-reservation-create-result.md`
- `docs/qwen2-5-vl-7b-l4-reservation-approval-result.md`
- `docs/qwen2-5-vl-7b-wheelhouse-import-proof-result.md`
- `docs/qwen2-5-vl-7b-stack-tool-result.md`

## Decision Space

Evaluate, without mutation:

- scheduled bounded retry window for `g2-standard-8` plus one NVIDIA L4;
- formal GCP capacity/reservation request path;
- additional L4 region quota request path if product cost and latency remain acceptable;
- alternate no-inference proof path that preserves Qwen2.5-VL as a tool but does not claim runtime readiness;
- lower-throughput GPU fallback only if license, cost, memory, dependency, and product evidence support it.

## Guardrails

- L4 remains the preferred beta runtime GPU for Qwen2.5-VL 7B because it is the best cost/performance fit selected by repo evidence.
- Do not switch to a weaker GPU unless the plan explicitly downgrades the proof scope and preserves no-runtime-readiness claims.
- Do not use raw chat as a worker execution plan.
- Do not call providers.
- Do not dispatch workers.
- Do not run inference.
- Do not create generated media or assets.
- Do not touch Supabase.
- Do not execute SQL.
- Do not mutate credits.
- Do not unlock beta or production.
- Do not claim `dry_run_passed`.
- Do not claim `generated_local_fixture_passed`.

## Expected Output

- Capacity remediation decision packet.
- Updated next prompt.
- Diagnostics validating all previous stockout evidence and the selected no-mutation path.
