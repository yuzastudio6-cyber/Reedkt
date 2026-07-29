# Living Frame Deterministic Motion

## Status

This is a subject-agnostic deterministic scalar-track sampler for Living
Frame. It is not a planner, MasterTiming authority, SoundSync authority,
renderer, work item, tool route, approval, or production runtime.

## Purpose

Living Frame should animate meaningful components with controllable motion
rather than asking a video model to invent every frame. The same motion
language must support illustrated characters, machinery, maps, products,
scientific diagrams, archives, particles, environments, and future visual
subjects without hardcoded subject modes.

The fixed `frame_bound_scalar_tracks_v1` profile supports:

- normalized X/Y position;
- rotation;
- uniform scale;
- opacity;
- blur and focus depth;
- path reveal;
- particle-emission control;
- light intensity; and
- shadow opacity.

Tracks are grouped as primary, secondary, ambient, or camera motion. Multiple
properties may belong to one primary motion group, but competing primary
groups may not overlap. The compiler also rejects overlapping tracks that try
to control the same property on the same component.

## Timing boundary

The sampler accepts exact integer frames only through a bounded timing
expectation containing:

- MasterTimingPlan ID and digest;
- confirmed output-frame ID and digest;
- scene ID and frame range; and
- rational frame rate.

Those values are copied and sampled; they are not created or verified as
canonical by this primitive. Every bundle retains
`canonicalTimingRevalidationStillRequired = true`, and all timing/exact-frame
authority remains false.

The canonical work-graph adapter now rereads the selected scene,
MasterTimingPlan, output frame, and terminal component lineage before compiling
the narrower `canonical-living-frame-motion-spec-v1` admitted by the private
Remotion runtime. This generic bundle remains non-promotable on its own. Stale
or caller-authored frame values fail closed at the canonical adapter.

## Motion behavior

Keyframes are strictly ordered and bounded to their scene. Each segment uses a
closed easing:

- linear or hold;
- quadratic in/out;
- cubic in/out;
- mechanical acceleration;
- fast strike acceleration; or
- settle-out.

The final keyframe must hold. Attention/focus tracks can require return to the
initial value; incomplete restoration is rejected. The compiler emits one
sample per covered frame with deterministic six-decimal rounding.

The motion budget is structural:

- one primary motion group at a time;
- secondary and ambient tracks may support it;
- camera tracks are identified separately;
- conflicting component/property ranges are rejected; and
- total tracks, keyframes, frames, and samples are bounded.

This does not replace creative motion direction. It executes an already
selected, already timed scalar performance.

## Renderer boundary

The bundle contains values and metadata, not JavaScript, CSS, Remotion code,
provider prompts, tool IDs, commands, or media. Remotion remains the final
deterministic compositor. The private/internal canonical renderer adapter now
maps the closed renderable subset onto validated Living Frame component,
virtual-camera, and source-plane tracks; unsupported generic control signals
remain unadmitted. See
`docs/living-frame/living-frame-canonical-motion-runtime.md`.

Particle-emission and path-reveal values are control signals only. Their
actual implementations remain qualified renderer primitives. Sound is
deliberately absent: exact SFX placement, mixing, panning, and ducking remain
SoundSync authority.

## Generic coverage

The smoke fixture uses generic component identities to prove:

- continuous mechanical rotation;
- rapid primary position change;
- delayed secondary follow-through;
- camera emphasis; and
- a focus handoff that restores the speaker.

These cover the behavior illustrated by prior examples without creating
Musashi, helicopter, map, history, science, finance, or any other
subject-specific runtime route.

## Authority boundary

Every bundle keeps MasterTiming, exact-frame, planning, SoundSync, estimate,
cost, approval, snapshot, provider, tool-route, work-graph, queue,
asset-manifest, renderer, render-execution, runtime-promotion, and production
authority literal false.
