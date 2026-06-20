# Synthetic Fixture Dry Run v1

## Purpose

Synthetic fixture dry runs materialize the fixture-plan requirements into deterministic JSON descriptor payloads and artifact manifests. They are in-memory planning artifacts only. They do not write fixture files, generate binary media, run tools, run shell commands, dispatch workers, process media, call providers, mutate Supabase, run SQL, create migrations, create signed URLs, unlock beta or production, or mutate `package-lock.json`.

This layer sits after synthetic fixture planning. Fixture plans describe future tiny fixture requirements; dry runs prove that those requirements can become private artifact manifests without touching real user media or execution systems.

## JSON-Only Boundary

- Every dry-run result is a JSON object returned by the planner.
- Every dry-run artifact carries structured `payloadJson`, a SHA-256 checksum of stable sorted JSON, and a UTF-8 byte length.
- Synthetic video, audio, image, and mask fixtures emit descriptors only. No pixels, samples, streams, containers, or files are generated.
- Timeline, transcript, caption segment, render manifest, and final delivery fixtures emit tiny deterministic JSON payloads.
- Artifact metadata uses artifact types and `ProductionStorageBucketPurpose` values. It never emits local paths, output paths, signed URLs, HTTP URLs, command strings, arbitrary args, service-role context, provider keys, or raw prompts.

## Existing Fixture Surface Boundary

Existing fixture and dry-run helpers under `server/media`, `server/e2e`, and `server/workers` are execution, smoke, or readiness surfaces. They may generate files, model workflow execution, or support worker-level tests. This planning layer does not import them, does not duplicate them, and does not replace them.

The dry-run materializer consumes only `SyntheticFixturePlan` objects from `server/tool-calling` and produces descriptor JSON. It reuses the existing registry, capability, adapter, safe command, fixture-plan, QA, fallback, runtime contract, and worker-router boundaries.

## Safety Flags

Every dry-run artifact sets:

- `privateByDefault: true`
- `sourceOfTruth: true`
- `signedUrlAllowed: false`
- `localPathAllowed: false`
- `binaryMediaGenerated: false`
- `toolExecutionPerformed: false`
- `mediaProcessingPerformed: false`
- `workerExecutionPerformed: false`

Every dry-run result sets:

- `generatedJsonOnly: true`
- `fixtureGenerationPerformed: true`
- all execution and mutation flags to `false`
- `executesTools: false`

In this context, `fixtureGenerationPerformed` means the in-memory JSON descriptor materialization occurred. It does not mean binary media, local files, or private storage objects were created.

## Next Milestone Choices

The next decision is whether to add a binary fixture generation milestone or stay with lower-risk execution-readiness planning. Any future binary fixture milestone must be separately gated, must use only tiny synthetic media, must require approved snapshots and private artifact references, and must route through existing production worker safety systems instead of adding duplicate execution paths.
