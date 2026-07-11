# Edit Reference Gate 7 — Lifecycle And Goal Closure

Status: `verified_backend_local_complete`

Implementation commit: `42d34cdc04179c6808a4c3f23286885daf116006`

Gate 7 closes the seven-gate backend-local Edit Reference goal with exact replacement, removal, downstream invalidation, immutable lifecycle history, recovery, privacy, responsive UI, and regression evidence. It does not authorize production persistence or execution.

## Lifecycle Authority

One exact connected Preference Application remains the active planning-context authority for a target project/edit. A lifecycle mutation is valid only when the authenticated scope, current Edit Reference revision, exact application digest, exact connected downstream context, target identity, and deterministic invalidation receipt agree.

```text
connected application A
→ invalidate exact A context in Project Edit Session
→ reset requested/approved session approval when required
→ mark A replaced and retain immutable A history
→ append prepared application B at the next monotonic version
→ link A and B bidirectionally
→ connect B only through the existing exact receipt boundary

connected application
→ invalidate exact context
→ reset requested/approved session approval when required
→ mark application cleared
→ retain application, usage, audit, and history records
```

Replacement and removal never overwrite an approved DNA version, application payload, approval snapshot, or approved edit plan.

## Downstream Invalidation Receipt

`PreferenceApplicationDownstreamInvalidationReceipt` binds:

- exact workspace, project, Edit Chat, application, and downstream context identity;
- lifecycle reason: `replace` or `remove`;
- invalidation timestamp and deterministic context hash;
- whether requested/approved mock approval was reset;
- exact invalidated consumer set;
- all-false provider, media, worker, generation, render, export, credit, and production-persistence side-effect flags.

The Edit Reference service recomputes and validates the receipt. A mismatched application, target, reason, context hash, timestamp, consumer set, or safety flag fails without mutation.

## Replacement

Replacement requires:

- the exact connected application being replaced;
- the expected revision of the old Edit Reference;
- a separately approved replacement DNA version and exact digest;
- a confirmed target output frame;
- the existing target direction and constraints;
- the validated `replace` invalidation receipt;
- durable idempotency.

The old application becomes `replaced`, records `replacedByApplicationId`, retains its immutable content, and stores its invalidation receipt. The new application records `replacesApplicationId` and uses the next application version for that exact target. The new record is prepared, not silently active; the normal Gate 6 connection boundary still applies.

## Removal

Removal requires the exact connected application, current Edit Reference revision, application digest, validated `remove` receipt, and durable idempotency. It marks the record `cleared`, retains its content and history, and records a lifecycle usage event. A second clear fails as a lifecycle conflict rather than producing another successful mutation.

Authenticated route:

```text
POST /v1/edit-reference-applications/:applicationId/clear
```

## Project Edit Session And Downstream Consumers

Project Edit Session invalidation:

- makes the old context inactive before replacement/removal continues;
- clears the connected application pointer;
- appends memory, history, and snapshot evidence;
- resets requested/approved mock approval when required;
- does not rewrite an approved plan or start a job.

Edit Brief removes the old active context fields, stores bounded previous-context evidence, and sets `preferenceApplicationReplanRequired`. Marker Context, Marker Chat, Plan Hints, and QA no longer consume the invalidated package. Old Plan Hints remain visible only as inactive history with an explicit replan requirement.

Recovery restores only a currently connected server application. A replaced or cleared application is never reactivated after reload, repository recreation, or an ambiguous client failure.

## UI And Design Authority

The implementation follows this authority order:

1. `design.md` and `design-system/`;
2. current ReEditPro UI/UX architecture documents;
3. UI UX Pro Max as supporting guidance only.

The connected preference card now exposes `Replace` and `Remove` without creating another page or settings maze. Replacement uses progressive disclosure: select another approved Edit Reference, review the current direction, and reconfirm the saved frame. Removal uses an explicit destructive confirmation. Both flows keep pending, retry, success, and failure states scoped to the operation and use accessible live status.

Applied Edits distinguishes `Prepared`, `Connected`, `Replaced`, and `Removed` in plain language. Historical states use quiet neutral styling rather than green success styling. Controls meet the 44px target rule, remain keyboard reachable, preserve visible focus, and stack without page-level overflow.

Visual QA inspected 1440px and 375px layouts. It caught a cramped two-column replacement selector and vertically wrapped Cancel action; the final design uses a readable single-column selection flow. No temporary screenshot artifact is retained in source.

## Persistence And Safety

The private aggregate validates on every read:

- exact lifecycle enum and allowed transitions;
- monotonic application versions per target;
- immutable previous/next replacement links;
- invalidation receipt identity and safety flags;
- application content digests independent of mutable lifecycle fields;
- usage/audit history and bounded aggregate collections;
- tenant scope, private path, checksum, and privacy constraints.

The production repository remains fail-closed. Gate 7 adds no SQL or migration and retains the 21-file baseline.

## Verification Result — 2026-07-11

| Command / check | Result | Evidence |
| --- | --- | --- |
| `npm run smoke:edit-reference-lifecycle-closure` | Pass | Receipt mismatch, approval reset, A-to-B replacement, monotonic Version 2, bidirectional links, connect B, tenant rejection, remove, replay, double-clear conflict, Brief clear, restart, usage, privacy, and false side effects |
| Gate 0–6 Edit Reference smokes | Pass | Repository, API, client, UI, evidence, DNA, QA/approval, target adaptation, downstream integration, and control-plane behavior preserved |
| Project Edit Session/Edit Brief/Marker regressions | Pass | Repositories, routes, clients, memory/history, Brief, Marker Context/Chat, Plan Hints, QA, and recovery preserved |
| Edit Preference/Preference Video/DNA/Edit Level regressions | Pass | Existing compatibility and mock/local product behavior remained truthful |
| Focused lifecycle Playwright | Pass | Replace/remove UI, frame reconfirmation, confirmation, history, inactive old hints, replan, reload, responsive behavior, and target sizes |
| Full Chromium Playwright | Pass | 56/56 tests with five workers |
| App/server typechecks and ESLint | Pass | No TypeScript or lint failures |
| Frontend boundary | Pass | 663 frontend files checked; React imports no backend runtime |
| Client/server builds | Pass | 2,562 client and 589 server modules transformed; existing large-client-chunk warning remains disclosed |
| Qwen secret/runtime and production privacy checks | Pass | No leaked secret/runtime boundary or production privacy finding |
| Migration and goal post-gate checks | Pass | Canonical path/branch/ancestry, 21 migrations, no conflicts, and production-ready false |

No test was weakened or silently skipped. No SQL, lockfile, provider, model, media, worker, render, export, credit, Supabase, push, or PR action occurred.

## Completion And Remaining Production Gates

The canonical backend-local journey in `docs/edit-reference-definition-of-done.md` is complete through creation, evidence, DNA, QA/approval, target adaptation, downstream use, reload, replacement, removal, privacy, and regression proof.

Production ready remains false. The following evidence is still required before that classification can change:

- approved canonical Supabase migration chain and local/staging reset;
- production RLS, two-user/two-workspace isolation, and cross-device authority;
- production storage, service identity, transaction, and observability evidence;
- capability-specific live media/provider skill proof with ephemeral-media privacy;
- distributed worker, failure recovery, release, and operational evidence.

These are production gates, not hidden claims inside the completed backend-local workflow.

### Remote State

- Push/PR/remote merge: not performed.
- Supabase CLI/SQL/remote mutation: not performed.
- Provider/media/worker/render/credit execution: not performed.
- Production ready: false.
