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
  -> canonical Living Frame execution-authority gate
       -> deliberate non-use: existing immutable approved snapshot
       -> selected scene: exact timing/estimate/work/assets/QA required
  -> existing edit execution authority only after that gate passes
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

The server also derives and freezes
`livingFrameExecutionRequirements`, which maps each selected scene to its
exact current canonical segment and projects its named work, timing,
SoundSync, asset, QA, and private-review requirements without granting those
authorities. It then derives `livingFrameTimingBinding`, which resolves the
five semantic phases and requested SoundSync cues to exact MasterTiming
frames while preserving speech and caption priority.

Their references participate in the existing presented-plan hash. Approval
and execution authority reload and fully revalidate all five records.
Missing, partial, cross-scope, stale, or digest-mismatched lineage fails
closed.

Deliberate non-use can pass through the existing approval path because it
requires no Living Frame execution. A selected scene cannot yet be approved:
the server rejects funding before reservation or snapshot creation until the
same canonical plan also freezes exact MasterTiming and SoundSync bindings,
an itemized estimate, named work items, asset outputs, QA, and private-review
dependencies. This prevents a selected skill from being silently omitted by
an otherwise valid final-render graph.

The selector is process-bound through a `WeakSet`; copying or JSON-serializing
the port removes its authority. It may either choose admitted candidate scenes
with a closed treatment or preserve deliberate non-use. It cannot choose an
unknown scene or add provider, tool, work, queue, cost, timing, SoundSync,
asset, QA, renderer, or runtime instructions.

This slice establishes selected-scene planning lineage and a fail-closed
approval boundary. It
does not yet derive Living Frame estimate line items, work items, asset
manifest entries, exact timing, executable Remotion payloads, artifact QA, or
private-review completion. Those must be added through the existing WeEditPro
edit pipeline before a selected Living Frame scene can enter an approved
snapshot or contribute to a deliverable render.

See `docs/living-frame/living-frame-execution-requirements.md` for the exact
requirements boundary and
`docs/living-frame/living-frame-canonical-timing-binding.md` for the timing
boundary.

GPU-heavy Living Frame inference remains restricted to separately qualified
Google Cloud Run GPU workers. This binding performs no model inference and
defines no CPU fallback.
