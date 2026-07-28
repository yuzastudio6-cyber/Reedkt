# Living Frame selected-scene binding

Living Frame is an optional WeEditPro editing skill. It does not own a
separate workflow, planner, approval system, work queue, renderer, or delivery
path.

The canonical selected-scene binding adds one private, server-derived planning
component beside the existing deferred Living Frame parent:

```text
deferred Living Frame user-intent component
  + current semantic projection
  + current selected-scene admission
  + process-bound server selector
  -> canonical selected-scene binding
  -> existing canonical plan component references
  -> existing immutable approved snapshot
  -> existing edit execution authority
```

The deferred parent remains unchanged. The browser cannot replace it with a
selected scene, and the selector cannot consume raw chat. The server rereads
the exact persisted planning handoff, confirmed output frame, current
MasterTiming expectation, semantic proposal lineage, Visual Continuity Pack,
and selected-scene admission before accepting a decision.

Three content-addressed records are frozen into the existing canonical plan:

- `livingFrameSelectedSceneBinding`;
- `livingFrameSelectedSceneAdmission`; and
- `livingFrameSemanticPlanProjection`.

Their references participate in the existing plan hash and are copied
unchanged into the immutable approved snapshot. Approval and execution
authority reload and fully revalidate all three records. Missing, partial,
cross-scope, stale, or digest-mismatched lineage fails closed.

The selector is process-bound through a `WeakSet`; copying or JSON-serializing
the port removes its authority. It may either choose admitted candidate scenes
with a closed treatment or preserve deliberate non-use. It cannot choose an
unknown scene or add provider, tool, work, queue, cost, timing, SoundSync,
asset, QA, renderer, or runtime instructions.

This slice establishes selected-scene planning and snapshot lineage only. It
does not yet derive Living Frame estimate line items, work items, asset
manifest entries, exact timing, executable Remotion payloads, artifact QA, or
private-review completion. Those must be added through the existing WeEditPro
edit pipeline before Living Frame can contribute to a deliverable render.

GPU-heavy Living Frame inference remains restricted to separately qualified
Google Cloud Run GPU workers. This binding performs no model inference and
defines no CPU fallback.
