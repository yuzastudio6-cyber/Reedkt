# Lyria Pro Worker Plan

## Purpose

The Lyria worker skeleton models the future backend path for SoundSync music generation without calling Lyria, Google APIs, Supabase, or storage. It exists so ReeditPro can keep the product rules clear before real generation is added:

- the music cue must exist
- the Lyria prompt plan must exist
- the generation request must be approved or queued
- music credits must be approved and reserved
- the worker must run through Music QA and mix planning before preview use

## Current Mock Behavior

`runLyriaWorkerSkeleton` is deterministic and local. It validates the worker input, loads mock records, simulates a Lyria Pro provider response, creates a mock generated music track, creates a mock project asset, runs mock track analysis, runs Music QA, creates a mix plan, and records lifecycle events.

It never creates an audio file. It never calls a network API. It returns `mock://` storage paths only.

## Input Contract

`LyriaWorkerInput` includes:

- job ID and optional batch ID
- workspace, project, and edit plan IDs
- music cue and cue sheet IDs
- Lyria prompt plan ID
- generation request ID
- credit reservation ID
- `mockOnly: true`

The explicit `mockOnly` field is required so this skeleton cannot be confused with real generation code.

## Output Contract

`LyriaWorkerOutput` reports:

- generation request ID
- generated music track ID
- generated asset ID
- optional analysis, QA, and mix plan IDs
- status: `mock_generated`, `blocked`, or `failed`
- user-safe message
- warnings

The full run result can also include generated records, provider response summary, lifecycle events, and any validation failure.

## Validation Gates

The worker blocks or fails when:

- job ID is missing
- prompt plan ID is missing
- music cue ID is missing
- generation request ID is missing
- credit reservation ID is missing
- credits are not reserved
- generation request is not approved or queued
- prompt validation conflicts with the cue
- lyrics are allowed in a speech-safe or dialogue cue

Credit reservation is checked before the mock provider response is created.

## Mock Generated Track

The worker creates a `GeneratedMusicTrackRecord` from the cue and prompt plan:

- cue role and section type come from the approved cue
- energy, mood, and genre hints come from the cue
- vocal behavior comes from the Lyria prompt plan
- dialogue cues default to low-bass, voice-safe generated tracks
- provenance starts as `mock_generated`
- reuse starts as `project_only`

Generated music is a project asset first. Library promotion requires separate QA and terms review.

## Mock Generated Asset

The generated asset is a `GeneratedAssetRecord` with:

- `assetType: "music"`
- `assetFormat: "wav"`
- `storageProvider: "local_mock"`
- `storagePath: "mock://generated-audio/{projectId}/{cueId}.wav"`
- `transparentBackground: false`
- `usableForRender: true`

No file is written to disk.

## Music QA And Mix Plan

After mock generation, the worker uses the existing mock SoundSync services:

- `analyzeGeneratedMusicTrack`
- `createMusicQAReport`
- `createMusicMixPlan`

If QA fails, the worker returns `failed` even though a mock generated track record exists. That models the future rule: generated music is not automatically approved for preview or export.

## Worker Events

The worker emits mock events for:

- reading the approved music cue
- loading the Lyria prompt plan
- checking credit reservation
- preparing the mock request
- simulating Lyria Pro generation
- creating the generated track and asset
- running Music QA
- preparing the mix plan
- completed, failed, or blocked status

These events are local records only and do not enqueue real infrastructure.

## Failure Modes

`blocked` is used when the product gate prevents generation, especially missing or unreserved credits and prompt/cue policy conflicts.

`failed` is used when required records are missing or the generated mock output fails Music QA before preview.

## Future Real Integration

The future worker should replace only the provider simulation layer. The validation gates, credit reservation requirement, generated asset record shape, QA step, mix plan step, and event model should remain.

Real integration must add secure backend-only secret access, real storage writes, robust retries, idempotency, refund paths, and observability.

## Mock-Only Limitations

- no Lyria API call
- no Google SDK
- no cloud deployment
- no Supabase connection
- no real audio file
- no real credit spend
- no render/export integration
