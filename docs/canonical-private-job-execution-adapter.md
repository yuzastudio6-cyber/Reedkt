# Canonical Private Job Execution Adapter

Status: private single-host internal-test evidence

The canonical private job execution adapter connects one immutable derived job to its exact backend runner without accepting caller-authored execution authority.

## Route

`POST /v1/edit-executions/jobs/:jobId/private-internal-execution`

The route requires authenticated workspace access, the internal-service boundary, and an `Idempotency-Key`. Its strict body contains only:

- `workspaceId`
- `projectId`
- `editSessionId`
- `purpose: execute_canonical_private_job`

The caller cannot provide an approved snapshot, reservation, tool, operation, output, lease, dispatch credential, artifact path, URL, command, environment, provider, cost, customer price, customer credit, or billing instruction.

## Server-owned execution chain

The service reloads canonical readiness and immutable approved authority, requires exactly one expected output, and then:

1. derives the approved work item and output from the canonical job;
2. claims an opaque lease under the active funded reservation;
3. derives the exact proven tool identity, operation, and runner class;
4. issues and consumes one short-lived, single-use dispatch grant;
5. executes the existing canonical coordinator;
6. requires a private create-only artifact, passed QA, reconciliation, and downstream dependency eligibility;
7. stores a credential-free, checksum-protected idempotent adapter response.

Failure is also terminal and idempotent. A pre-execution block releases the lease; a runner exception after execution starts creates an immutable failed fence without commit/completion authority; and a post-commit exception requires reconciliation recovery instead of rerunning. The adapter persists one create-only failure outcome for the exact request key. A new key may claim another lease only when the same immutable work item still has an approved `maxAttempts` allowance. See `docs/canonical-failed-execution-recovery.md`.

Before any new claim, the adapter now checks for an existing completed execution fence. When exact private artifact, QA, reconciliation, consumed-dispatch, and required internal-cost evidence already exist, it reconstructs a create-only adapter completion and response without another lease, dispatch, or runner execution. Missing evidence remains `completed_recovery_required` and cannot become a retry. See `docs/canonical-post-commit-adapter-recovery.md`.

The tool-free `validate_approved_snapshot` job and dependency-bound `prepare_source_trim` plan-validation job use canonical internal runners. Source-trim validation requires exact approved source IDs, explicit cleanup decisions, meaning-preservation status, resolved user review, a passed upstream dependency, and a private JSON QA/reconciliation artifact. Tool jobs must name exactly one approved identity that is `canonical_e2e_verified` in the proven tool catalog. Multi-tool jobs fail closed. A job with one required output plus optional sibling outputs deterministically executes the sole required server-owned output; zero or multiple required outputs fail closed until a true multi-output adapter exists.

## Runner coverage

The adapter dispatch table covers all 15 proven runner classes used by the 50 canonical private E2E identities: Node, Sharp, Python, media binaries, Remotion, libass, browser graphics, bounded AI-capability fixtures, native image, native audio, container/package validation, VapourSynth, AudioFlux, rembg, and DeepFilterNet.

Executable adapter evidence currently proves:

- authenticated HTTP execution and HTTP idempotency replay for the tool-free canonical authority job;
- work-graph execution of the dependency-bound source-trim authority job;
- service execution of all eight structured Node identities (ECharts, Vega-Lite, Vega, Satori, SVG.js, Viz.js, Anime.js, and Three.js) with server-derived tool/operation/output identity, exact replay, and downstream dependency readback;
- service execution of all five browser-graphics identities (Lottie, PixiJS, Konva, Babylon.js, and fixed-template Playwright) with exact approved capture/scene authority, zero-network decoded non-flat PNG QA, exact replay, and downstream dependency readback;
- service execution of the two bounded AI-capability identities (Music21 and Kornia), two native-image identities (OpenColorIO and OpenImageIO), and two native-audio identities (RNNoise and Signalsmith Stretch) with exact approved server-owned profiles, private artifact QA, replay, and downstream dependency readback;
- service execution of MKVToolNix and GPAC/MP4Box package validation, VapourSynth frame processing, AudioFlux analysis, and rembg background removal with exact approved profiles, zero-network confined execution, private artifact QA, replay, and downstream dependency readback;
- service execution of all seven ordinary Python matrix identities (PrettyMIDI, NoiseReduce, Polars, OpenTimelineIO, OpenCV, PySceneDetect, and librosa) with server-derived operation/output authority, exact private artifacts, QA, replay, and downstream dependency readback;
- service execution of all ten source-backed Python audio identities (SciPy, PyLoudNorm, Pydub, Pydub Effects, EBU R128/PyLoudNorm, Audioread, Resampy, Pedalboard, mir_eval, and Mido) with server-derived source/tool/output authority, audio or JSON QA, replay, and downstream dependency readback;
- service execution of D3 followed by dependency-bound Sharp through separate job-only calls, preserving the exact D3 SVG downstream byte read and Sharp consumption of only the QA-passed/reconciled selected dependency;
- service execution of DuckDB and source-bound PyAV through job-only calls with exact server-derived operation/output identity, private JSON QA, replay, and downstream dependency readiness;
- service execution of DeepFilterNet through the job-only call with its exact pinned fixture output and create-only attempt-level internal production-cost evidence, kept separate from customer price, credits, fees, wallets, settlement, and billing;
- service execution of the controlled libass caption overlay and source-bound LGPL-profile FFmpeg trim through job-only calls, preserving the exact PNG/NUT artifacts, replay, downstream dependency readiness, and final-composition dependency chain;
- service execution of the exact private Remotion final-composition job with two lease-selected dependencies: source-trim authority JSON and libass caption PNG;
- approved trim-frame application to the exact source MP4, source-audio preservation, independent FFprobe H.264/AAC/frame/duration QA, private final-artifact persistence/download, and durable adapter replay without a second render;
- service execution of a separate canonical final-QA ffprobe job that consumes only the QA-passed/reconciled private final MP4 dependency, derives its expected media contract from the upstream approved Remotion work item, persists a private JSON report, and replays without a second probe;
- single-use dispatch consumption, private SVG persistence, QA, reconciliation, durable adapter replay, idempotency conflict, and downstream dependency readback;
- the independent canonical coordinator lifecycle for all 50 tool identities through `npm run smoke:canonical-private-tool-dispatch`.

The machine-readable proven-tool catalog records job-adapter proof separately from coordinator-only canonical E2E proof. At evidence revision `2026-07-15.30`, all 50 canonical private E2E tool identities have exact server-derived job-adapter proof. FFmpeg's verified artifact contract now also includes the lossless private Matroska color intermediate proven by its separate exact color lifecycle and revision-isolated color-capable runtime identity; this does not change the 50-tool count. The catalog closes the adapter-evidence gap for the currently proven canonical set; it does not promote the remaining callable candidates or establish distributed-worker, external-beta, or production readiness.

Failure/retry evidence now additionally proves that a consumed DuckDB attempt can terminate as failed without `commitAuthorizedAt` or `completedAt`, exact adapter replay cannot execute the failed key again, and a fresh key executes the same approved operation as attempt two. This recovery proof does not change the 50 success identities or promote their readiness level.

Post-commit evidence additionally proves that completed D3 and DeepFilterNet executions can recover missing adapter completion records from exact immutable private evidence. The recovered records preserve the original artifact and DeepFilterNet cost hashes and issue no new claim, dispatch, execution, artifact, QA, reconciliation, or cost write.

## Boundaries

This adapter is not itself a whole-work-graph scheduler or terminal review assembler. It does not select the next dependency-ready job, recover a complete journey, execute providers, write Supabase, deploy workers, publish artifacts, settle customer credits, charge a wallet, bill a customer, or authorize production rendering. The private final MP4 is a QA-passed single-host test artifact, not a public export.

All responses keep product, external-beta, and production readiness false. A canonical work-graph orchestrator consumes this adapter, and a separate terminal assembly service proves the bounded five-job graph is ready only for private internal review.

## Verification

- `npm run typecheck:server`
- `npm run smoke:edit-planning-authority`
- `npm run smoke:canonical-private-tool-dispatch`
- `npm run smoke:proven-tool-identities`
