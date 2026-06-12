# Cross-Chat Coordination Registry

Status: `docs_only`.

Purpose: this directory is the shared source of truth for ReeditPro work that spans multiple ChatGPT/Codex workstreams. It prevents duplicate work, overlapping ownership, incompatible contracts, and disconnected implementation.

Direct chat-to-chat communication is not assumed. Chats coordinate by reading and updating repo docs, PRs, prompt records, diagnostics, and handoff contracts.

## Coordination Rules

- Every chat must read this registry before starting work that touches tools, workers, providers, Supabase, maps, rendering, billing, frontend flows, compliance, observability, or beta readiness.
- Every prompt must declare the owner workstream, affected workstreams, owned contracts, not-owned contracts, duplicate-risk check, Supabase update classification, and final handoff expectation.
- Every workstream must keep its ownership and status current in the registry and ledger.
- Repo docs are the source of truth; chat memory is not.
- No duplicate implementation is allowed without a documented audit and coordination prompt.
- Runtime implementation, provider calls, SQL, GCP, rendering, tool execution, worker execution, Stripe, deployment, and production/beta unlocks remain blocked unless a later explicit approved prompt enables them.

## Canonical Cross-Chat Files

- `chat-ownership-registry.md`: owner, domain, tool, blocker, and handoff table.
- `workstream-status-ledger.md`: latest known prompt/PR/status per workstream.
- `integration-boundary-map.md`: allowed and blocked handoffs between workstreams.
- `capability-handoff-contract.md`: structured handoff record contract.
- `duplicate-work-prevention-policy.md`: duplicate and ownership conflict prevention.
- `prompt-start-checklist.md`: mandatory checklist before future prompt work.
- `prompt-final-response-standard.md`: final response standard for Codex work.
- `open-dependencies-and-blockers.md`: shared unresolved blockers.
- `reeditpro-end-to-end-system-map.md`: high-level system path.
- `ai-tools-creative-graphics-ownership.md`: this chat's owned AI Tools scope.
- `map-stack-boundary-note.md`: map/geospatial ownership boundary.

## Current XCHAT-0 Decision

This chat owns AI Tools / Creative Graphics / Motion Design. It does not own map/geospatial, Track A render/export validation, Track B media processing, Supabase/RLS/storage/database, provider gateway/model routing, worker runtime, billing, observability, compliance, frontend product UX, or E2E beta deployment.

Production capability enabled: none.
