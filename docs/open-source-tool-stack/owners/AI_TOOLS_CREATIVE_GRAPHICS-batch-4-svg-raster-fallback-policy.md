# AI_TOOLS_CREATIVE_GRAPHICS Batch 4 SVG Raster Fallback Policy

Decision: `approved_with_warnings_for_ai_graphics_batch_4_policy_and_handoff_review`

## Fallback Review

Batch 4 records fallback planning only. If `@resvg/resvg-js` remains host-blocked or unsafe for future import proof, later packets may compare metadata-only or manifest-only alternatives before any rasterization approval exists.

## Candidate Fallback Classes

| Class | Current status | Boundary |
| --- | --- | --- |
| SVG manifest validation | `available_as_planning_pattern` | Can validate shape/metadata only in later approval packets. |
| Remotion vector composition handoff | `track_a_handoff_only` | Track A owns final render/export and composition execution. |
| Browser/canvas raster path | `blocked` | No browser, canvas, or WebGL runtime in Batch 4. |
| resvg raster output | `blocked` | Requires separate explicit rasterization approval. |
| public output delivery | `blocked` | Signed URLs and public artifacts are not source of truth. |

## Source Of Truth Boundary

Future raster fallback evidence must use committed sanitized summaries, private artifact placeholders, checksums/provenance, and approved plan snapshots. Signed URLs are not source of truth.

No SVG rasterization, browser runtime, canvas runtime, WebGL runtime, Remotion render/export, route/tool/worker/provider execution, Supabase mutation, GCS/storage transfer, signed URL creation, public artifact creation, beta unlock, or production unlock was enabled.
