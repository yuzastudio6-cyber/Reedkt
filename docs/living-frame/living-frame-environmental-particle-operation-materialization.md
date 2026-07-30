# Living Frame Environmental Particle Operation Materialization

Status:
`private_request_lease_created_operation_unregistered_dispatch_blocked`

Contract:
`living-frame-environmental-particle-operation-materialization-v1`

Private request:
`living-frame-environmental-particle-private-pixijs-request-v1`

## Purpose

This candidate defines the closed private request boundary for the future
PixiJS Living Frame environmental-particle operation:

`tool.pixijs.render_living_frame_environmental_particles.v1`

It consumes only a verified
`living-frame-environmental-particle-kernel-v1` candidate and the exact input
that reproduces it. It materializes one process-bound, single-use private
request lease plus a byte-free public receipt.

It does not register or execute the operation.

## Why the existing operation is not reused

The current canonical PixiJS operation is:

`tool.pixijs.render_pixi_scene.v1`

That operation has a fixed 640×360, 30-fps, 60-frame,
`approved_motion_card_v1` payload with an opaque panel and one PNG output. It
is valid for its current review-card scope, but it cannot express:

- exact project frame dimensions;
- an arbitrary approved MasterTiming frame range;
- a typed environmental profile;
- deterministic particle state tracks;
- transparent alpha output;
- one transparent sample per bound frame; or
- a time-sampled primitive for later Remotion composition.

The existing operation remains unchanged.

## Private request envelope

The private request contains:

- the existing `pixijs` tool identity;
- the unregistered candidate operation identity;
- exact kernel and state-sequence digests;
- exact Visual Continuity Pack, scene-design, environment, frame, confirmed
  output-frame, MasterTiming, and server-seed digests;
- exact width, height, fps, start frame, exclusive end frame, and duration;
- the approved asset treatment, depth style, motion density, and palette
  color;
- the typed profile, physics, appearance, and particle count;
- deterministic analytic state tracks;
- fixed PixiJS package and entrypoint identity; and
- a closed transparent frame-sequence output policy.

The request is created entirely from verified server-side evidence. The caller
cannot provide or override:

- tool or operation identity;
- seed;
- dimensions or frame range;
- profile, physics, appearance, or state tracks;
- prompt or transcript;
- model;
- code, shader, HTML, CSS, or script;
- texture or external asset;
- path, URL, bytes, credential, command, or environment; or
- dispatch, runtime, artifact, final-canvas, cost, billing, or production
  authority.

## Supervised renderer policy

The future qualified runtime must use:

- package: `pixi.js`;
- version: `8.19.0`;
- entrypoint: `Application.init`;
- server-owned template:
  `living_frame_environmental_particles_v1`;
- one request for one attempt;
- zero network access;
- no caller code or shader;
- no caller asset or texture;
- no arbitrary save or preview behavior; and
- one transparent sample for every frame in the bounded range.

This is a request contract only. It does not prove that the current browser
graphics runner supports the new operation or output.

## Output contract

One future attempt may produce exactly one logical bundle:

`private_transparent_rgba_png_frame_sequence_bundle_v1`

The bundle requires:

- exact confirmed-frame width and height;
- one transparent PNG for each bound frame;
- straight-alpha PNG output;
- a private frame manifest;
- create-only artifact persistence;
- no square substitution;
- no final-video-canvas claim; and
- later consumption by a qualified Remotion time-sampled overlay adapter.

The transparent sequence is an input to the edit. Remotion remains the final
canvas and retains captions, layout, compositing, timing, and export
ownership.

## Process-bound lease

The public result contains one byte-free receipt and one lease object.

The receipt records:

- lineage digests;
- exact render envelope;
- profile and style classifications;
- particle and state counts;
- private-request digest and serialized byte length; and
- all blocked authority flags.

It does not contain raw state tracks, prompts, transcripts, media bytes,
paths, URLs, credentials, commands, or environment.

The private request is stored only behind the in-process lease object. Object
identity is required; a serialized or cloned lease is invalid. The request can
be consumed once, and reuse fails closed.

Consuming the lease reveals the request to a future server-side adapter but
does not dispatch it or grant any execution authority.

## Tool identity and registry policy

This operation stays under the existing `pixijs` executable identity. It does
not create another tool identity and does not require registry expansion.

The registry remains semantically extensible: a genuinely distinct released
executable may become another identity when its independent runtime, security,
cost, QA, fallback, and release evidence warrants it. A profile, renderer
template, adapter, or operation inside the existing supervised PixiJS runtime
does not.

## Authority boundary

This candidate owns only private request materialization.

It does not own:

- the particle kernel;
- selected-scene or profile selection;
- the Visual Continuity Pack;
- MasterTiming or motion budget;
- geometry;
- tool or operation registration;
- work graph, queue, or dispatch;
- browser/PixiJS execution;
- artifact persistence or the asset manifest;
- Remotion;
- QA approval or private review;
- cost, billing, or settlement; or
- production release.

`selectedSceneBound`, `canonicalTimingBound`, `operationRegistered`,
`dispatched`, `runtimeExecuted`, `artifactPersisted`, and `productionReady`
remain false.

## Remaining canonical path

1. Resolve the selected-scene visual-range versus five-phase timing-domain
   conflict.
2. Add the immutable approved environmental-profile reference.
3. Bind the selected scene, profile, geometry, confirmed frame, MasterTiming,
   kernel, and request through the canonical operation input.
4. Register the new operation under the existing PixiJS identity only after
   runtime qualification.
5. Implement and verify the fixed supervised template and transparent
   time-sampled output in the existing browser-graphics runtime.
6. Bind one canonical work item, logical artifact bundle, manifest entry,
   idempotency key, and attempt cost.
7. Add procedural-alpha, temporal consistency, motion-budget, destination-
   composite, caption/narration-safety, and private-review QA.
8. Add the qualified Remotion time-sampled overlay adapter.
9. Keep customer billing, public delivery, and production release blocked
   until all canonical evidence is released.

## Validation

The smoke fixture proves:

- exact 3840×2160 output-frame preservation;
- exact 44-frame transparent sequence request;
- all seven typed profile identities materialize through the same operation;
- one logical output bundle and one future-attempt lease;
- private request digest equality;
- process-bound, single-use lease behavior;
- no mutation of the currently registered PixiJS operation;
- no state tracks or media bytes in the public receipt;
- fixed PixiJS package and entrypoint;
- Remotion final-canvas ownership; and
- adversarial refusal of extra operation fields, caller dimensions, mismatched
  kernel lineage, forged authority, square substitution, final-canvas claims,
  cloned leases, and lease reuse.

The server implementation contains no named example-subject routing.

## Files

- `src/types/living-frame-environmental-particle-operation-materialization.ts`
- `server/living-frame/living-frame-environmental-particle-operation-materialization.ts`
- `server/smoke/living-frame-environmental-particle-operation-materialization-smoke.ts`
