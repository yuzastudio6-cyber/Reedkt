# Living Frame canonical asset/work input binding

Status: private/internal, server-derived planning authority. This binding does
not create a work item, mutate the asset manifest, or execute a tool.

`canonical-living-frame-asset-work-input-binding-v2` closes the gap between a
selected Living Frame scene and the existing WeEditPro estimate/work/asset
pipeline. It rereads and cross-validates:

- the selected-scene publication, execution requirements, and exact
  MasterTiming/SoundSync binding;
- the full semantic-plan projection;
- the existing Living Frame synthesis-routing and component asset-intent
  compilers;
- the existing named-work admission catalog;
- the current canonical source sequence and cleanup decisions; and
- the exact server-verified source-media manifest candidate.

For each selected component it retains the ordered asset-intent chain and
classifies each input as exact canonical source media, a deterministic semantic
specification, a pending provider artifact, or a pending named-work output.
Approved-source intents bind one exact source-sequence item, media asset,
checksum, size, MIME type, source binding hash, storage identity hash, cleanup
decision, and source frame. The source is resolved from the selected canonical
segment's full containment in one ordered, confirmed cleanup timeline span.
The exact scene-start meaning frame is mapped back through that cleanup span
to one source-frame index and bound with the MasterTiming FPS and a
content-addressed selection digest. Segment order is never assumed to equal
upload order, and cross-source scenes or out-of-range frame mappings fail
closed. Paths, URLs, credentials, and media bytes remain excluded.

The binding also refines broad capability-derived work requirements against
the actual selected asset-intent graph. For the controlled source-derived
scene fixture, the broad capability audit proposed mask generation, RGBA
preparation, background reconstruction, and Remotion preparation. The exact
selected asset-intent chain is:

1. approved source asset;
2. still alpha mask;
3. processed RGBA component; and
4. Remotion layer preparation.

Background reconstruction is therefore omitted before customer estimation or
work-graph mutation. The refined named-work set is
`generate_mask_asset`, `process_image_asset`, and
`prepare_remotion_layer`, with exact asset-intent and dependency lineage.

This is not runtime admission. The current dependency-input operations remain
blocked, the customer estimate must be recalculated from the refined work set,
and the one existing approved work graph, asset manifest, QA plan, private
review, captions/SoundSync, Remotion composition, and final export pipeline
remain authoritative.

The binding adds no tool identity and reuses the exact 50-tool registry.
GPU-heavy mask inference remains Google Cloud Run GPU-only with no CPU
fallback.
