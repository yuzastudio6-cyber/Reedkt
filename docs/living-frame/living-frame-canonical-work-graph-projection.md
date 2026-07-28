# Living Frame canonical work-graph projection

Status: private/internal, server-derived canonical plan work. The projection
adds required items to the one WeEditPro work graph, but it does not approve,
queue, dispatch, or execute them.

`canonical-living-frame-work-graph-projection-v4` consumes and fully
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
- either one exact admitted operation payload or an explicit pending-operation
  authority.

The current controlled source-derived scene therefore adds exactly four
items, in dependency order:

1. `process_image_asset` for the exact source-frame PNG through the existing
   FFmpeg operation;
2. `generate_mask_asset` through the existing `rembg` operation;
3. `process_image_asset` for the component image; and
4. `prepare_remotion_layer`.

These items do not add tool IDs. The production registry remains exactly 50.
The source-frame item reuses `ffmpeg`; the mask item reuses `rembg`; the two
remaining dependency-input items have empty tool and operation IDs and use
`living_frame_operation_admission_pending_worker`.

The rembg work item is exact but not runtime-ready. Its immutable input binds
the selected scene, asset/work projection, customer estimate, one exact
FFmpeg source-frame dependency, fixed U2NetP settings, the existing mask QA
gates, and this resource policy:

```text
worker: gpu_ai_worker
target: google_cloud_run_gpu
accelerator: nvidia_l4
device: cuda
CPU fallback: false
runtime download: false
network fetch: false
```

The existing historical CPU rembg proof cannot satisfy this work item.
Resource placement keeps it `privateExecutionReady = false` and requires
`canonical_rembg_cloud_run_gpu_runtime_qualification`. The canonical CUDA
runtime, model-artifact mount, source-frame reread, output verifier, attempt,
cost, artifact commitment, and QA authorities must all pass later.

The two remaining pending items are also
`privateExecutionReady = false` and require
`canonical_living_frame_dependency_input_operation_admission`.

This fail-closed representation is intentional. The exact rembg operation and
GPU policy are admitted into planning, but no cloud job or inference authority
is granted. The current Sharp operation still does not admit the required
source/mask PNG pair, and the current Remotion operation does not admit the
exact Living Frame layer package. Treating any of these incomplete stages as
runtime-ready would be false authority.

The content-addressed projection is included in the canonical plan hash and is
reread at approval and approved-execution loading. Every projected plan work
item is rechecked against its immutable execution-input hash, source and
cleanup bindings, dependencies, expected outputs, fallback policy, and credit
budget. Missing, extra, or modified Living Frame work fails closed.

Selected scenes remain unapprovable until the remaining dependency-input
operations, rembg GPU runtime qualification, asset-manifest entries, artifact
QA, private review, and final-composition dependency are admitted through the
existing pipeline. Deliberate non-use produces an empty verified projection
and can continue through normal approval.

This component creates no approved work item, job, queue record, asset-manifest
entry, artifact, QA result, private-review result, renderer payload, provider
call, tool dispatch, wallet mutation, or production authority. GPU-heavy mask
inference remains Google Cloud Run GPU-only with no CPU fallback.
