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

## Fixture-Bound Metadata Probe Layer

- Fixture-bound metadata probing is the first tool-calling surface that binds controlled execution to a generated synthetic fixture artifact.
- It runs only `ffprobe` read-only metadata probing against an internally generated synthetic WAV fixture.
- The synthetic WAV comes from the existing binary fixture generation provenance path; the probe regenerates the matching buffer in a private temp workspace and removes it before returning.
- Returned metadata is a sanitized summary only. Raw ffprobe JSON, local temp paths, filename fields, signed URLs, secrets, command strings, arbitrary args, and raw stdout/stderr are not returned.
- This layer does not use real media, probe video fixtures, transcode, mux, filter, execute safe command plans generally, dispatch workers, call providers, mutate Supabase, run SQL, create signed URLs, unlock beta or production, or mutate `package-lock.json`.

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

## Non-Goals

- No tool execution outside the explicit controlled readiness probe and fixture-bound metadata probe APIs.
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
