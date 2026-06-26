# AI Video B-roll Tool Registry Owner Review

## Status

Decision: `ai_video_broll_tool_registry_owner_review_conditional_metadata_acceptance`

This owner-review packet conditionally accepts the AI B-roll production-tool registry and model-weight readiness metadata added for Wan/Wan2.1, LTX-Video, Mochi 1, and HunyuanVideo. Acceptance is limited to metadata, diagnostics, owner routing, fail-closed registry checks, and future model-weight evidence alignment.

## No-Scope Statement

No model weights are downloaded. No dependency is installed. No inference is run. No generated video is created. No Docker container is built or started. No GCP resource is touched. No Supabase command is run. No SQL is executed. No provider is called. No worker is dispatched. No storage object is created. No signed URL is created. No public artifact is created. No credit estimate, credit approval, reservation, spend, refund, or release is created. No beta, production, runtime-readiness, `dry_run_passed`, or `generated_local_fixture_passed` claim is made.

## Accepted Metadata

- `wan_video` is the primary open-source B-roll route for realistic stock-style generated filler.
- `ltx_video` is the secondary route for fast preview, image-to-video, keyframe, and motion-graphics workflows.
- `mochi_video` is fallback/research only.
- `hunyuan_video` is represented as blocked premium-gated metadata only.
- All four IDs are server-side production-tool IDs, not frontend tool IDs.
- All four routes require GPU worker ownership, approved snapshots, private artifacts, model-weight evidence, QA, billing/cost, and owner acceptance before execution.
- Fallback routing must prefer safer deterministic Remotion/cards/stills when generated video is unavailable, unsafe, too expensive, or QA-blocked.

## Remaining Runtime Blockers

- `GPUS_ALL_REGIONS` quota remains 0 and blocks the L4 proof VM.
- Wan downloaded-cache evidence exists outside the repo, but the production model-weight template still needs explicit alignment with approved source/revision/checksum/cache evidence.
- LTX and Mochi require exact source, version, checkpoint, and checksum evidence before any download or runtime route.
- HunyuanVideo remains blocked pending legal, territory, commercial, GPU, billing, and owner review.
- No source-install path is approved for any AI-video model repository in the production GPU worker image.
- No worker payload contract, private artifact manifest, cost estimate, QA report, or beta approval exists for real generated B-roll execution.

## Owner Decision

The registry/model-weight integration is accepted for planning and diagnostics only. It is not accepted for runtime execution, model imports, model loading, local fixture generation, beta, production, paid usage, or public artifact delivery.

## Required Next Implementation

The next implementation should align the model-weight templates with approved evidence where available, starting with Wan/Wan2.1 controlled-cache evidence, while keeping download, import, inference, GPU VM creation, provider calls, worker dispatch, storage, signed URLs, public artifacts, billing, beta, and production gates closed.

## Next Prompt

`AI-VIDEO-BROLL-GEN-TOOL-REGISTRY-2: align model-weight templates with approved cache evidence, no inference`
