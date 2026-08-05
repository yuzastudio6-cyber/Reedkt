# Track All qualification and test evidence

## Qualification truth

Track All uses `skill-qualification-receipt-v2` inside a generated,
content-addressed `track_all_generated_qualification_artifact_v2`. The issuer
is `npm run qualify:track-all:internal`; runtime startup never synthesizes a
receipt. The generated artifact binds:

- the exact `track_all@1.0.0` manifest reference;
- tested Git commit and relevant source-tree hash;
- an ordered 26-authority set covering the shared assignment owner, generic
  kernel and route/dispatch registries, Track Graph V1/V2, strict artifacts,
  route-aware planning, work graph, canonical executor/coordinator, public
  support bridge, deterministic tools, B-Roll consumer, Visual Intelligence
  dependency, SAM V2 operation, official source/checkpoint/image authorities,
  and canonical-private public E2E;
- 33 actual command-run evidence records and 24 exact fixture evidence refs;
- build, typecheck, lint, frontend/server-boundary, security, public-plugin,
  media, geometry, privacy, focus/reframe, repair, SAM-gate, and retirement
  checks;
- ten route-level qualification records; and
- zero actual SAM requests, zero GPU executions, zero public artifacts, and
  zero production mutations.

Temporary media remains in ephemeral private directories and is deleted by
the fixture. Only digests, content hashes, timestamps, exit status, and bounded
summaries enter the generated artifact. No credential or raw log is stored.

## Honest route status

| Route | Current evidence status | Evidence boundary |
|---|---|---|
| planning core | `planning_qualified` | actual authority/planning/QA commands |
| deterministic geometry | `internal_execution_qualified` | actual private FFmpeg/FFprobe/OpenCV/PySceneDetect fixture |
| planar tracking | `internal_execution_qualified` | actual private homography fixture |
| existing-track repair | `internal_execution_qualified` | actual bounded repair fixture |
| privacy redaction | `internal_execution_qualified` | actual private FFmpeg treatment plus injected graph geometry |
| focus | `internal_execution_qualified` | actual private Remotion fixture with injected graph geometry |
| reframe | `internal_execution_qualified` | actual private Remotion fixture with injected graph geometry |
| public plugin lifecycle | `internal_execution_qualified` | actual generic runtime dispatch through the canonical-private coordinator and current B-Roll consumer |
| SAM 3.1 masklets | `blocked` | contracts/injected lifecycle only; no checkpoint or inference |
| production worker | `blocked` | no production worker/store/release evidence |

The top-level skill remains `planning_qualified` because it must not exceed
the blocked SAM route required by selected-target and concept-group execution.
It is not production-qualified.

## Fail-closed verification

The frozen Track All receipt is
`929eadb8d1bfe9f6be8969aa5e621c0d56babd9513dfb600a409e04a2c01978e`;
its artifact hash is
`f9adc5c482c14952a69c935178aee81788bfa76c6500c6b7ada92a6be4b2fa88`.
It binds manifest
`dcec1be579f9ff28a560ec1f37c01ca9afe0f874f9ac7e66894f8a8ea75b7061`,
tested source `411b3b597a4135142737fbca84e4120311924802`, relevant source-tree hash
`88f255b49d3aed48fe04e9547deaad0b52d72083be95fab187704bcd3c91b5b4`,
and ordered dependency-authority-set hash
`baa5720cf6e31949a4325e265e9d1320e7c26a350c9776f50c16a444067789a0`.

`npm run test:track-all-qualification-evidence` rejects failed commands,
missing or duplicate fixtures, wrong commit/source/manifest/shared authority,
forged hashes, reordered authority sets, SAM overclaim, and production
overclaim. `npm run test:track-all-retirement` rejects active SAM2/legacy
routes, caller-controlled execution surfaces, duplicate runtime ownership,
public-plugin private imports, and premature production bindings.
