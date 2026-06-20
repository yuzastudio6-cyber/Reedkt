# Tool-Calling Brain Repo Integration Audit

## Target Repo

- Implementation target: `/Users/macuser/Developer/REeditpro`.
- Starting branch candidate: `codex/sound-music-audio-1abc-checkpoint`.
- New implementation branch: `codex/reeditpro-tool-calling-brain-1`.
- Milestone 2 stacked branch: `codex/reeditpro-tool-calling-brain-2-capability-cards`.
- The light shell at `/Users/macuser/Documents/Frontend` is not the implementation target.

## Existing Systems Reused

- Production tool metadata is reused from `server/tool-registry/index.ts`, `production-tool-types.ts`, and `production-tool-profiles.ts`.
- QA planning reuses `server/tool-registry/tool-qa-policy.ts`.
- Fallback planning reuses `server/tool-registry/tool-fallback-policy.ts`.
- Artifact and quality gate types reuse `src/backend/contracts/production-tool-runtime-contracts.ts` where applicable.
- Future execution remains targeted at `server/workers/production/production-worker-router.ts`.

## Milestone 2 Capability Card Expansion

- Explicit study cards now add per-tool operation metadata for the installed and proven Reeditpro stack.
- Study cards enrich generated `ProductionToolProfile` capability cards; they do not replace `server/tool-registry`.
- First-class `ProductionToolId` entries remain the only selectable runtime IDs for pipeline `selectedToolId`.
- Pending external cards are included only in diagnostics, reconciliation reports, and future expansion notes.

## Duplicate Systems Not Created

- No second production tool registry.
- No second worker router.
- No duplicate QA policy.
- No duplicate fallback policy.
- No duplicate `tool_execution_plans`, `tool_runs`, `tool_artifacts`, `quality_gate_results`, or `fallback_decisions`.
- No migration or SQL file for this milestone.

## Runtime Registry Expansion Still Deferred

- MediaInfo, ExifTool, Tesseract, and ImageMagick/GraphicsMagick remain pending production registry expansion on this base.
- Pending external tools need first-class `ProductionToolId` profiles before runtime selection.
- Pending external aliases are documented in `docs/tool-calling/runtime-id-reconciliation-report.md`.

## Mandatory Refresh Gate Before Future Milestones

- Every future tool-calling milestone must start with `npm run tool-calling:refresh-gate`.
- When network refresh is safe, rerun with `REEDITPRO_REFRESH_GATE_ALLOW_FETCH=1 npm run tool-calling:refresh-gate`.
- The gate checks for stale stack state, duplicate study cards, duplicate aliases, duplicate local registry/router/QA/fallback systems, package-lock staging risk, and pending external tools that became first-class runtime IDs.
- Future work must reuse existing registry, router, QA, fallback, runtime contract, and Supabase table systems instead of creating parallel implementations.

## Adapter Contract Integration

- Adapter contracts reuse `server/tool-registry` profiles, existing capability cards, QA policy, fallback policy, and runtime contract types.
- The adapter registry is a planning catalog for selected first-class tools, not a second production tool registry.
- The worker route bridge emits metadata for future handoff to the existing production worker router; it does not import or call the router.
- Existing execution adapters under `server/workers/**` remain future execution surfaces and are not duplicated by this milestone.
- Pending external tools are reported as pending adapter contracts until they become first-class `ProductionToolId` entries.

## Safe Command Plan Integration

- Safe command plans reuse adapter plans, production registry tool IDs, QA gates, fallback IDs, runtime artifact types, and production storage bucket purposes.
- Safe command plans are structured command intents; they are not command builders, shell strings, worker jobs, execution-plan tables, or router replacements.
- Existing command-plan builders under `server/workers/**`, `server/activation/**`, and `server/cli/**` are not imported by the safe command-plan layer because those surfaces contain execution/readiness command fields.
- Pending external tools remain excluded from safe command plans until production registry expansion.

## Synthetic Fixture Plan Integration

- Synthetic fixture plans reuse safe command plans, adapter plans, production registry IDs, runtime artifact types, storage bucket purposes, QA gates, and the existing worker-router boundary.
- Fixture plans are future-only requirements; they are not generated files, command runners, worker jobs, fixture execution tables, or router replacements.
- Existing fixture helpers under `server/media`, `server/e2e`, and `server/workers` are smoke or execution helpers and are not imported by the synthetic fixture planning layer.
- Future fixture dry-runs must remain a separate controlled milestone with approved snapshots and private artifact references.

## Synthetic Fixture Dry Run Integration

- Synthetic fixture dry runs reuse synthetic fixture plans, safe command plans, adapter plans, production registry IDs, runtime artifact types, storage bucket purposes, QA gates, and the existing worker-router boundary.
- Dry runs are JSON-only in-memory materializations; they are not binary fixture generators, local file writers, command runners, worker jobs, fixture execution tables, or router replacements.
- Existing fixture and dry-run helpers under `server/media`, `server/e2e`, and `server/workers` remain execution, smoke, and readiness helpers and are not imported by the synthetic fixture dry-run layer.
- Any future binary fixture generation or low-risk execution milestone must stay separately gated and must reuse existing production worker safety systems.

## Execution Path Decision Integration

- The execution path decision gate reuses the refresh gate, current tool-calling planners, dry-run materializer output, registry IDs, pending external reconciliation, and existing repo helper scan evidence.
- The decision gate does not add binary fixture generation, low-risk execution, worker routes, command runners, adapter execution, Supabase runtime tables, migrations, SQL, or signed URLs.
- Existing helpers under `server/media`, `server/e2e`, `server/workers`, worker routes, migration drafts, and runtime SQL tests are classified as reuse, defer, or avoid-duplicating evidence.
- The current recommendation is binary fixture generation before controlled low-risk tool execution.

## Binary Fixture Generation Integration

- Binary fixture generation reuses the existing synthetic fixture dry-run output, production registry IDs, runtime artifact types, storage bucket purposes, QA gate context, and existing worker-router boundary.
- The layer uses Node standard-library code only and does not import execution helpers, worker routes, storage clients, artifact writers, provider code, Supabase code, FFmpeg wrappers, ImageMagick wrappers, Python wrappers, OpenCV wrappers, PyAV wrappers, or PySceneDetect wrappers.
- Generated JSON, WAV, and PNG files are temporary diagnostic artifacts written under `os.tmpdir()` for checksum validation and cleaned up before returning.
- Synthetic video remains descriptor-only and does not produce MP4, MOV, WebM, stream, or container bytes.
- The layer does not create a duplicate binary fixture catalog, production registry, worker router, QA policy, fallback policy, adapter execution layer, command execution layer, fixture planner, Supabase runtime table, migration, SQL file, storage writer, or artifact writer.
- Existing helpers under `server/media`, `server/e2e`, `server/workers`, storage, routes, CLIs, migration drafts, and runtime SQL tests remain evidence or future integration references only.

## Controlled Low-Risk Execution Integration

- Controlled low-risk execution reuses first-class `ProductionToolId` values, pending external reconciliation, and the existing refresh gate.
- The layer executes only diagnostics-only readiness probes for `ffmpeg`, `ffprobe`, `remotion`, and `sharp`; it does not execute safe command plans, process media, inspect fixtures, dispatch workers, or call provider/runtime systems.
- Existing helpers under `server/workers`, `server/media`, `server/e2e`, production-readiness modules, worker routes, CLIs, migration drafts, and runtime SQL tests remain scan evidence only and are not imported.
- The layer does not create a duplicate worker router, execution adapter, command policy, readiness worker, production registry, QA policy, fallback policy, Supabase runtime table, migration, SQL file, storage writer, or artifact writer.
- Probe output is sanitized and diagnostics-only; no local paths, signed URLs, raw prompts, service-role context, provider secrets, shell commands, or arbitrary args are returned.

## Safety Confirmation

- Normal tool-calling plans produce planning-only output with `executesTools: false`.
- Controlled low-risk readiness probes return `executesTools: true` and `mediaProcessingPerformed: false`.
- Pipeline steps use `executionMode: planning_only`.
- The diagnostics do not process media, call providers, create signed URLs, mutate Supabase, run SQL, or dispatch workers.
- `package-lock.json` is intentionally not modified by this milestone.
