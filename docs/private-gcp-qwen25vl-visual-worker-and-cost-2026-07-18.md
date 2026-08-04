# Private Google Cloud Qwen2.5-VL Visual Worker And Cost Contract

Status: bounded contract and smoke evidence only. This increment does not deploy or invoke Google Cloud, read media bytes, create a GPU job, access GCS, activate an external provider, persist production evidence, reserve or spend credits, calculate customer price, include a ReEditPro service fee, mutate a wallet, run Supabase, render, export, or make ReEditPro production-ready.

## Product Decision

Qwen2.5-VL remains ReEditPro's visual specialist. The intended product runtime is a ReEditPro-hosted private Google Cloud GPU worker, not the customer's browser, laptop, or phone. The current target identity is:

- model: `qwen2.5-vl-7b-instruct`;
- worker target: `reeditpro-gpu-ai-worker`;
- accelerator class: NVIDIA L4;
- execution mode: private self-hosted Google Cloud GPU;
- external visual-provider API: gated compatibility/overflow recovery only, never the primary route in this contract.

“Local” in older readiness notes means development or injected test evidence. It does not mean that a customer must run the model on their device, and it is not production authority.

## Professional Large-Source Strategy

The contract preserves one immutable private original and binds every run to its exact storage object generation and SHA-256 checksum. A 4K source remains the final-render authority.

Visual analysis uses the existing `professional_1080p_analysis_proxy_v2` policy for the whole-source working representation. That proxy is bounded to 1920×1080 Rec.709, preserves the original master, and must use a validated color-managed transform for HDR or wide-gamut sources. Original-resolution access is limited to exact, checksummed crops for fine text, faces or identity details, products, color/lighting details, low-confidence reinspection, or post-render QA.

This avoids repeatedly decoding or transferring the entire 4K source to the vision model while retaining a high-quality path for details that a 1080p proxy cannot safely resolve.

## Coverage And Evidence

Coverage depends on edit level but never treats a filename or a few arbitrary thumbnails as whole-source understanding:

- Normal: targeted professional visual coverage;
- Premium: key-moment coverage with at least 90% of detected scenes represented;
- Ultra Premium: every detected scene represented, with no unobserved span above 30 seconds.

Every coverage manifest binds the technical-analysis artifact, detected-scene identities, exact samples, exact required windows, batch count, and a deterministic coverage digest. Every cache key is tenant-scoped and changes with source, proxy, checkpoint, tokenizer, processor, coverage, prompt policy, or evidence schema.

Qwen2.5-VL evidence remains visual-only. It cannot claim transcript or audio authority. Observations must be time-bounded, sample-grounded, category-bounded, integrity-hashed, and free of unsupported claims. Confidence below 60% requires user review and cannot flow into reasoning as authoritative evidence.

The intended downstream separation is:

1. deterministic media tools establish technical facts and scene boundaries;
2. Qwen2.5-VL produces grounded visual observations;
3. deterministic QA verifies coverage, identity, safety, and evidence integrity;
4. the approved reasoning route may consume only verified evidence;
5. workers still execute immutable approved snapshots, never raw visual-model output.

## Three Authority Phases

The contract distinguishes three purposes instead of forcing every visual operation behind the same commercial gate:

1. `preplan_internal_source_analysis` requires authenticated user consent, exact source-study authority, and an internal ReEditPro analysis-budget authority. It has no customer credit reservation and cannot create a customer charge. This is the analysis needed to understand the source before the user can approve a truthful plan and estimate.
2. `approved_snapshot_targeted_reinspection` requires the exact approved snapshot, active reservation identity, and approved work item. It still records internal infrastructure cost separately from customer charging.
3. `postrender_private_visual_qa` adds the exact private render artifact and checksum to approved snapshot/work-item authority.

## Internal Infrastructure Cost

Self-hosting changes the cost unit from provider tokens to measured Google Cloud infrastructure. The contract accepts a versioned rate snapshot rather than embedding a possibly stale or invented Google price. The snapshot binds an exact pricing-evidence artifact and source-content digest, billing region, observation time, and storage-month basis. Direct attempt-level usage can include:

- allocated L4 GPU milliseconds;
- allocated vCPU-milliseconds;
- allocated GiB-memory-milliseconds;
- retained private artifact MiB-milliseconds;
- network egress bytes;
- GCS class A and class B operations.

Integer USD-micro arithmetic rounds each component up. A cache miss must include measured GPU allocation and one exact Cloud Run execution resource. A validated private cache hit must report zero new GPU allocation and no new Cloud Run GPU execution. At most two ordered attempts may be aggregated; a failed first attempt remains in internal cost evidence instead of disappearing when a retry succeeds.

This evidence is explicitly `provisional_metered_not_invoice_reconciled`. It excludes provider token prices, future customer price, future customer credits, ReEditPro service fee, wallet mutation, customer charging, and invoice reconciliation.

The smoke uses a clearly synthetic rate fixture solely to prove unit math. It is not a Google Cloud price claim and must never be used as a production rate card.

## Current Evidence

`server/smoke/private-gcp-visual-understanding-smoke.ts` proves, without media or network side effects:

- a 400 GiB, two-hour, 3840×2160 immutable source identity;
- a 1920×1080 analysis proxy bound to that source;
- 240 detected scenes and 240 represented scenes;
- 241 exact samples across four bounded model batches;
- a maximum 30-second unobserved span;
- one checksummed original-resolution fine-text crop;
- current server readiness failing closed;
- theoretical all-evidence-present contract readiness without claiming deployment;
- pre-plan, approved-snapshot reinspection, and post-render QA authority shapes;
- checkpoint, coverage, and tenant cache invalidation;
- evidence integrity, missing-window, audio-authority, crop, proxy, and low-confidence failures;
- exact internal-cost math, failed-attempt retention, retry ordering, cache-hit GPU exclusion, and commercial-boundary separation.

Run the bounded proof with:

```bash
./node_modules/.bin/tsx server/smoke/private-gcp-visual-understanding-smoke.ts
```

## Gates Still Closed

This increment does not prove any of the following:

- an approved Qwen2.5-VL checkpoint and license record in an immutable deployed image;
- a deployed Cloud Run GPU job, L4 capacity, region policy, IAM, or service account;
- generation-bound private GCS read/write transport;
- canonical queue reservation, lease, one-use dispatch, cancellation, retry, lease reclaim, or restart recovery;
- durable checkpoint/evidence/cost persistence and cross-instance readback;
- real scene detection, frame extraction, model inference, or two-hour wall-clock performance;
- a current official Google Cloud rate snapshot or invoice reconciliation;
- downstream planner, approved snapshot, work graph, private preview, or final-master QA integration;
- production security, tenant isolation, retention/restore, deployment, public delivery, or billing.

An exact server-owned readiness attestation and the internal-environment GPU execution gate remain required. The readiness schema in this version accepts only `internal`; limited beta and production are deliberately outside its authority. A synthetic smoke fixture with all readiness booleans set to true verifies contract behavior only; it is not evidence that those conditions exist in Google Cloud.

## Next Safe Integration

The next implementation should adapt this contract into the canonical queue/lease/one-use dispatch, private artifact persistence, and existing Google Cloud worker authority. It must supply real server-owned readiness evidence, an approved immutable worker image/checkpoint, a versioned official infrastructure rate snapshot, measured usage, durable evidence, and replay-safe downstream handoff. It must not create a second queue, tool registry, persistence authority, customer billing system, or Edit Preference authority.
