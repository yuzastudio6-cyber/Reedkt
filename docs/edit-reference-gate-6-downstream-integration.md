# Edit Reference Gate 6 — Downstream Edit Integration

Status: `verified_backend_local`

Gate 6 connects one exact Gate 5 Preference Application to the canonical mock/local Project Edit Session and exposes its bounded, target-adapted guidance to Edit Chat, Edit Brief, Marker Context, Marker Chat, Plan Hints, and QA. It does not execute an edit or mutate an approved plan.

## Authority And Product Boundary

The connection is valid only when all of these identities agree:

```text
authenticated Edit Reference workspace
→ exact Edit Reference
→ exact approved Preference DNA version and digest
→ exact prepared Preference Application and digest
→ exact project ID and Edit Chat ID
→ confirmed saved output frame, platform, and edit level
→ mock Project Edit Session staging receipt
```

Gate 6 remains backend-local/private-beta authority. The Project Edit Session side is the existing browser-safe mock repository; the Edit Reference side is the authenticated private backend-local aggregate. The staged receipt proves deterministic agreement between those two local systems, but it is not production database or remote identity proof.

No provider, model, file-byte read, external fetch, media process, worker, generation request, render, credit action, approved-plan mutation, or Supabase write is authorized.

## Connection Sequence

```text
select approved Edit Reference by name
→ enter current direction for this exact edit
→ confirm the saved output frame
→ prepare or recover the exact target application
→ stage an inactive context in Project Edit Session
→ reset requested/approved mock approval when required
→ issue a bounded mock target-session receipt
→ connect the exact application through the authenticated backend route
→ activate only the server-connected application in Project Edit Session
→ surface the same bounded context downstream
```

The sequence is deliberately recoverable:

- a staging failure changes no Edit Reference application;
- a backend connection failure leaves staged context inactive and retryable;
- an activation failure leaves backend-local connection authority intact;
- a later page load safely restores the connected context into the mock session;
- repeated connection requests use durable idempotency and do not duplicate the application.

## Structured Downstream Context

`PreferenceApplicationDownstreamContext` freezes:

- package version and deterministic package hash;
- exact application, application digest, Edit Reference, DNA version, and target-context identity;
- target project/edit identity;
- current target instruction and approved constraints;
- adapted guidance only;
- held-back/context-only decisions separately;
- mandatory do-not-copy rules;
- the approved precedence policy;
- truthful mock-only and all-false production safety flags.

Normal UI shows the Edit Reference name, target-specific counts, safety boundaries, status, and priority summary. It does not expose application IDs, content digests, target-context digests, storage details, or provider/worker internals.

## Precedence

Gate 6 preserves this order:

```text
safety, platform, tier, frame, credit/cost policy, approved constraints
→ current target instruction
→ confirmed or must-follow Edit Brief markers
→ target-adapted Preference DNA hints
→ generic defaults
```

Plan Hints never flatten this order. If a confirmed marker covers the same creative layer as a reusable DNA hint, the hint is retained for provenance but marked `held_back_by_confirmed_marker` instead of becoming an active planning hint.

## Downstream Consumers

### Project Edit Session

- Stores staged or connected integration state in typed session metadata.
- Records exact reference/DNA/application pointers, do-not-copy state, memory, history, and snapshots.
- Resets a requested or approved mock approval before staging a changed creative context.
- Never writes an approved plan or starts production.

### Edit Brief

- Mirrors only the connected bounded context into Edit Brief metadata.
- Shows one concise Applied Edit Reference card with adapted, held-back, and boundary counts.
- Keeps the connected context reload-safe in the existing mock repository.

### Marker Context And Marker Chat

- Adds marker-relevant target-adapted hints and their exact context hash to the bounded Marker Context Package.
- Sends only bounded text guidance to the existing backend-only Qwen prompt boundary.
- Never sends raw evidence, reference footage, frames, provider payloads, IDs, or digests to visible UI.
- Explicitly tells Marker Chat that current marker direction outranks reusable DNA.

### Plan Hints

- Adds lower-priority active hints and explicit held-back hints.
- Records exact application/context provenance in mock application logs.
- Does not execute a planner, create an edit plan, mutate an approved snapshot, or reserve credits.

### QA

- Checks exact project/edit scope, do-not-copy coverage, safety-first precedence, and marker overrides.
- Reports `passed`, `warning`, or `blocked` with adapted and held-back counts.
- A target mismatch, missing do-not-copy rules, or broken precedence blocks readiness.
- Held-back hints create a visible warning, not a failure, because the higher-priority marker is working as intended.

## UI And Design Authority

The implementation follows this authority order:

1. `design.md` and `design-system/`;
2. current ReEditPro UI/UX architecture documents;
3. UI UX Pro Max as supporting guidance only.

The connection surface uses the existing dark premium technical workspace, bounded glass cards, established cyan/violet/success state accents, progressive disclosure, semantic buttons and radio controls, responsive metric wrapping, and no generic settings maze. A user chooses references by name and sees truthful private-beta/mock-local copy.

## Persistence And API

New authenticated backend mutation:

```text
POST /v1/edit-reference-applications/:applicationId/connect
```

The route requires:

- workspace identity;
- current reference revision;
- exact application content digest;
- exact staged mock Project Edit Session receipt;
- durable idempotency key.

The private aggregate validates the recomputed downstream context, receipt, target/version links, safety flags, timestamps, and connection lifecycle on every read. Connected state survives repository recreation. The production repository remains fail-closed behind the existing migration/RLS gate.

## Gate 6 Verification Target

Gate 6 is complete only when tests prove:

- exact target mismatch and forged/mismatched receipts fail without mutation;
- unconnected staged context is never read as active;
- the authenticated connection and mock session activation succeed;
- the same context reaches Edit Chat, Brief, Marker Context, Marker Chat, Plan Hints, and QA;
- confirmed markers hold back matching DNA guidance;
- no approved plan or production side effect occurs;
- idempotent replay creates no duplicate connection;
- server/repository recreation and browser reload restore the same context;
- desktop and 375px layouts have no horizontal overflow;
- existing Edit Reference, Project Edit Session, Edit Brief, Edit Preference, Preference DNA, and Edit Level regressions pass.

## Verification Result — 2026-07-11

- Gate 6 downstream smoke passed the exact API/session/Brief/Marker/Plan/QA/restart path.
- Focused Playwright passed the complete user flow at 1440px and the responsive 375px state.
- Full Chromium regression passed 55/55 tests with five workers, including concurrent Edit Reference creation and unrelated Preference DNA sessions.
- TypeScript app/server checks, ESLint, client/server builds, frontend-boundary validation, control-plane checks, compatibility smokes, Qwen secret scans, and the 21-migration invariant passed.
- Final visual QA retained the ReEditPro glass/cyan-violet language and replaced the initial long Plan Hint wall with a three-item preview plus accessible disclosures.
- No SQL, lockfile, provider, model, media, worker, render, credit, Supabase, push, or PR action occurred.

Gate 7 owns replacement, removal, invalidation, final privacy/adaptation regression closure, and readiness reporting.
