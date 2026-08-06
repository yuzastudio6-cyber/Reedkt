# Living Frame Renderer Plan Binding

Status: controlled, non-executable adapter candidate.

Contract:
`living-frame-renderer-plan-binding-v1`

## Purpose

Living Frame must compile into ReeditPro's existing
`RendererCompositionPlan`. It must not create a parallel renderer plan,
timeline, layer-ID authority, work graph, asset manifest, Remotion runtime, or
review path.

The renderer-plan binding closes one structural gap between the generic Living
Frame render projection and the current renderer planner. It proves that every
projected visual component has exactly one compatible layer in an existing
draft renderer plan while retaining the exact Living Frame projection,
deterministic-motion, output-frame, and `MasterTimingPlan` lineage.

It does not modify the renderer plan.

## Inputs

The server compiler accepts:

- one digest-verified Living Frame render projection;
- the exact digest-verified deterministic-motion bundle from which that
  projection was compiled;
- one existing `RendererCompositionPlan`; and
- an ordered component-to-existing-layer mapping.

The existing renderer plan must:

- use Remotion;
- retain `approvalRequired = true` and `renderReady = false`;
- reference the same `MasterTimingPlan`;
- use the same confirmed canvas dimensions and fps;
- cover the complete Living Frame scene duration; and
- contain unique, structurally valid layers.

Caller-selected providers, tools, work items, queues, asset-manifest records,
costs, credits, commands, code, paths, URLs, credentials, chat, transcripts,
or media bytes are not accepted.

## Exact mapping rules

Every projected layer must be mapped exactly once, in projection order, to a
unique existing renderer layer. The compiler verifies:

- compatible projected primitive and renderer layer type;
- exact normalized-to-pixel placement;
- scene time coverage;
- strictly increasing renderer z-index;
- source artifact and mask references;
- ordered deterministic-motion track references; and
- caption layers, when present, remain above all mapped Living Frame layers.

The virtual camera remains a separate candidate binding. It is not disguised
as a renderer layer.

The current `RendererLayerPlan` does not carry Living Frame's full frame
samples, pivots, masks, alpha modes, depth transitions, or camera tracks. The
binding therefore keeps
`canonical_renderer_layer_extension_required` open. A later reviewed shared
adapter must preserve these properties rather than reducing them to a generic
`motionPreset` or free-form note.

## Projection blockers

A clean projection produces
`candidate_pending_canonical_snapshot_projection`.

A projection with unresolved procedural-alpha, additive-effect, or depth
compilation gates produces
`blocked_by_living_frame_projection_gates`. The binding preserves this blocked
state and adds `living_frame_projection_blockers_must_resolve`; it does not
promote the scene merely because compatible renderer layers exist.

## Authority boundary

The output is a content-addressed binding candidate only. All of the following
remain literal false:

- renderer-plan and renderer-layer-ID authority;
- renderer-plan mutation;
- `MasterTimingPlan`, exact-frame, and SoundSync authority;
- estimate, cost, approval, and snapshot authority;
- asset-manifest and artifact-QA authority;
- provider, tool-route, work-graph, and queue authority;
- Remotion execution and private-review authority; and
- runtime, production, and delivery authority.

The later canonical integration must reread the current renderer plan,
Living Frame projection, motion bundle, confirmed output frame, timing plan,
approved snapshot, manifest, work graph, and QA state before execution.

## Generic coverage

The controlled smoke maps generic background, primary visual, speaker, camera,
and caption identities. It deliberately has no Musashi, helicopter, Hormuz,
history, map, science, finance, or other subject-specific route. Those subjects
remain examples of capabilities, never product dispatch keys.
