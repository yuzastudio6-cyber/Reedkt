# Track All qualification and test evidence

## Qualification truth

Track All uses `skill-qualification-receipt-v2` inside a generated,
content-addressed `track_all_generated_qualification_artifact_v3`. The issuer
is `npm run qualify:track-all:internal`; runtime startup never synthesizes a
receipt. The generated artifact binds:

- the exact `track_all@1.0.0` manifest reference;
- tested Git commit and relevant source-tree hash;
- an ordered 33-authority set covering the shared assignment owner, generic
  kernel and route/dispatch registries, Track Graph V1/V2, strict artifacts,
  route-aware planning, work graph, execution accounting, composite and
  deterministic executors, SAM activation bridge, real-output graph adapter,
  canonical coordinator, public support bridge, deterministic tools, B-Roll
  consumer, Visual Intelligence dependency, SAM V2 operation, official
  source/checkpoint/image authorities, protocol wiring, gated canonical-private
  SAM E2E, and dedicated CI;
- 37 actual command-run evidence records and 26 exact fixture evidence refs;
- build, typecheck, lint, frontend/server-boundary, security, public-plugin,
  media, geometry, privacy, focus/reframe, repair, SAM-gate, and retirement
  checks;
- ten route-level qualification records;
- `protocolWiringComplete: true`,
  `samActivationRequiresNoFurtherCodeChange: true`, exact nullable real
  canary/E2E evidence, and exact route status/counts; and
- zero actual SAM requests, zero GPU executions, zero public artifacts, and
  zero production mutations in the current blocked evidence set.

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
`292c21e15e616fb8593fcaf311d98dd907b49bf59c056992061a6dad5cec33d4`;
its artifact hash is
`12a115686c649a730d19a64817327e85c231a01ce27aa169d609dddb563f444c`.
It binds manifest
`cfb670fa8255af9112592e5a87ae19e8bc5045b9d418af6452e2eca94c5a0d8b`,
tested source `a6e21b4825e3f8c90d10c1fa40147cf7222150d6`, relevant source-tree hash
`a51b91907dd38f1ebce2ad226ad962b7ffff87d35bf7855f44b1272d78bd92ab`,
and ordered dependency-authority-set hash
`d235c5171704f23d16bb6d3d1e75a5e1b5fa2f8c751b3da61ce2b23d274186e9`.
The exact final authority-binding hash is
`197afba7bd275aa7a06688ee894a482561d80c4d64d6c5574ce39a30e7fe5555`.

`npm run test:track-all-qualification-evidence` rejects failed commands,
missing or duplicate fixtures, wrong commit/source/manifest/shared authority,
forged hashes, reordered authority sets, forged SAM activation, protocol
evidence presented as real inference, SAM overclaim, and production overclaim.
`npm run test:track-all-retirement` rejects active SAM2/legacy
routes, caller-controlled execution surfaces, duplicate runtime ownership,
public-plugin private imports, and premature production bindings.
