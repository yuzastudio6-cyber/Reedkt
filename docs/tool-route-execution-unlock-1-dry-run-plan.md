# TOOL-ROUTE-EXECUTION-UNLOCK-1 Dry-Run Plan

## Decision

Decision: `tool_route_dry_run_plan_ready_with_warnings`.

This packet plans tool-route dry-run contracts and synthetic case coverage only. It accepts the merged PR #369 repo-audit evidence, the merged PR #360 pending-owner tool studies, and the current worker/model/product/Supabase metadata chain as source-of-truth context. It does not execute tools, routes, workers, providers, media, browser capture, maps, Docker, Cloud, Supabase, SQL, storage, signed URLs, public artifacts, credits, beta, or production paths.

Next prompt: `TOOL-ROUTE-EXECUTION-UNLOCK-2: tool-route execution dry-run contract, no execution`.

## Source-Of-Truth

- Base branch: `codex/rp-model-orchestration-plan-snapshot-dry-run-validation`
- Base commit: `c84df541f9259e61b719aab967b22343a42a221f`
- Implementation branch: `codex/tool-route-execution-unlock-1-dry-run-plan`
- PR #369 merge evidence: accepted as the route execution unlock repo audit.
- PR #360 tool-study evidence: accepted for AI creative graphics, Track A render/export, Track B media processing, and Sound/music/audio.
- Completed owner evidence for Web search/capture and Map/geospatial is referenced only; no replacement studies are created.

## Synthetic Case Matrix

The plan defines 18 synthetic cases for future dry-run contract work:

| Group | Cases | Outcome |
|---|---:|---|
| Intent-to-capability routing | 7 | Metadata candidate selection only |
| Multi-tool handoffs | 3 | Metadata handoff planning only |
| Blocked fail-closed cases | 8 | Rejected before execution |

The blocked cases cover raw prompt source input, signed URL source-of-truth, public artifact output, direct tool runtime, direct route runtime, provider runtime, worker runtime, and Supabase mutation.

## Contract Plan

Future UNLOCK-2 contract fixtures must include approved snapshot refs, structured findings refs, edit intent refs, candidate capabilities/tools/routes, scoring policy refs, blocked decisions/actions, owner handoffs, source-of-truth requirements, artifact/signing policy, idempotency and correlation identifiers, audit/cost refs, billing placeholders, and validation evidence refs.

Source-of-truth remains a Supabase row reference, private GCS path reference, manifest reference, checksum reference, and approved plan snapshot reference. This phase creates only synthetic placeholder references and no real resources.

## Runtime Gates

All runtime gates remain closed: tool execution, route execution, workers, job dispatch/claim/lease, providers, raw prompts, Supabase writes, SQL, migrations, media, browser capture, map execution, signed URLs, public artifacts, Docker, Cloud Run, Cloud Build, credit or Stripe mutation, beta, production, Demucs, Track A runtime, Track B runtime, and generated local fixture pass claims.

## Warnings

- Future dry-run fixture contracts are deferred to TOOL-ROUTE-EXECUTION-UNLOCK-2.
- Route and tool execution remain blocked until worker, route, provider, Supabase, artifact, billing, and observability owners approve later gates.
- Track B route metadata is accepted as source evidence, but Track B media processing execution remains blocked.

## Validation

The acceptance gate for this packet is the built-ins diagnostic plus report and summary commands. Broader repository validation may still report inherited production or external beta readiness blockers; those do not enable runtime execution.
