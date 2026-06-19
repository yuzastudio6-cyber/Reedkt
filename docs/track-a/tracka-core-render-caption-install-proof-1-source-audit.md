# TRACKA-CORE-RENDER-CAPTION-INSTALL-PROOF-1 Source Audit

Audit status: `completed_source_evidence_only`.

This audit reads repository source declarations and status docs only. It does not install tools, execute tools, build Docker images, run media processing, run workers, run routes, mutate Supabase, run SQL, or unlock beta/production/final delivery.

## Owner Sources

| Source | Status | Evidence |
| --- | --- | --- |
| #544 | `merged_source_of_truth` | Atlas Track A owner: `owner_tracka_visual_render_export`; workstream: `TRACK_A_VISUAL_RENDER_EXPORT`; `claimedScopedTools` only. |
| #547 | `merged_source_of_truth` | Inventory records `libass_caption_burnin` and `opentimelineio_timeline_validation` as `installed_with_source_evidence`. |
| #542 | `merged_track_b_owner_source` | Track B owns FFmpeg, FFprobe, Sharp/libvips, OpenColorIO, OpenImageIO, and other global media OSS tools. |
| #543 | `active_ai_graphics_owner_source` | AI Graphics / Worker owns SAM2, Kornia, BiRefNet, Real-ESRGAN, and adjacent AI graphics/model lanes. |

## Source Paths Checked

- `docs/tool-ownership/central-tool-owner-registry.json`
- `docs/tool-ownership/owner-atlas-tracka-visual-render-export.md`
- `docs/track-a/atlas-tracka-open-source-tool-inventory-1-tool-matrix.md`
- `docs/track-a/atlas-tracka-open-source-tool-inventory-1-install-evidence.md`
- `docs/track-a/atlas-tracka-open-source-tool-inventory-1-duplicate-scan.md`
- `docker/prod/render-worker/Dockerfile`
- `docker/prod/render-worker/requirements.render.txt`
- `docker/prod/tool-readiness-worker/Dockerfile`
- `docker/prod/tool-readiness-worker/requirements.readiness.txt`
- `docs/internal-beta/track-a-restricted-beta-included-capabilities.md`
- `docs/track-a/track-a-private-e2e-revalidation-1-scope-contract.md`
- `docs/track-a/track-a-private-e2e-revalidation-1-worker-tool-route-handoff.md`

## Findings

`docker/prod/render-worker/Dockerfile` lists `libass9` and `libass-dev`.

`docker/prod/tool-readiness-worker/Dockerfile` lists `libass9`.

`docker/prod/render-worker/requirements.render.txt` lists `opentimelineio`.

`docker/prod/tool-readiness-worker/requirements.readiness.txt` lists `opentimelineio`.

Track A private caption/render review docs record caption policy and private render/export review scope, but private E2E execution remains blocked by Worker Runtime, Supabase Worker Runtime RPC/schema readiness, and guarded private execution gates.

## Non-Claims

Atlas Track A does not claim broad/global FFmpeg or FFprobe. FFmpeg/FFprobe are referenced only as Track B-owned shared dependencies for future handoff.

Product-ready end-to-end local OSS tools: `0`.

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, tool installation, tool execution, media processing, or broad service-role handler was enabled.
