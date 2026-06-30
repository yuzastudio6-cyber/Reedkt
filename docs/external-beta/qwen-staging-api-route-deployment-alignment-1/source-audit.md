# RP External Beta QWEN Staging API Route Deployment Alignment 1 Source Audit

Packet: `RP-EXTERNAL-BETA-QWEN-STAGING-API-ROUTE-DEPLOYMENT-ALIGNMENT-1`

Decision: `completed_qwen_staging_api_route_deployment_alignment_current_source_bridge`

Execution: `completed_confirmed_staging_api_image_alignment_and_route_preflight_no_provider_execution`

Source base: `5cf82e6242677af8add6b53d5b5dd4c78c9ee9fe`

## Source Chain

- PR #1763 / merge `805bad1f3d5ad738ecb0204ebf696552a4364eca`: current QWEN transport dependency attempt result review.
- PR #1767 / merge `0258873cd11acd4fbc91f829e4c45ce25a44ebf8`: current QWEN transport readiness plan.
- PR #1774 / merge `5cf82e6242677af8add6b53d5b5dd4c78c9ee9fe`: confirmed transport preflight found deployed API route mismatch.
- PR #577 remains open/draft/blocked and excluded from source-of-truth.

## Finding

The repository route existed in the Express runtime path under `server/app.ts`, but `Dockerfile.backend` builds and runs `src/server/server.ts`, which dispatches through `src/server/server-router.ts`. The deployed staging API therefore returned HTTP `404` / `not_found` even after an image update from current source.

This packet adds only a native server-router bridge for `POST /api/providers/qwen2-5-vl/structured-visual-metadata`. The bridge returns the existing QWEN route-handler fail-closed source result with HTTP `424`; it does not enable provider/model calls, worker dispatch, Supabase mutation, media processing, artifact creation, or beta/production unlock.

Product-ready end-to-end local OSS tools: `0`.
