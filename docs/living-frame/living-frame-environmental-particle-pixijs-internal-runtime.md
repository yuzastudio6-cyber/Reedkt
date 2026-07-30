# Living Frame Environmental Particle PixiJS Internal Runtime

Status:
`actual_private_internal_pixijs_runtime_green_canonical_release_gates_closed`

Contract:
`living-frame-environmental-particle-pixijs-internal-runtime-v1`

Operation candidate:
`tool.pixijs.render_living_frame_environmental_particles.v1`

## Purpose

This namespaced qualification runtime closes the gap between the deterministic
environmental-particle kernel and real PixiJS pixels for private internal
testing.

It consumes:

- one verified environmental-particle kernel and its reproducing input;
- one verified operation-materialization receipt; and
- the matching process-bound, single-use private request lease.

It then compiles only the server-derived state samples into a fixed PixiJS
request, executes the real `pixi.js@8.19.0` `Application.init` entrypoint in a
confined offline browser container, decodes and measures every returned PNG
again on the host, and returns a byte-free report.

This is real internal execution evidence. It is not production operation
registration, canonical dispatch, artifact persistence, customer billing,
public delivery, or production promotion.

## Runtime image

The qualification image derives from the already inspected private offline
browser-graphics image. It does not modify the shared image or its runtime
source.

The derived image:

- is built from four committed, bounded files;
- inherits the already pinned browser, Playwright, esbuild, PNG decoder, and
  `pixi.js@8.19.0`;
- runs as `10001:10001`;
- uses the fixed entrypoint
  `node /app/living-frame-environmental-particle-runner.mjs`;
- records the base-image identity hash and source digest in labels;
- is explicitly qualification-only and private-internal-only; and
- keeps operation registration, product, external-beta, and production
  readiness false.

The derived image remains part of the existing `pixijs` executable identity.
It does not create a new tool identity.

## Confinement

Every request runs in one newly created container with:

- network mode `none`;
- read-only root filesystem;
- all capabilities dropped;
- `no-new-privileges`;
- non-root user `10001:10001`;
- no caller command;
- no bind or volume mounts;
- no caller environment;
- bounded PIDs, CPU, memory, shared memory, stdin, stdout, frame count, particle
  count, dimensions, and pixels;
- one fixed `/tmp` tmpfs with `noexec`, `nosuid`, and `nodev`; and
- one request for one attempt.

The browser aborts any network request and the result requires a measured
network-request count of zero.

## Closed request

The public caller cannot provide dimensions, seed, prompt, code, shader,
HTML/CSS, texture, asset, path, URL, credential, command, environment,
arbitrary save/preview node, or final-canvas claim.

The host consumes the private lease exactly once and revalidates:

- materialization digest;
- private request digest;
- kernel and deterministic-sequence digests;
- confirmed output-frame digest;
- MasterTiming digest;
- exact width, height, FPS, start frame, and exclusive end frame;
- transparent straight-alpha PNG output;
- fixed package, version, entrypoint, and template;
- one logical bundle; and
- all false authority flags.

Only active particle state samples are passed into the fixed browser template.
The runtime request itself is digest-bound before container execution.

## Real pixel evidence

The current internal fixture executes eight 3840×2160 samples. The actual
browser output proves:

- `pixi.js@8.19.0` was installed in the image;
- the real `Application.init` entrypoint executed;
- a transparent PixiJS canvas and stage rendered;
- eight real PNG byte strings were returned;
- every PNG has the exact 3840×2160 dimensions and RGBA color type;
- first and last frames are fully transparent;
- six frames contain expected particle alpha;
- seven distinct PNG digests exist;
- alpha-weighted centroid movement is present;
- every frame matches the kernel-derived active/settled expectation; and
- the host independently decodes and alpha-measures every frame.

The serialized report contains no PNG bytes, decoded RGBA bytes, state tracks,
caller prompt, caller path, URL, credential, command, or environment.

## Internal-testing disposition

This evidence is sufficient to mark the isolated PixiJS particle kernel/runtime
boundary `internalTestReady = true`.

It deliberately keeps:

- `selectedSceneBound = false`;
- `canonicalTimingBound = false`;
- `operationRegistered = false`;
- `canonicalDispatchIntegrated = false`;
- `artifactPersisted = false`;
- `assetManifestMutated = false`;
- `rendererMutated = false`;
- `qaApproved = false`;
- `privateReviewApproved = false`;
- `actualCostCreated = false`;
- `customerCharged = false`;
- `externalBetaReady = false`; and
- `productionReady = false`.

This distinction supports the current product goal: complete private internal
testing before any customer-facing release work.

## Remaining internal end-to-end path

1. Reconcile the canonical selected-scene visual-range versus five-phase
   timing conflict.
2. Attach the immutable typed environmental profile through the selected-scene
   owner.
3. Bind one selected component, one canonical work item, and one planned
   logical sequence asset.
4. Persist the private frame sequence through the existing create-only
   artifact and asset-manifest owners.
5. Add the canonical Remotion time-sampled transparent overlay adapter.
6. Render the sequence inside the real Living Frame scene.
7. Run procedural-alpha, temporal, destination-composite,
   narration/caption-safety, and private-review QA.

Customer billing, public delivery, and production promotion are later release
work and are not prerequisites for those private internal tests.

## Validation

The smoke covers:

- real package and entrypoint execution;
- exact full-frame dimensions;
- real RGBA PNG bytes and host-side remeasurement;
- transparent endpoints and active middle frames;
- temporal variation and centroid movement;
- network, filesystem, privilege, command, mount, and environment confinement;
- single-use and cloned-lease refusal;
- caller-dimension extra-field refusal;
- cross-materialization/work substitution refusal;
- square/final-canvas authority forgery refusal;
- byte-free public report;
- subject-neutral server implementation; and
- false registry, dispatch, artifact, cost, billing, external-beta, and
  production authority.

## Files

- `docker/qualification/living-frame-environmental-particle-pixijs/`
- `src/types/living-frame-environmental-particle-pixijs-internal-runtime.ts`
- `server/living-frame/living-frame-environmental-particle-pixijs-internal-runtime.ts`
- `server/smoke/living-frame-environmental-particle-pixijs-internal-runtime-smoke.ts`
