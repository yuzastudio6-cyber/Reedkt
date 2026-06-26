# QWEN2_5_VL_STACK_TOOL_9-RESERVATION-APPROVAL: approve bounded L4 capacity reservation plan for Qwen proof, no VM/no inference

## Goal

Approve or reject a bounded capacity-reservation path for the Qwen2.5-VL L4 proof after five one-shot VM create attempts stocked out.

This prompt must inspect repo evidence and current GCP state before deciding whether a future prompt may create a short-lived reservation. It must not create a reservation, VM, disk, address, or any other cloud resource.

## Inputs

- `docs/qwen2-5-vl-7b-l4-capacity-assurance-plan-result.md`
- `docs/qwen2-5-vl-7b-l4-cuda-vllm-import-proof-us-east1-b-result.md`
- `docs/qwen2-5-vl-7b-l4-capacity-followup-result.md`
- `docs/ai-video-broll-generation-gcp-proof-identity-setup-result.md`
- `docs/qwen2-5-vl-7b-wheelhouse-import-proof-result.md`

## Required Decision

- Whether a future short-lived L4 capacity reservation is justified.
- Target region/zone candidates and rationale.
- Maximum reservation duration and cleanup expectations.
- Whether an off-peak scheduled retry should happen before reservation creation.
- Exact next prompt.

## Forbidden Work

- Do not create or delete a reservation.
- Do not create or delete a VM.
- Do not create disks, addresses, firewall rules, networks, buckets, service accounts, keys, custom images, Artifact Registry images, or Cloud Run jobs.
- Do not run IAP transfer commands.
- Do not SSH.
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
