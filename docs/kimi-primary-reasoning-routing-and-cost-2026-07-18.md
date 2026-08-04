# Kimi-Primary Reasoning Routing and Cost

Status date: 2026-07-18.

## Decision

ReEditPro uses one ordered reasoning route for editorial reasoning, planning, creative strategy, edit-QA reasoning, coding, and Remotion drafts:

1. `kimi_k3_primary` using exact model `kimi-k3`.
2. `qwen_3_7_fallback` using exact model `qwen3.7-max-2026-06-08`.
3. `deepseek_v4_pro_fallback` using exact model `deepseek-v4-pro`.

Qwen2.5-VL is not a fourth reasoning fallback. It is the visual-understanding specialist that creates source-bound evidence consumed by the reasoning route.

## Authority and fallback rules

Each attempt must use the same exact project/edit identity, approved immutable snapshot, existing credit reservation, idempotency key, structured request contract, and evidence package. Fallback may advance only to the immediately next route after the previous attempt is terminal and its failure is one of the allow-listed provider/structured-output/quality-validation classifications.

Approval, reservation, snapshot, tenant, safety, invalid-request, and unsupported-use failures block. They must never be hidden by switching providers. After the final DeepSeek failure, the system requires deterministic recovery or user review.

## Internal cost evidence

`server/reasoning-model-cost/` provides versioned rate-card math and provisional attempt evidence. It binds one reasoning-run identity, model identity, route ordinal, rate-card version, request and usage hashes, token/cache usage, outcome, fallback-entry trigger, and internal cost to the exact approved authority. Aggregation rejects mixed runs, snapshots, reservations, reordered/skipped routes, attempts after completion, duplicate attempts, and invalid evidence hashes. Failed attempts remain part of aggregate internal cost.

Kimi and DeepSeek are represented in their native USD price boundary. Qwen is represented in native CNY; a sourced immutable FX snapshot is required before any USD-normalized total is claimed. The code does not reconcile provider invoices or persist production records.

This internal cost is not customer price, customer credits, a service fee, wallet mutation, settlement, or charging authority.

## Visual specialist and the meaning of hosted

The intended production visual specialist is ReEditPro-hosted Qwen2.5-VL on private Google Cloud GPU workers. Customers do not run the model in their browser or on their computer. Development workstation/container evidence is development-only and is not deployed Google Cloud evidence.

The production design preserves immutable originals, analyzes bounded proxies across the whole source, increases inspection density around important or ambiguous windows, requests original-resolution crops where necessary, and caches evidence by source checksum, exact checkpoint, and sampling-policy version. Internal visual cost must be derived from measured Google Cloud GPU/CPU runtime, storage, and networking after the approved worker shape is benchmarked. No token price is invented for the self-hosted route.

## Evidence achieved in this slice

- Canonical ordered route and no-skip fallback policy.
- Model-role capability validation across planner, approved execution package, private manifest, gateway metadata, and retained compatibility identifiers.
- Versioned provider rate cards and deterministic token/cache math.
- Per-attempt provisional internal cost evidence and aggregation, including failed attempts.
- Explicit separation from customer price, credits, service fee, wallet mutation, billing, and provider invoice reconciliation.
- Mock-safe smoke coverage with no provider call, secret read, customer charge, Supabase mutation, worker dispatch, render, or deployment.

## Still required for production readiness

- Approved provider accounts, exact model availability, credentials, quotas, regional/privacy review, and Secret Manager value access.
- Durable attempt persistence and one-use dispatch bound to canonical approved snapshot authority.
- Provider usage response verification, retry/timeout behavior, invoice reconciliation, telemetry, and operational rollback.
- Approved private Google Cloud Qwen2.5-VL worker shape, checkpoint, precision, benchmark, measured infrastructure cost, evidence coverage, lease/recovery behavior, and release proof.
- Reconciliation of externally owned Edit Reference/Edit Preference and Marker Chat consumers that still describe Qwen as the main brain.

Production-ready remains unproven until those named gates pass.
