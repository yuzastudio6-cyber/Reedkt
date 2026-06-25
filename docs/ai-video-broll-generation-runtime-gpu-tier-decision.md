# AI Video B-roll Generation Runtime / GPU Tier Decision

Status: `ai_video_broll_gen_4_runtime_gpu_tier_decision_no_execution`

This document ranks the future runtime tiers by cost, risk, and intended use. It does not inspect local GPU hardware, run cloud commands, start Docker, or install packages.

| Tier | Candidate models | Recommended role | Gate 4 decision | Required owner evidence before execution |
| --- | --- | --- | --- | --- |
| `cpu_diagnostics_only` | none | Docs, manifests, diagnostics, source checks | accepted | none beyond diagnostics. |
| `small_preview_gpu` | Wan 1.3B, LTX-Video | First controlled dependency install proof and later small synthetic proof | conditionally accepted | Worker Runtime, private cache, cost placeholder, no weights/inference until later gates. |
| `mid_720p_gpu` | Wan 14B, LTX larger/newer lanes | Quality comparison after small preview lane | planning only | GPU cost, queue latency, storage, QA, rollback, owner acceptance. |
| `high_research_gpu` | Mochi 1 | Research/fallback comparison only | planning only | High VRAM cost review, dependency isolation, no default route. |
| `premium_gated_gpu` | HunyuanVideo | Optional benchmark after legal review | blocked | Legal, territory, commercial, and output-use acceptance. |
| `cloud_gpu_job` | future selected subset | Private job-only execution after local/import proof | handoff only | GCP owner acceptance, Cloud Run/GKE policy, private artifact policy, no public endpoint. |

## Why This Ranking

- Wan 1.3B is the safest cost-friendly primary lane to test dependency installation first.
- LTX is the best fast-preview secondary lane and may reduce cost for short preview/video motion cases.
- Wan 14B and newer LTX lanes may improve quality but need stronger GPU/cost review.
- Mochi has permissive/research value but carries heavier runtime expectations.
- Hunyuan remains blocked because license and territory restrictions are not resolved.

## Google Cloud / GCP Handling

Gate 4 does not query or mutate Google Cloud. Existing GCP docs show staging resource names and command policy only. Any future cloud GPU path must be a private job-only plan with human/owner approval before commands are run.

## Required Metrics For Future Proofs

- GPU type.
- VRAM.
- Driver/CUDA/PyTorch compatibility.
- Expected install footprint.
- Expected model cache size.
- Expected generated clip duration and resolution.
- Queue latency placeholder.
- Cost placeholder.
- Cleanup result.
- Private artifact path policy.
- Failure/rollback policy.
