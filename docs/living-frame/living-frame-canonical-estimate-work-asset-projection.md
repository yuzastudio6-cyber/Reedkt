# Living Frame canonical estimate, work, and asset projection

Status: private/internal, server-derived requirements projection. It is not
customer commercial authority and does not execute a tool, create a work item,
or create an asset-manifest entry.

The v2 projection consumes the exact persisted Living Frame selected-scene
publication, named execution requirements, MasterTiming/SoundSync binding,
server-derived asset/work input binding, and current confirmed settings. For
each selected scene it derives:

- a conservative estimate-only cost basis from existing registered tool
  owners;
- one deterministic requirement for each existing named work-item type;
- one exact expected-output requirement that the existing approved asset
  manifest must eventually own;
- explicit dependency ordering and resource placement.

The current bounded mapping is:

| Existing named work type | Existing tool cost owner | Required placement |
| --- | --- | --- |
| `generate_mask_asset` | `rembg` | Google Cloud Run GPU; no CPU fallback |
| `process_image_asset` | `sharp` | private render worker |
| `reconstruct_background_plate` | `openimageio` | private CPU worker, only when the selected asset-intent graph actually requires a reconstructed plate |
| `prepare_remotion_layer` | `remotion` | private render worker |

These are cost and requirement owners, not executable route authorization.
Current rembg, OpenImageIO, Sharp, and Remotion private operations do not yet
admit the complete real Living Frame dependency-input contracts. The projection
therefore cannot be copied into the work graph as if fixture-only runners were
production-capable.

The customer-facing estimate remains owned by the one existing estimate and
service-fee policy. It must be recalculated from the projected cost basis before
approval. The one existing approved work graph and asset manifest remain the
only execution and artifact authorities. QA, private review, approval,
snapshot, provider/tool dispatch, rendering, runtime, and production remain
closed.

This adds no tool identity. The current canonical production registry is
revalidated before the projection can be compiled. Its observed identity count
is not a product cap. The current implementation still contains a temporary
exact-count compatibility guard; the backend one-writer must replace it with
semantic uniqueness/readiness validation before the registry expands.

Broad capability coverage is no longer treated as proof that every candidate
asset-producing operation is required. The exact selected component
asset-intent graph refines the work set first. This prevents a scene that only
needs a source-derived mask and RGBA component from being charged for an
unneeded background reconstruction.
