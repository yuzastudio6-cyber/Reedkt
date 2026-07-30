# Living Frame Environmental Particle Remotion Internal Composite

Status: actual private/internal qualification evidence. Customer dispatch,
billing, delivery, external beta, and production release remain false.

## Purpose

The PixiJS qualification runtime proves that the real `pixi.js@8.19.0`
`Application.init` entrypoint can produce an exact deterministic transparent
PNG sequence. That proof is incomplete unless the PNG bytes can reach the
existing Remotion compositor and remain visibly time-varying below captions.

This slice closes that isolated internal-test dependency without changing the
shared Remotion runtime, its registered operation, the production tool
registry, the work graph, the asset manifest, or any customer-facing route.

## Private sequence lease

`executeLivingFrameEnvironmentalParticlePixiJsInternalRuntimeWithPrivateSequenceOutput`
returns the existing byte-free report plus a process-bound, single-use output
lease. The public lease contains only lineage, counts, and digests. Exact PNG
bytes remain in a server-side `WeakMap`.

`consumeLivingFrameEnvironmentalParticlePixiJsPrivateSequenceOutputLease`
rejects:

- cloned leases;
- reused leases;
- cross-process or unregistered objects;
- report or sequence lineage drift; and
- any authority promotion.

The consumed server-only packet carries one exact PNG byte buffer per measured
frame. It is not an artifact record and cannot dispatch, bill, approve QA, or
promote production.

## Bounded Remotion adapter

The current shared Remotion contract accepts static PNG Living Frame layers.
The namespaced qualification adapter therefore maps each sequence frame to a
two-frame overlay:

```text
frame N PNG:
  visible at frame N
  opacity zero at frame N+1

frame N+1 PNG:
  visible at frame N+1
  opacity zero at frame N+2
```

The opacity gate is a valid canonical scalar motion specification. Eight
PixiJS frames become eight ordered server-injected PNG commitments. The
existing Remotion operation
`tool.remotion.render_approved_composition.v1` performs the real render.

Each individual Remotion request remains intentionally bounded to at most
sixteen overlays. The selected-scene full-timeline adapter composes the exact
105-frame range as seven bounded Remotion chunks, then uses FFmpeg only to trim
known local filler frames and concatenate the already composited results.
Every retained final review frame is still produced by Remotion.

## Actual evidence

The smoke:

```text
server/smoke/
  living-frame-environmental-particle-remotion-internal-composite-smoke.ts
```

executes and independently verifies:

- eight actual 3840×2160 straight-alpha PixiJS PNG frames;
- a process-private single-use byte handoff;
- exact digest and byte-length revalidation;
- the existing confined Remotion image and operation;
- server-injected input streams with no base64 media transport;
- a 640×360 private review render preserving the confirmed 16:9 ratio;
- every particle frame sampled at its exact absolute frame;
- transparent first and last particle frames;
- six visible active frames;
- visible temporal variation and alpha-centroid movement;
- source-plate preservation;
- caption-plane priority above the particle layer;
- non-root, read-only, capability-dropped, no-new-privileges, zero-network
  execution; and
- byte-free public evidence.

The 640×360 output is a private review projection. It does not claim that a
customer 4K delivery master was rendered, and it does not fabricate delivery
authority or an approved credit reservation merely to satisfy the existing 4K
delivery profile.

The selected-scene smoke additionally proves:

- one exact 105-frame 1920×1080 PixiJS input range;
- seven real Remotion chunk renders;
- one final 640×360, 30 FPS, 105-frame private review;
- full-frame pixel sampling rather than sparse sampling;
- perceptual QA that distinguishes sub-perceptual fade endpoints from missing
  particle overlays; and
- exact selected-scene, MasterTiming, output-frame, geometry,
  selective-motion, and continuity-pack lineage.

## Remaining internal end-to-end work

This adapter is green for isolated and full selected-scene timeline internal
testing. Internal E2E still needs canonical-owner integration for:

1. an immutable selected-scene environmental profile reference;
2. work-item and asset-manifest persistence for the sequence;
3. canonical private artifact storage and review;
4. destination-composite scene QA; and
5. later shared-operation admission if customer execution is pursued.

Customer production readiness is not the current completion target. These
internal integration gates must close first; public delivery, deployment,
billing, external beta, and production promotion remain later independent
release gates.
