# ADR-0001: Canonical Music v2 Versioning and Boundaries

Status: accepted

Date: 2026-08-04

## Decision

The final closure is published as canonical Music skill `2.0.0` with contract `music.skill_contract.v2`.

All materially changed Music request, result, artifact, execution-graph, route, tool-operation, operation-profile, rate-card, estimator, attempt-policy, QA-policy, and handoff identities receive new v2 identities. Published v1 identities are not mutated in place. The active shared registry exposes v2; one planning-only compatibility adapter may translate legacy callers into explicit v2 constraints but cannot execute providers, Sound, media handlers, or final handoff creation.

## Why a major version is required

Music v1 makes caller-proposed cues the primary creative input. Music v2 makes resolved, hash-bound project context authoritative and treats caller cues only as optional locked constraints. Music v2 also changes route execution from broad unit dispatch to exact route-step handlers, changes idempotency from key-only replay to fingerprint-bound replay, and strengthens rights, Sound delegation, QA, and revision contracts. These are semantic contract changes and cannot be published honestly under immutable v1 identities.

## Shared-kernel decision

Music continues to use the neutral shared edit-skill kernel under `server/edit-skills/core`. No Music-specific generic kernel and no Sound-created or Music-created Head-of-Orchestra facade will be introduced.

## Sound boundary decision

Music continues to call canonical Sound v4 only through its public service port. Music does not import FFmpeg, the Sound route executor, Sound operation handlers, provider adapters, private paths, or credentials.

Where the current Sound public request cannot represent an approved Music technical directive losslessly, the implementation will add the smallest backwards-compatible, versioned public technical-directive extension. Existing Sound v4 callers and route behavior remain valid. Any changed Sound tool-operation or operation-profile semantics receive a new immutable identity; Sound v4 acceptance must remain green.

## Context and authority decision

The request carries immutable references and exact read/write authority. A server-owned context resolver verifies versions and hashes and returns a canonical context package. Whole-video context may be read when authorized, but actual Music and delegated Sound mutation ranges must remain subsets of exact Music write ranges.

## Provider decision

Provider choice, profile, transport, credentials, retries, and reconciliation remain server-owned. The injected Lyria path must use real private fixture audio bytes through the canonical graph. Live Lyria remains fail-closed without external activation evidence and is never upgraded from fixture qualification by documentation or metadata alone.

## Persistence decision

No database migration is required for this standalone closure. Immutable private artifacts, receipts, and hashes provide execution evidence. Global work graph, approval aggregation, queueing, and persistence remain future Orchestra responsibilities.

## Consequences

- Music v2 can be called directly without the future Orchestra.
- The future Orchestra needs only the Music manifest and public Music service.
- Legacy v1 callers have a deliberately limited migration path.
- V2 test and qualification evidence cannot retroactively qualify v1 identities.
- Final mux, render, export, delivery, and publishing remain outside Music.
