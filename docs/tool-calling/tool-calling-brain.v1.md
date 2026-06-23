# Tool-Calling Brain v1

## Purpose

The Reeditpro tool-calling brain is a planning-first runtime foundation for choosing production tool candidates by operation, media context, user preference target, quality mode, resource profile, validators, fallback rules, and future telemetry. Normal planning outputs do not execute tools, process media, call providers, mutate Supabase, run SQL, create signed URLs, or unlock beta/production execution. The controlled low-risk readiness probe API is the only v1 tool execution surface.

## Runtime Boundary

- Source of tool metadata: `server/tool-registry`.
- Source of QA gates: `server/tool-registry/tool-qa-policy.ts`.
- Source of fallback chains: `server/tool-registry/tool-fallback-policy.ts`.
- Future execution target: `server/workers/production/production-worker-router.ts`.
- Output execution mode: `planning_only`.
- Raw prompts are not worker execution payloads and are not included in tool-calling plan output.

## Milestone 1 Boundary

- Milestone 1 is planning-only.
- Current capability cards are generated from existing `server/tool-registry` `ProductionToolProfile` records.
- Explicit per-tool study cards are deferred to `REEDITPRO-TOOL-CALLING-BRAIN-2`.
- Runtime ID reconciliation for installed or proven tools that are not yet first-class `ProductionToolId` entries is deferred to Milestone 2.
- Runtime tool selection must not use Track A, Track B, or owner labels.
- Runtime tool selection must use operation capability, input/output compatibility, ranking policy, quality gates, fallback rules, resource profile, and future telemetry.

## Milestone 2 Capability Cards

- Milestone 2 adds explicit per-tool capability study cards under `docs/tool-calling/studies`.
- Study cards enrich operation-level planning metadata and do not replace `server/tool-registry`.
- Runtime ID aliasing resolves proven tool labels to existing `ProductionToolId` entries when possible.
- Tools that are not first-class `ProductionToolId` entries remain pending production registry expansion.
- Pending external study cards can appear in diagnostics and reports, but not as pipeline `selectedToolId` values.

## Repo Refresh And Duplicate Prevention

- The tool-calling brain is an overlay on top of existing repo systems, not a replacement for the production registry, worker router, QA policy, fallback policy, runtime contracts, or Supabase table design.
- Future capabilities and adapters must reuse existing implementations when present.
- Pending external tools must be rechecked before each milestone because they may become first-class `ProductionToolId` entries later.
- Future milestones must run `npm run tool-calling:refresh-gate` before implementation.

## Unmerged Owner Evidence Overlay

- Future tool-calling milestones must check unmerged owner evidence after the refresh gate.
- Open and draft owner PRs are candidate evidence and duplicate-risk signals, not final source of truth.
- Merged owner PRs become source evidence only when included in the current base or explicitly referenced by branch evidence.
- The overlay prevents duplicating active owner work for install proof, runtime proof, Docker requirements, adapters, worker routes, Supabase/runtime tables, and capability metadata.
- Owner lanes remain evidence metadata and must not become runtime ranking dimensions.

## All-Owner Stack Coverage

- Tool-calling must reconcile all Reeditpro tool-stack lanes, not only launch/core media tools.
- Owner implementations are source evidence when merged, and open/draft owner work is candidate evidence plus duplicate-risk signal.
- The all-owner matrix identifies first-class tools, explicit studies, installed/proven owner evidence, blocked candidates, pending registry expansion, missing adapters/command intents/fixtures/probes, and surfaces that must not be duplicated.
- Owner labels and lanes are never runtime ranking dimensions; pending external tools must wait for first-class registry expansion before runtime selection.
- Future expansion milestones must run refresh-gate, unmerged-owner evidence, and all-owner stack reconciliation before adding tool-calling coverage.

## Sound/Music/Audio Owner Expansion

- Sound/Music/Audio and SFX/SoundSync coverage is reconciled against merged owner evidence before tool-calling adds study, registry, adapter, probe, or execution surfaces.
- PR #636 `SOUND-RUNTIME-MEDIA-GATE-0` is consumed as owner evidence for 65 SOUND candidate labels, 13 pinned requirements, 16 install-plan tools, and the current runtime/media/model/license gate status.
- First-class SOUND tools stay covered by the existing registry, study cards, and planning-only adapters; this expansion does not duplicate them.
- Owner-inventory, install-plan-only, provider/API-only, SFX/SoundSync, cue-manifest, model-weight, license-sensitive, and media-policy-sensitive surfaces remain non-selectable unless first-class registry and owner proof exists.
- Runtime/media/model/provenance/license gates must remain blocked until the SOUND owner lane clears them.

## Adapter Contract Layer

- Adapter contracts convert selected planning tools into structured adapter plans and future worker-route bridge metadata.
- Adapter contracts are planning-only; they do not execute tools, run shell commands, process media, or replace the worker router.
- Adapter plans are built only for selected first-class `ProductionToolId` values with adapter contracts.
- Pending external tools remain blocked from adapter plans until production registry expansion.
- Future execution must consume approved snapshots and private artifact references through the existing production worker router.

## Safe Command Plan Layer

- Safe command plans convert adapter plans into structured command intents, not shell commands.
- Safe command plans use allowlisted parameter schemas, artifact requirements, output artifact expectations, resource limits, sandbox profiles, and validation policy.
- Safe command plans reject raw prompts, signed URLs, service-role context, arbitrary args, local paths, shell strings, provider keys, and secret values.
- Safe command plans remain planning-only and are required before any future controlled synthetic fixture execution milestone.

## Synthetic Fixture Plan Layer

- Synthetic fixture plans convert safe command plans into tiny future fixture requirements for controlled dry-runs.
- Fixture plans are not generated files and do not execute tools, shell commands, workers, or media processing.
- Fixture plans use private artifact requirements, expected output artifacts, storage bucket purposes, QA gates, and safety limits.
- Existing fixture helpers under `server/media`, `server/e2e`, and `server/workers` remain execution or smoke-test surfaces and are not imported by this planning layer.

## Synthetic Fixture Dry Run Layer

- Synthetic fixture dry runs convert fixture plans into deterministic in-memory JSON descriptor payloads and artifact manifests.
- Dry runs do not write fixture files, generate binary media, execute tools, run shell commands, dispatch workers, process media, call providers, mutate Supabase, run SQL, create signed URLs, or unlock beta/production.
- Dry-run artifacts use stable JSON checksums, byte counts, artifact types, and storage bucket purposes instead of local paths or signed URLs.
- Existing dry-run and fixture helpers under `server/media`, `server/e2e`, and `server/workers` remain execution, smoke, or readiness surfaces and are not imported by this planner layer.

## Execution Path Decision Gate

- The execution path decision gate chooses whether the next milestone should generate deterministic binary fixtures or attempt controlled low-risk execution.
- The gate refreshes repo state, rebuilds the planning stack, scans existing helper surfaces, checks duplicate risks, and keeps the current tool-calling layers planning and dry-run only.
- In the current stack, JSON-only dry-run artifacts are not enough to justify controlled execution before approved fixture files exist.

## Binary Fixture Generation Layer

- Binary fixture generation converts synthetic fixture dry-run artifacts into deterministic temp JSON, WAV, and PNG files using Node standard-library code only.
- The runner writes files only under `os.tmpdir()` for checksum and byte-size validation, then removes the temp workspace before returning milestone results.
- Returned results contain artifact metadata only; they do not expose temp paths, output paths, signed URLs, HTTP URLs, shell commands, arbitrary args, service-role context, provider secrets, or real user media references.
- Synthetic video remains descriptor-only. MP4, MOV, WebM, stream, and container generation are deferred.
- Existing helper surfaces under `server/media`, `server/e2e`, `server/workers`, storage, routes, CLIs, and artifact writers are not imported by this layer.
- This milestone still does not execute tools, run shell commands, dispatch workers, process media, call providers, mutate Supabase, run SQL, create migrations, create signed URLs, unlock beta or production, or mutate `package-lock.json`.

## Controlled Low-Risk Execution Layer

- Controlled low-risk execution is the first actual tool execution surface in the tool-calling stack.
- It runs only allowlisted readiness probes: `ffmpeg -version`, `ffprobe -version`, and Node package metadata resolution for `remotion` and `sharp`.
- Binary probes use `execFile` with no shell, no stdin, exact hardcoded args, short timeouts, and sanitized diagnostics-only output.
- Package probes use module resolution only; they do not import runtime packages, render, or process images.
- Missing tools return structured `unavailable` results, while nonzero exits, timeouts, unsafe output, and policy mismatch fail closed.
- This layer still does not process media or fixtures, execute safe command plans, dispatch workers, call providers, mutate Supabase, run SQL, create signed URLs, unlock beta or production, or mutate `package-lock.json`.

## Track B External Controlled Probes

- Track B external controlled probes extend the controlled low-risk execution layer for `mediainfo`, `exiftool`, `tesseract`, and `imagemagick`.
- The probes are version/readiness checks only: `mediainfo --Version`, `exiftool -ver`, `tesseract --version`, `magick -version`, and legacy ImageMagick `convert -version`.
- They use `execFile` with no shell, no stdin, exact hardcoded args, max buffer `262144`, sanitized summaries, and fail-closed behavior.
- They do not inspect files, run OCR, transform images, use fixtures, process media, dispatch workers, call providers, mutate Supabase, run SQL, create signed URLs, unlock beta/production, or mutate `package-lock.json`.
- Bare `graphicsmagick` remains pending and is not probed.

## Fixture-Bound Metadata Probe Layer

- Fixture-bound metadata probing is the first tool-calling surface that binds controlled execution to a generated synthetic fixture artifact.
- It runs only `ffprobe` read-only metadata probing against an internally generated synthetic WAV fixture.
- The synthetic WAV comes from the existing binary fixture generation provenance path; the probe regenerates the matching buffer in a private temp workspace and removes it before returning.
- Returned metadata is a sanitized summary only. Raw ffprobe JSON, local temp paths, filename fields, signed URLs, secrets, command strings, arbitrary args, and raw stdout/stderr are not returned.
- This layer does not use real media, probe video fixtures, transcode, mux, filter, execute safe command plans generally, dispatch workers, call providers, mutate Supabase, run SQL, create signed URLs, unlock beta or production, or mutate `package-lock.json`.

## Fixture-Bound Export Validation Layer

- Fixture-bound export validation consumes only the sanitized synthetic WAV metadata summary returned by the fixture-bound metadata probe.
- The source metadata probe may execute `ffprobe`; export validation itself performs no tool execution and returns `executesTools: false`.
- The layer emits QA summaries for `export_codec_format`, `export_duration_sync`, and `render_asset_integrity`.
- `final_delivery` is emitted as an optional skipped gate and is never passed in this milestone.
- Existing export, QA, ffprobe, worker, CLI, production-readiness, and final-render helpers remain scan evidence only and are not imported by this layer.
- This layer does not use real media, probe video fixtures, transcode, mux, filter, render, dispatch workers, call providers, mutate Supabase, run SQL, create signed URLs, unlock beta or production, or mutate `package-lock.json`.

## First-Class Full-Stack Tool Coverage

- Tool-calling now targets all current first-class `ProductionToolId` values, not only launch-core media tools.
- Every first-class registry tool has an explicit study card and a planning-only adapter contract generated from the existing `server/tool-registry` profile plus repo-local source evidence where present.
- Execution remains gated separately by controlled probe and fixture-bound milestones; study cards and adapter contracts do not prove installation or execution readiness.
- Owner evidence remains the source of truth for execution readiness, model-weight governance, license review, and worker-route enablement.
- Track B external registry expansion promotes `mediainfo`, `exiftool`, `tesseract`, and `imagemagick` into first-class planning metadata while keeping execution gated separately.
- `graphicsmagick` remains pending and non-selectable as a separate runtime identity; diagnostics report `graphicsMagickCounted: false`.

## Sound Candidate-Only Study Cards

- Sound candidate-only study cards are awareness metadata for Sound/Music/Audio and SFX/SoundSync candidates from PR #641 / PR #636 evidence.
- They are stored separately from first-class study cards and do not participate in runtime selection, ranking, adapter contracts, command intents, fixtures, probes, or execution.
- Runtime selection still requires a first-class `ProductionToolId`; SOUND owner gates remain the source of truth for install, model, license, media, provider, and worker readiness.

## Sound Runtime Gate 1 Reconciliation

- Sound Runtime Gate 1 reconciliation consumes merged PR #640 evidence as planning metadata only.
- It records the 13 direct pinned packages, 2 alias-covered tools, and planning-only sound worker/job surfaces without enabling runtime execution.
- Package/install proof remains owner-lane gated by `SOUND-RUNTIME-MEDIA-GATE-1A`; worker contract review remains gated by `SOUND-RUNTIME-MEDIA-GATE-1B`.
- Tool-calling can reason about Gate 1 candidates, but it must not select or execute candidate-only tools.

## Sound Gate 1A Merged Reconciliation

- Sound Gate 1A merged reconciliation records PR #647 / `SOUND-RUNTIME-MEDIA-GATE-1A` as merged owner source evidence using merge commit `0126327c19f1af18bb1ca040c31d06736693d1b6`.
- The layer records controlled CPU install proof facts for planning only: 13 metadata checks passed, 14 import checks passed including `scipy.signal`, failed imports `[]`, `python3` observed as `3.13.13`, and temporary venv cleanup.
- It does not run imports, install packages, add probes, promote runtime IDs, add adapters, add command intents, process media/audio, or dispatch workers.
- Gate 1B worker contract review, Gate 2 model/provenance review, and Gate 3 media-policy handoff remain required before downstream expansion.

## Sound Gate 1B Merged Reconciliation

- Sound Gate 1B merged reconciliation records PR #653 / `SOUND-RUNTIME-MEDIA-GATE-1B` as merged owner source evidence using merge commit `5bc262db23f6f6a4c9ab7b03f9b239536c6a0f91`.
- The layer recognizes `sound-cpu-analysis-worker`, `sound-audio-metadata-worker`, and four `sound.*` job types as planning metadata only.
- It does not dispatch workers, call the worker router, create jobs, run imports, execute tools, add worker-route dry-runs, add adapters, add commands, add probes, process media/audio, or mutate Supabase.
- Gate 1C and Gate 1D remain required before CPU worker image planning or worker runtime handoff can be consumed.

## Sound Gate 1C Merged Reconciliation

- Sound Gate 1C merged reconciliation records PR #660 / `SOUND-RUNTIME-MEDIA-GATE-1C` as merged owner source evidence using merge commit `b46509a54695dd049d044fd7135b37a8faaef18e`.
- The layer records planned CPU worker image names, preserved worker names, preserved planning-only job types, Gate 1C image-plan documentation surfaces, blocked gates, and Gate 1D/Gate 1E next prompts.
- It does not add Dockerfiles, build images, call Docker/GCP/Cloud Run, dispatch workers, call routes, create jobs, run imports, execute tools, add worker-route dry-runs, add adapters, add commands, add probes, process media/audio, mutate Supabase/SQL, or mutate `package-lock.json`.

## Sound Gate 1D Merged Reconciliation

- Sound Gate 1D merged reconciliation records PR #663 / `SOUND-RUNTIME-MEDIA-GATE-1D` as merged owner source evidence using merge commit `dbb6d7fe56e7a710059fd80385f11e6fe186f5e0`.
- The layer records the `WORKER_RUNTIME_JOBS` handoff packet, dependency map, job contract register, blocker register, owner acceptance request, runtime claim policy, accepted planning terms, blocked gates, and next prompts.
- It does not dispatch workers, call the worker router, create jobs, claim or lease worker runtime, run imports, execute tools, add worker-route dry-runs, add adapters, add commands, add probes, process media/audio, touch Docker/GCP/Cloud Run/Secret Manager, mutate Supabase/SQL, or mutate `package-lock.json`.

## Track B External Registry Planning Expansion

- Track B external registry expansion adds first-class `ProductionToolId` coverage for `mediainfo`, `exiftool`, `tesseract`, and `imagemagick`.
- The new profiles are `future` status and `planning_only`; they are not launch-core and do not unlock production execution.
- Their explicit study cards include owner/source evidence and operation metadata, and adapter contracts are generated from the existing registry and capability-card layers.
- `imagemagick_graphicsmagick` resolves to `imagemagick`, while bare `graphicsmagick` remains pending and non-selectable until separately proven.
- This milestone adds no controlled probes, media execution, safe-command execution, worker dispatch, Supabase tables, SQL, migrations, signed URLs, beta/prod unlocks, or package-lock changes.

## Planning Flow

1. Resolve an operation list from a requested pattern and any explicitly requested operations.
2. Build expanded capability cards from explicit study cards plus existing production tool profiles.
3. Find multiple tool candidates for each operation from supported actions, artifact compatibility, and seeded operation mappings.
4. Rank candidates deterministically with capability, artifact, quality, reliability, speed, resource, validation, fallback, and preference dimensions.
5. Compose a planning-only pipeline step with selected tool, ranked candidates, fallback IDs, expected artifacts, quality gates, and worker type when inferable.
6. Build a pipeline fallback plan and quality gate plan from existing policies.
7. When requested, build adapter plans and worker-route bridge metadata from the selected planning-only pipeline.
8. When requested, build safe command plans and validate the command-intent boundary without executing tools.
9. When requested, build synthetic fixture plans and validate future-only fixture requirements without generating artifacts.
10. When requested, materialize synthetic fixture dry-run descriptors and validate JSON-only artifact manifests without writing files or generating media.
11. Before choosing an execution milestone, run the execution path decision gate and follow its recommendation.
12. When requested, generate temporary Node-only binary fixtures from dry-run artifacts, validate checksums and cleanup, and return metadata without path exposure.
13. When requested, run controlled low-risk readiness probes and return sanitized fail-closed diagnostics with `executesTools: true` and `mediaProcessingPerformed: false`.
14. When requested, run the fixture-bound metadata probe against generated synthetic WAV only and return sanitized fail-closed metadata diagnostics with `executesTools: true` and `fixtureInputUsed: true`.
15. When requested, run fixture-bound export validation over sanitized synthetic WAV metadata and return QA gate summaries with `executesTools: false` and `sourceProbeExecutesTools: true`.

## Non-Goals

- No tool execution outside the explicit controlled readiness probe and fixture-bound metadata probe APIs.
- No export-validation tool execution.
- No worker dispatch.
- No media processing.
- No provider/model calls.
- No Supabase mutation or SQL.
- No migration or schema creation.
- No package-lock mutation.
- No runtime routing based on implementation coordination labels.
- No binary video generation.
- No committed generated fixture artifacts.

## Expansion Points

- Capability cards can gain measured benchmark and telemetry fields without changing the planner interface.
- Operation definitions can add future operations with `futureAllowed: true`.
- Future worker dispatch should consume approved plan snapshots and storage artifact references, not raw chat text.
