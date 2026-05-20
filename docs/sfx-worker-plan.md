# SFX Worker Plan

## Purpose

RP-SFX-11 adds a mock-only worker skeleton for SoundSync SFX Director. It models the future backend path for approved SFX generation without calling Mirelo, MMAudio, Supabase, Google Cloud, storage, renderers, or real audio processors.

The worker shows how an approved SFX event moves from plan and credit gates into mock provider output, trim/hit alignment, mix planning, QA, project usage, and generated-library growth.

## Worker Input

The worker receives a `SFXWorkerInput` with job, workspace, project, edit plan, event plan, provider route, prompt plan, generation request, and credit reservation IDs. `mockOnly` must be `true`.

The mock run also receives a local record bundle. This keeps RP-SFX-11 deterministic and avoids real database reads.

## Validation Gates

The worker blocks before provider simulation unless all of these are present and valid:

- SFX event plan
- SFX provider route
- SFX prompt plan
- approved edit plan
- approved credit estimate
- approved credit approval
- reserved credit reservation
- approved or queued generation request
- worker job
- mock-only runtime

It also blocks `avoid`, `not_needed`, `no_sfx`, source-footage repair without explicit approval, critical prompt warnings, and generated-duration requests shorter than the needed duration unless an approved internal-library match is used.

## Provider Routing

Routing is mock-only:

- `Mirelo SFX V1.5` simulates a future production SFX provider.
- `MMAudio V` simulates a future draft/basic/pro fallback and video-conditioned helper.
- `ReeditPro Internal Library` simulates an approved reusable library match.
- `No SFX` blocks generation because no SFX is a valid professional choice.

If a scenario marks the primary provider unavailable and the route allows MMAudio fallback, the worker switches to the MMAudio mock runtime.

RP-SFX-12 routes worker generation through the mock-first SFX provider adapter. The worker still enforces approval and credit gates first, then builds a normalized provider request, calls the adapter in mock mode, and converts the adapter response back into worker metadata for trim, mix, QA, and library-growth planning.

## RP-FIX-14 Project Flow

Project editing can now call the SFX worker skeleton through `edit-project-sfx-orchestrator.ts` after the edit plan, credit estimate, and reservation gates pass. Worker outputs are collected back into project asset, timing, mix, QA, and library-candidate status for chat-native editor display.

This is still mock-only. No real job is queued outside local memory, and no provider, storage, audio processing, Supabase, Cloud Run, Stripe, or render execution occurs.

## Mock Runtime

The runtime returns provider response metadata with:

- `mock://generated-sfx/...` storage paths
- `mockAudioBytes: null`
- generated duration
- model name
- waveform hints
- `mockOnly: true`

No audio bytes are created. No network request is made.

## Generated Asset Records

Successful runs create mock `GeneratedAssetRecord` and `SFXGeneratedAssetRecord` metadata. These records are project assets only until QA and library-growth logic decide otherwise.

Internal-library matches skip provider generation and mark the generated SFX metadata as library-origin.

## Trim, Timing, Mix, And QA

After mock output metadata exists, the worker calls the existing mock SFX services:

1. waveform analysis
2. transient detection
3. trim planning
4. hit alignment
5. mix planning
6. QA scoring/reporting

QA failures return worker status `failed` and do not approve the SFX for preview/export.

## Usage And Library Growth

If QA passes or warns, the worker runs generated-library growth logic. That creates mock usage, provenance, reuse, candidate, and learning metadata when appropriate.

Generated SFX starts project-only. Library candidacy still requires QA, reusable context, and provenance review.

## Events

The worker returns in-memory events for:

- started
- progress
- blocked
- failed
- completed
- library match

Events are not persisted in RP-SFX-11 unless a future backend milestone connects them to job status tables.

## Failure Modes

Blocked failures include missing job records, unapproved edit plans, unreserved credits, missing generation requests, `avoid` decisions, `not_needed` decisions, `no_sfx` routes, source-footage policy conflicts, and blocking prompt warnings.

QA failures happen after mock generation metadata but before preview-ready approval.

## Mock-Only Limits

RP-SFX-11 does not call providers, load secrets, create files, upload media, run audio analysis, spend credits, refund credits, deploy Cloud Run, connect to Supabase, or render previews.

The next milestone can prepare real provider integration only after backend worker security, Secret Manager, storage, retry, cost, and QA paths are approved.
