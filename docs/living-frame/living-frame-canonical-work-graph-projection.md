# Living Frame canonical work-graph projection

Status: private/internal, server-derived canonical plan work. The projection
adds required items to the one WeEditPro work graph, but it does not approve,
queue, dispatch, or execute them.

`canonical-living-frame-work-graph-projection-v6` consumes and fully
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
- one exact admitted tool payload or one exact server-owned manifest payload.

The current controlled source-derived scene therefore adds exactly four
items, in dependency order:

1. `process_image_asset` for the exact source-frame PNG through the existing
   FFmpeg operation;
2. `generate_mask_asset` through the existing `rembg` operation;
3. `process_image_asset` for the component image; and
4. `prepare_remotion_layer`.

These items do not add tool IDs. The production registry remains exactly 50.
The source-frame item reuses `ffmpeg`; the mask item reuses `rembg`; the
component item reuses `sharp`; and the Remotion-layer item is tool-free
server-owned manifest compilation. It does not add a Remotion dispatch.

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

The Sharp component item now has an exact two-dependency contract. It accepts
only the approved exact source-frame PNG and the QA-selected rembg grayscale
mask PNG, both by immutable asset/dependency lineage. The existing Sharp
operation performs a real deterministic decode, verifies source opacity and
mask shape, copies source RGB, derives straight alpha from the mask, clears
RGB under zero alpha, encodes PNG, decodes it again, and requires byte-exact
RGBA agreement. The operation creates no new tool identity and cannot run
until both upstream artifacts are committed, selected by the worker lease,
and reread through the existing private dependency authority.

The Remotion-layer item freezes the exact RGBA component dependency, scene and
layer identities, MasterTiming frame range, confirmed dimensions, fill and
opacity policy, and caption-above-overlay rule. The same projection carries a
content-addressed final-composition binding. Publication applies it to the one
existing final Remotion work item, adds the manifest and component dependency
keys, and inserts the Living Frame layer between source and captions.

This fail-closed representation is intentional. The exact rembg operation and
GPU policy are admitted into planning, but no cloud job or inference authority
is granted. Sharp's real alpha-component path is admitted but remains
dependency-blocked behind the GPU mask and both upstream artifact/QA records.
The existing Remotion operation now admits the immutable overlay timeline at
planning time. Treating that planning admission as an executed manifest,
render, or QA pass would still be false authority.

The content-addressed projection is included in the canonical plan hash and is
reread at approval and approved-execution loading. Every projected plan work
item is rechecked against its immutable execution-input hash, source and
cleanup bindings, dependencies, expected outputs, fallback policy, and credit
budget. Missing, extra, or modified Living Frame work fails closed.

Selected scenes are approvable only after the exact estimate, source/mask/
component/manifest graph, and final-composition binding are frozen. Execution
remains blocked until rembg GPU runtime qualification, artifact-manifest
entries, dependency QA, and private review pass. Deliberate non-use produces
an empty verified projection and continues through normal approval.

This component creates no approved work item, job, queue record, asset-manifest
entry, artifact, QA result, private-review result, renderer payload, provider
call, tool dispatch, wallet mutation, or production authority. GPU-heavy mask
inference remains Google Cloud Run GPU-only with no CPU fallback.

The exact Sharp component boundary is documented in
`docs/living-frame/living-frame-canonical-sharp-alpha-component.md`.
