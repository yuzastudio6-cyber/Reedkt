# Living Frame Selected-Scene Environmental Particle Internal Test

Status:
`actual_private_internal_selected_scene_full_range_pixijs_and_remotion_timeline_green_persistence_pending`

Contract:
`living-frame-selected-scene-environmental-particle-internal-test-v1`

## Purpose

This boundary proves that the environmental-particle implementation can execute
the exact selected Living Frame scene rather than only an isolated eight-frame
renderer fixture.

The representative helicopter scene selects `helicopter.downwash` for the
canonical `demonstrate` and `resolve` phases. The current MasterTiming binding
therefore requires:

- output frame: 1920×1080;
- FPS: 30;
- first particle frame: 30;
- exclusive final particle frame: 135; and
- total particle-frame count: 105.

The internal test revalidates the selected-scene admission, immutable
MasterTiming digest, confirmed output-frame digest, component geometry,
selective-motion reconciliation, and Visual Continuity Pack before it creates
any private runtime request.

## Explicit profile binding

The canonical selected-scene component does not yet carry the immutable typed
environmental-effect profile reference. The test does not infer a profile from
the component ID, summary, subject, or genre.

Instead, it consumes the namespaced server-owned internal-test binding:

`internal-test.environmental-particle.restrained-airborne-dust-settle.v1`

That binding resolves to
`restrained_airborne_dust_settle_v1` only inside this private qualification
boundary. It has no canonical or production profile-selection authority.

The public report records both identities and explicitly records:

- component-summary parsing: false;
- component-ID parsing: false;
- subject/genre routing: false;
- canonical profile-selection authority: false; and
- production profile-selection authority: false.

## Real execution evidence

The test compiles one deterministic particle kernel for the exact 105-frame
window, creates one process-bound request lease, and performs one real PixiJS
attempt.

The qualified container executes:

- `pixi.js@8.19.0`;
- the real `Application.init` entrypoint;
- one request and one attempt;
- non-root user `10001:10001`;
- zero network;
- a read-only root filesystem;
- all capabilities dropped; and
- no caller command, mounts, environment, prompt, seed, dimensions, code, or
  assets.

The result contains 105 exact 1920×1080 RGBA PNG frames. Host-side measurement
proves transparent endpoints, active intermediate frames, temporal variation,
and alpha-centroid movement. The PNG bytes remain behind a process-bound
single-use lease for the next Remotion test; the report is byte-free.

The qualification runner now shares the deterministic kernel's existing
maximum duration of 600 frames. Its request-byte, output-byte, pixel,
dimension, particle-count, memory, CPU, PID, network, and one-attempt limits
remain unchanged.

## Authority boundary

This test proves that the execution belongs to the exact selected scene and
canonical timing evidence. It does not take ownership of scene selection or
timing.

It keeps false:

- operation registration;
- shared work-graph dispatch;
- artifact persistence;
- asset-manifest mutation;
- final renderer authority;
- QA approval;
- private-review approval;
- actual-cost creation;
- customer charging;
- external beta; and
- production readiness.

The same smoke now consumes the one 105-frame lease in the bounded
full-duration Remotion timeline adapter. Seven real Remotion chunks preserve
all 105 selected frames, and final pixel QA proves materially visible
particles, temporal movement, source-plate preservation, and caption-plane
priority.

The next internal step is canonical create-only scene-package persistence,
asset-manifest reconciliation, destination-composite QA, and private review.
Customer billing and production release are not prerequisites for those
internal tests.

## Validation

Run:

`npm run smoke:living-frame-selected-scene-environmental-particle-internal-test`

The smoke also rejects:

- a Visual Continuity Pack with a forged output-frame binding;
- an unregistered caller-selected profile;
- mismatched selected-scene, timing, component, geometry, or pack lineage;
- raw byte leakage; and
- customer or production authority promotion.

## Files

- `src/types/living-frame-selected-scene-environmental-particle-internal-test.ts`
- `server/living-frame/living-frame-selected-scene-environmental-particle-internal-test.ts`
- `server/smoke/living-frame-selected-scene-environmental-particle-internal-test-smoke.ts`
- `docker/qualification/living-frame-environmental-particle-pixijs/runner.mjs`
- `src/types/living-frame-selected-scene-environmental-particle-remotion-full-timeline-internal-test.ts`
- `docs/living-frame/living-frame-selected-scene-environmental-particle-remotion-full-timeline-internal-test.md`
