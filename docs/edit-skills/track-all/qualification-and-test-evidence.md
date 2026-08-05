# Track All qualification and test evidence

## Qualification truth

Track All uses `skill-qualification-receipt-v2` inside a generated,
content-addressed `track_all_generated_qualification_artifact_v1`. The issuer
is `npm run qualify:track-all:internal`; runtime startup never synthesizes a
receipt. The generated artifact binds:

- the exact `track_all@1.0.0` manifest reference;
- tested Git commit and relevant source-tree hash;
- an ordered 14-authority set covering the generic kernel, Track Graph V1/V2,
  artifact/work-graph/QA contracts, deterministic media/geometry, Visual
  Intelligence dependency, SAM V2 operation, official source/checkpoint, and
  runtime-image authorities;
- 25 actual command-run evidence records and 21 exact fixture evidence refs;
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
| public plugin lifecycle | `internal_execution_qualified` | actual generic runtime dispatch against fixture adapters |
| SAM 3.1 masklets | `blocked` | contracts/injected lifecycle only; no checkpoint or inference |
| production worker | `blocked` | no production worker/store/release evidence |

The top-level skill remains `planning_qualified` because it must not exceed
the blocked SAM route required by selected-target and concept-group execution.
It is not production-qualified.

## Fail-closed verification

`npm run test:track-all-qualification-evidence` rejects failed commands,
missing or duplicate fixtures, wrong commit/source/manifest/shared authority,
forged hashes, reordered authority sets, SAM overclaim, and production
overclaim. `npm run test:track-all-retirement` rejects active SAM2/legacy
routes, caller-controlled execution surfaces, duplicate runtime ownership,
public-plugin private imports, and premature production bindings.
