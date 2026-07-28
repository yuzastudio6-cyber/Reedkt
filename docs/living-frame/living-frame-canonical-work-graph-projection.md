# Living Frame canonical work-graph projection

Status: private/internal, server-derived canonical plan work. The projection
adds required items to the one WeEditPro work graph, but it does not approve,
queue, dispatch, or execute them.

`canonical-living-frame-work-graph-projection-v2` consumes and fully
revalidates:

- the canonical Living Frame selected-scene publication;
- the execution-requirements and exact MasterTiming/SoundSync bindings;
- the exact source/asset/work input binding;
- the estimate/work/asset projection;
- the server-recalculated customer estimate and WeEditPro service fee; and
- the current canonical source, cleanup, output-frame, and timing components.

For every refined Living Frame requirement, it creates one deterministic
canonical plan work item with:

- the exact scene, source-sequence, cleanup-decision, source-frame,
  input-asset-intent, and output-asset-intent lineage;
- the existing named work-item type and dependency keys;
- one required, non-placeholder expected output;
- the exact server-derived maximum credit budget from the customer estimate;
  and
- an explicit pending-operation authority that states no dependency-input
  operation or executable payload has been admitted.

The current controlled source-derived scene therefore adds exactly three
items, in dependency order:

1. `generate_mask_asset`;
2. `process_image_asset`; and
3. `prepare_remotion_layer`.

These items do not add tool IDs. Their `approvedToolIds` and approved operation
IDs are empty, provider execution mode is `none`, and their worker class is
`living_frame_operation_admission_pending_worker`. Resource placement
recognizes that class as a tool-free control-plane placeholder, marks it
`privateExecutionReady = false`, and requires
`canonical_living_frame_dependency_input_operation_admission`.

This fail-closed representation is intentional. The existing rembg operation
still accepts no real source frame or dependency artifact, the current Sharp
operation does not admit the required source/mask PNG pair, and the current
Remotion operation does not admit the exact Living Frame layer package.
Treating those fixture-era contracts as executable would be false authority.

The content-addressed projection is included in the canonical plan hash and is
reread at approval and approved-execution loading. Every projected plan work
item is rechecked against its immutable execution-input hash, source and
cleanup bindings, dependencies, expected outputs, fallback policy, and credit
budget. Missing, extra, or modified Living Frame work fails closed.

Selected scenes remain unapprovable until the real dependency-input
operations, asset-manifest entries, artifact QA, private review, and final
composition dependency are admitted through the existing pipeline. Deliberate
non-use produces an empty verified projection and can continue through normal
approval.

This component creates no approved work item, job, queue record, asset-manifest
entry, artifact, QA result, private-review result, renderer payload, provider
call, tool dispatch, wallet mutation, or production authority. GPU-heavy mask
inference remains Google Cloud Run GPU-only with no CPU fallback.
