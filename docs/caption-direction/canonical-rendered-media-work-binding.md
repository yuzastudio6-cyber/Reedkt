# Canonical Caption rendered-media work binding

Status: source-complete for the private/internal pipeline

`canonical-caption-rendered-media-work-binding-v1` connects the selected
Caption specialist plan to WeEditPro's existing rendering owners:

- libass owns each approved caption overlay PNG;
- Remotion remains the sole final canvas owner; and
- the canonical edit work graph, asset manifest, estimate, reservation, worker
  lease, artifact QA, and reconciliation services retain their existing
  authority.

The server creates the binding only when it can prove all of the following
from one immutable plan:

- the exact Caption planning projection and every
  `compile_caption_render_spec` job;
- one confirmed output ID, width, height, and frame rate;
- the exact MasterTiming reference;
- one or more approved libass overlay work items with safe-region collision
  policy, immutable caption-text and payload digests, timing IDs, renderer
  layer IDs, and planned PNG outputs;
- one approved Remotion final-composition work item whose cue ranges and
  dependencies cover every overlay; and
- the final private MP4 output, with captions ordered above Living Frame and
  controlled visual overlays.

The binding is persisted create-only with the canonical plan, reread and
recomputed before approval, copied into the immutable approved snapshot, and
revalidated when execution authority is loaded. If Caption was selected but
the exact media work is absent, crossed, duplicated, or stale, publication
cannot manufacture a binding and approval retains the
`caption_rendered_media_work_binding` blocker.

This milestone does not execute media and does not claim that a caption was
visually acceptable. The follow-up planning binding now schedules qualified
complete-time visual review and freezes independent private-review
dependencies, while their actual evidence remains post-execution. Provider,
model, billing, public-delivery, and production authority remain false.
