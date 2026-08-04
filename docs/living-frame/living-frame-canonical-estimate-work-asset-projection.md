# Living Frame canonical estimate, work, and asset projection

Status: private/internal, server-derived requirements projection. It is not
customer commercial authority and does not execute a tool, create a work item,
or create an asset-manifest entry.

The v6 projection consumes the exact persisted Living Frame selected-scene
publication, named execution requirements, MasterTiming/SoundSync binding,
server-derived asset/work input binding, and current confirmed settings. For
each selected scene it derives:

- a conservative estimate-only cost basis from existing canonical tool owners;
- one deterministic requirement for each exact asset-kind/operation class,
  even when two operations share a broad named work-item type;
- one or more exact expected-output requirements that the existing approved
  asset manifest must eventually own;
- explicit dependency ordering and resource placement.

The current bounded mapping is:

| Existing named work type | Existing tool cost owner | Required placement |
| --- | --- | --- |
| `generate_mask_asset` + `remove_still_image_background` | `rembg` | Google Cloud Run GPU; no CPU fallback |
| `process_video_asset` + `prepare_temporal_source_video` | `ffmpeg` | private CPU worker; operation admission pending |
| `generate_mask_asset` + `temporal_video_subject_segmentation_and_tracking` | `sam2` | Google Cloud Run GPU; no CPU fallback; operation/runtime/cost admission pending |
| `process_image_asset` + `prepare_straight_alpha_component` | `sharp` | private render worker |
| `reconstruct_background_plate` | `openimageio` | private CPU worker, only when the selected asset-intent graph actually requires a reconstructed plate |
| `prepare_remotion_layer` | `remotion` | private render worker |

These are cost and requirement owners, not executable route authorization.
The temporal SAM2 line is explicitly an unreleased zero-credit candidate:
its exact operation/model requirement is observed, but it is not a registered
operation contract and is not eligible for customer estimation before its
runtime cost owner is admitted. Current rembg, FFmpeg temporal source,
SAM2, OpenImageIO, Sharp, and Remotion operations do not yet admit every real
Living Frame dependency-input contract. The projection therefore cannot be
treated as proof of production-capable execution.

The customer-facing estimate remains owned by the one existing estimate and
service-fee policy. It must be recalculated from the projected cost basis before
approval. The one existing approved work graph and asset manifest remain the
only execution and artifact authorities. QA, private review, approval,
snapshot, provider/tool dispatch, rendering, runtime, and production remain
closed.

This adds no tool identity. The current registry count is observed, not treated
as a product cap. Before compiling, the projection verifies that declared
production identities are unique and have one-to-one profile coverage. A
future genuinely distinct released executable may expand the registry only
through the canonical registry owner and its operation/runtime/evidence gates;
weights, adapters, libraries, and in-process capabilities are not tool
identities.

Broad capability coverage is no longer treated as proof that every candidate
asset-producing operation is required. The exact selected component
asset-intent graph refines the work set first. This prevents a scene that only
needs a source-derived mask and RGBA component from being charged for an
unneeded background reconstruction.

For temporal Living A-Roll, refinement also prevents a more serious operation
substitution. `temporal_subject_mask_sequence` first creates a
`prepared_temporal_source_video` requirement through FFmpeg, then creates one
SAM2 temporal tracking requirement that depends on that exact work key. It can
never enter the rembg still-PNG lane. See
`living-frame-canonical-temporal-mask-work-admission.md`.
