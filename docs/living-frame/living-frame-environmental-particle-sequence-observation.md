# Living Frame Environmental Particle Sequence Observation

Status:
`controlled_fixture_png_alpha_and_temporal_measurement_green_runtime_output_unproven`

Contract:
`living-frame-environmental-particle-sequence-observation-v1`

Evidence class:
`controlled_non_promotable_private_transparent_sequence_measurement_candidate`

## Purpose

This namespaced candidate defines the byte-observation boundary that a future
qualified PixiJS environmental-particle attempt must satisfy.

It consumes:

- one verified `living-frame-environmental-particle-kernel-v1` candidate;
- the exact kernel input that reproduces it;
- one verified
  `living-frame-environmental-particle-operation-materialization-v1`
  receipt; and
- one process-bound server-owned private output reader.

It reads and decodes the private PNG frame sequence in process, measures every
alpha plane, verifies exact frame and lineage constraints, and emits a
byte-free digest/count/measurement report.

It does not dispatch or execute PixiJS. The current fixture source is
deliberately labeled `controlled_non_promotable_fixture`; therefore this
contract does not prove a PixiJS entrypoint, a qualified browser runtime,
artifact persistence, canonical QA approval, private review, or production
readiness.

## Closed input boundary

The caller may supply only:

- a safe observation identity;
- one server-owned output locator;
- the verified kernel and its reproducing input;
- the verified operation-materialization receipt; and
- the fixed process-bound reader port.

The reader accepts no caller packet and owns no operation, dispatch, runtime,
artifact, or production authority. Extra reader or observer fields fail
closed. The private output packet must contain exactly:

- the materialization, private-request, kernel, deterministic-state,
  confirmed-frame, and MasterTiming digests;
- the existing `pixijs` identity and unregistered environmental operation;
- exact width, height, FPS, inclusive start, and exclusive end frame;
- one logical straight-alpha PNG sequence bundle;
- one ordered PNG per exact frame; and
- false runtime, registration, dispatch, artifact, final-canvas, cost,
  billing, and production flags.

The packet may exist only inside the process-private reader boundary. Its
digest excludes raw PNG bytes and binds each frame through order, absolute
frame, byte length, and SHA-256 digest.

## Byte-level PNG requirements

Every frame is parsed from its actual private bytes. The decoder requires:

- the exact PNG signature;
- a first and unique `IHDR`;
- 8-bit RGBA color type 6;
- standard compression, filtering, and interlace values;
- valid CRC on every chunk;
- at least one `IDAT`;
- exactly one valid `IEND`;
- no unknown critical chunk;
- no trailing bytes;
- bounded inflate size;
- exact decoded RGBA byte length; and
- exact confirmed-frame width and height.

All five standard PNG row filters are decoded deterministically. RGB-only,
opaque-only format substitution, square full-frame substitution, malformed
chunks, corrupt CRC, dimension mismatch, frame omission, reordering, and
cross-output lineage fail closed.

## Alpha and temporal measurement

Every decoded RGBA frame is passed to the existing
`living-frame-alpha-measurement-v1` measurement owner. The observation report
retains only:

- PNG and decoded-RGBA digests;
- alpha-measurement report digest and finding codes;
- transparent, semi-transparent, and opaque pixel counts;
- alpha coverage and border transparency;
- non-transparent bounds;
- alpha-weighted centroid;
- kernel-derived expected active-particle count; and
- whether the frame matched its expected active or settled state.

The aggregate requires:

- the exact complete frame set;
- successful PNG byte decoding for every frame;
- exact dimensions and RGBA format for every frame;
- alpha measurement for every frame;
- a fully transparent first frame;
- a fully transparent last frame;
- at least two active frames;
- at least two distinct PNG digests;
- measured alpha-centroid movement; and
- complete agreement with kernel-derived active-frame expectations.

Pixel variation does not prove that a sequence is non-looping. The report
therefore fixes `noLoopingClaimedFromPixels` to false. The deterministic
kernel owns the one-shot state claim; a future canonical temporal QA owner
must combine kernel, real runtime output, destination composite, motion
budget, and review evidence.

## Fixture disposition

The smoke fixture creates an eight-frame 3840×2160 straight-alpha sequence
from the verified deterministic kernel, encodes real PNG bytes, and routes
them through the process-bound reader. That fixture proves the observer and
measurement contract, not the future PixiJS renderer.

The byte-free report explicitly records:

- `pixiJsEntrypointExecutionProven = false`;
- `qualifiedRuntimeOutputProven = false`;
- `runtimeExecuted = false`;
- `artifactPersisted = false`;
- `qaApproved = false`;
- `privateReviewApproved = false`;
- `actualCostCreated = false`;
- `customerCharged = false`; and
- `productionReady = false`.

It contains no PNG/RGBA bytes, state tracks, prompt, transcript, path, URL,
credential, command, or environment.

## Canonical ownership

This candidate owns only private sequence measurement. It does not own:

- selected-scene or typed-profile selection;
- MasterTiming or motion budget;
- the deterministic particle kernel;
- tool or operation registration;
- work graph, queue, or dispatch;
- browser or PixiJS execution;
- create-only persistence or asset manifest;
- Remotion;
- QA approval or private review;
- cost, billing, or settlement; or
- production release.

Remotion remains the final canvas. A future qualified transparent sequence is
an input to a canonical time-sampled overlay adapter, never a final video
canvas.

## Remaining path

1. Resolve the shared selected-scene visual-range versus five-phase timing
   conflict.
2. Add the immutable approved typed environmental-profile reference.
3. Bind the selected scene, profile, kernel, operation request, one work item,
   one logical artifact bundle, and one attempt cost through canonical owners.
4. Qualify and register the fixed PixiJS operation in the existing supervised
   browser-graphics runtime.
5. Feed its actual process-private output bytes into this observer with
   `qualifiedRuntimeOutputProven` governed by released runtime evidence, not
   inferred locally.
6. Persist the verified logical bundle through the canonical create-only
   artifact and asset-manifest owners.
7. Run canonical procedural-alpha, temporal, destination-composite,
   narration/caption-safety, and private-review QA.
8. Qualify the Remotion time-sampled overlay adapter.
9. Keep customer billing, public delivery, and production release blocked
   until every released evidence gate passes.

## Validation

The smoke covers:

- exact 3840×2160 and eight-frame lineage;
- actual RGBA PNG encoding, CRC, inflate, row-filter decoding, and SHA-256
  verification;
- first/last fully transparent frames;
- six active frames, temporal digest variation, and alpha-centroid movement;
- byte-free measurement output;
- false runtime/artifact/QA/cost/billing/production authority;
- reader and observer extra-field refusal;
- cross-locator and cross-kernel/work substitution refusal;
- missing-frame refusal;
- 1024×1024 full-frame square substitution refusal;
- RGB PNG, opaque active frame, and corrupt-PNG refusal;
- operation/final-canvas authority-promotion refusal;
- raw-prompt packet refusal;
- forged report authority refusal; and
- subject-neutral server implementation.

## Files

- `src/types/living-frame-environmental-particle-sequence-observation.ts`
- `server/living-frame/living-frame-environmental-particle-sequence-observation.ts`
- `server/smoke/living-frame-environmental-particle-sequence-observation-smoke.ts`
