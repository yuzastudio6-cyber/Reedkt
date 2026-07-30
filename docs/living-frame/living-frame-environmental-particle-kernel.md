# Living Frame Environmental Particle Kernel

Status:
`profile_catalog_and_deterministic_sampling_green_selected_scene_binding_pending`

Contract:
`living-frame-environmental-particle-kernel-v1`

## Purpose

The environmental-particle kernel is a subject-neutral, typed preparation
candidate for selective Living Frame motion. It turns one server-selected
environmental profile, one validated Visual Continuity Pack, and one exact
bounded frame binding into deterministic particle state tracks.

It closes the generic profile-and-state-generation portion of the
selected-scene environmental-particle admission without creating another
planner, clock, tool identity, renderer, artifact lane, QA authority, or cost
owner.

It is not a selected-scene materializer and is not executable production
evidence.

## Typed profile catalog

The catalog contains seven restrained, allowlisted profile identities:

| Profile | Effect family |
| --- | --- |
| `restrained_airborne_dust_settle_v1` | airborne dust |
| `restrained_smoke_rise_v1` | rising smoke |
| `restrained_mist_drift_v1` | drifting mist |
| `restrained_ember_lift_v1` | lifting embers |
| `restrained_rainfall_v1` | rainfall |
| `restrained_snowfall_v1` | snowfall |
| `restrained_water_spray_v1` | water spray |

Each profile fixes:

- emitter and particle shape;
- density-specific particle count;
- direction, spread, speed, gravity, and turbulence;
- lifetime and fade behavior;
- normalized radius and opacity range;
- Visual Continuity Pack palette-role priority; and
- controlled blend mode.

The catalog does not inspect component IDs, human-readable summaries,
subjects, genres, transcript text, or prompt text to select a profile.
Canonical selected-scene evidence must eventually carry an immutable typed
profile reference.

## Visual continuity binding

The candidate validates the complete Visual Continuity Pack and binds:

- asset treatment;
- line language;
- palette and the selected approved color;
- lighting direction and character;
- edge and texture treatment;
- detail density;
- depth style;
- motion character and density; and
- camera character.

This preserves the approved style language across flat, shallow-2.5D,
deep-multiplane, and dimensional source preparation. It does not convert every
scene into 2.5D and does not override the approved depth style.

The scene design sheet and environment sheet must be exact members of the
validated pack. Cross-pack and cross-environment substitution fail closed.

## Deterministic sampling

The kernel uses only server-derived digest input. It accepts no caller seed,
particle settings, dimensions, prompt, model, path, URL, bytes, credentials,
command, environment, dispatch instruction, or authority flag.

One compilation produces:

- a fixed profile;
- a bounded particle count capped by the approved motion density;
- deterministic initial state;
- analytic frame state for every particle;
- one-shot, non-looping birth and lifetime ranges;
- zero-opacity first and final samples; and
- stable sequence and candidate digests.

The same validated input and server seed digest produce the same sequence
digest. A different server seed digest produces a different sequence.

The frame contract is normalized but exact:

- confirmed width and height;
- frames per second;
- inclusive start and exclusive end frame;
- normalized emitter rectangle;
- normalized anchor point;
- confirmed-output-frame digest;
- MasterTiming digest; and
- server-seed digest.

The candidate permits at most 600 frames and requires both confirmed-frame and
MasterTiming revalidation flags. Those flags are requirements for a future
canonical adapter; this kernel does not itself become either authority.

## Tool and renderer disposition

PixiJS remains the existing executable tool identity. This candidate does not
create a particle-tool identity or register
`tool.pixijs.render_living_frame_environmental_particles.v1`.

Registry size is semantic rather than count-limited: a genuinely distinct
released executable may later earn a new identity, but profiles, particle
families, libraries, adapters, and capabilities inside one existing PixiJS
attempt do not.

The required future path is:

```text
approved selected-scene typed profile reference
→ canonical MasterTiming and motion-budget binding
→ this deterministic state-kernel contract
→ qualified bounded PixiJS time-sampled transparent operation
→ canonical work item, artifact, manifest, cost, and QA
→ qualified Remotion time-sampled overlay adapter
→ Remotion final canvas
→ canonical private review
```

No part of this candidate may be interpreted as a final-canvas claim.

## Authority boundary

The candidate owns only:

- the typed subject-neutral profile catalog; and
- deterministic particle state sampling.

It explicitly does not own:

- selected-scene admission;
- canonical profile selection;
- the Visual Continuity Pack;
- MasterTiming;
- motion budget;
- component geometry;
- tool or operation registration;
- work graph, queue, dispatch, or runtime;
- artifacts or the asset manifest;
- Remotion composition;
- QA approval or private review;
- cost, billing, or settlement; or
- production release.

`selectedSceneBound`, `canonicalTimingBound`, `operationRegistered`,
`dispatchGranted`, and `productionReady` therefore remain false.

An adjacent
`living-frame-environmental-particle-operation-materialization-v1` candidate
now proves the next private boundary: it converts only a verified kernel into
one process-bound single-use request lease for the unregistered PixiJS
operation and emits a byte-free receipt. It does not change this kernel's
authority or satisfy any selected-scene, runtime, artifact, renderer, QA,
cost, billing, or release gate.

See
`docs/living-frame/living-frame-environmental-particle-operation-materialization.md`.

## Open shared-owner gates

1. Add one immutable typed environmental-profile reference to approved
   selected-scene/component evidence.
2. Reconcile the current canonical phase-domain conflict: selected-scene
   MasterTiming currently exposes a visual range narrower than the five
   semantic phases, while the canonical motion compiler requires those phases
   to exactly partition the visual range.
3. Bind the selected profile and exact state-kernel frame domain through the
   canonical motion-budget owner.
4. Extend the existing PixiJS identity with the qualified, closed,
   server-derived, time-sampled transparent operation.
5. Add canonical work-item, artifact, asset-manifest, cost-attempt, QA, and
   private-review lineage.
6. Add the qualified time-sampled Remotion overlay adapter while preserving
   Remotion as final canvas.
7. Keep operation registration, dispatch, runtime, billing, public delivery,
   and production authority false until their released evidence exists.

## Validation

The smoke fixture proves:

- all seven profiles compile and map to seven unique effect families;
- profile counts stay within sparse, balanced, and rich motion-density caps;
- cinematic deep-multiplane and paper-collage shallow-2.5D style bindings stay
  distinct;
- deterministic replay and changed-seed divergence;
- exact 3840×2160 confirmed-frame preservation;
- bounded frame state and zero-opacity endpoints;
- no selected-scene or canonical-timing claim; and
- adversarial refusal of unknown profiles, non-string identifiers, malformed
  frame bindings, caller settings and seed, unconfirmed frame, invalid
  geometry, excessive duration, forged style pack, cross-environment
  substitution, invalid digest, and authority promotion.

The server implementation contains no named example-subject routing.

## Files

- `src/types/living-frame-environmental-particle-kernel.ts`
- `server/living-frame/living-frame-environmental-particle-kernel.ts`
- `server/smoke/living-frame-environmental-particle-kernel-smoke.ts`
- `docs/living-frame/living-frame-environmental-particle-operation-materialization.md`
