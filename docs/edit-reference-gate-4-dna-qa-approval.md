# Edit Reference Gate 4 — Preference DNA QA And Approval

Status: `implemented_backend_local`

Date: 2026-07-11

## Outcome

Gate 4 adds the first canonical, version-bound quality and approval path for Edit Reference Preference DNA:

```text
immutable review candidate
→ run deterministic QA against the exact content and evidence digests
→ block unsafe versions or expose non-blocking review limits
→ require explicit adapt-not-copy acknowledgement
→ approve that exact version
→ retain immutable QA, approval, usage, and audit history
```

Approval stores reusable guidance only. Gate 4 does not apply Preference DNA to a project or edit, create an edit plan, read media bytes, call a model/provider, start a worker/render, mutate Supabase, or reserve/spend credits.

## Authority Reconciliation

The imported Preference DNA QA family remains useful vocabulary and regression evidence, but it targets the older mock `PreferenceDNABuildResult` shape and assumes all legacy layer families. The canonical Gate 4 service does not call that implementation as a competing version authority.

Gate 4 reuses its quality categories, confidence intent, transferability boundary, and safety language while evaluating the exact canonical Gate 3 `PreferenceDNAVersionRecord`. Required layers are derived from the study's selected goals plus the universal transferable-rule and do-not-copy layers. A color-only or B-roll-only study is therefore reviewed against its real scope instead of failing because unrelated legacy layers are absent.

## Deterministic QA Contract

`edit-reference-dna-qa-v1` always emits the following twelve checks with stable check IDs:

1. Version integrity.
2. Evidence integrity.
3. Study-goal layer coverage.
4. Layer evidence coverage.
5. Evidence confidence.
6. Conflict review.
7. Transferability consistency.
8. Do-not-copy coverage.
9. Direct-copy risk.
10. Identity and source safety.
11. No production side effects.
12. Approval readiness.

The result freezes:

- exact DNA version ID and number;
- exact DNA content digest;
- exact input-evidence digest;
- stable check records and linked evidence/layer/rule IDs;
- blocking and review check IDs;
- final decision and summary;
- QA content digest;
- false provider, model, file-byte, URL-fetch, media, worker, generation, render, and credit side-effect flags.

Identical immutable input produces identical checks and QA content digest. The QA record ID and timestamp remain server-owned event identity.

## Decision Semantics

QA has three terminal results for one immutable DNA version:

- `blocked` — at least one safety or integrity check blocks approval. A blocker cannot be acknowledged away.
- `requires_user_review` — blocking checks passed, but confidence, conflicts, context-only copy risk, or coverage limits require explicit acknowledgement.
- `passed` — deterministic checks passed; explicit user approval is still required.

Overall confidence below `0.45` blocks approval. Confidence below `0.72`, or a low-confidence layer, requires user review. These values belong to QA policy version `edit-reference-dna-qa-v1`; changing them requires a new policy version and regression evidence.

## Approval Contract

Approval requires all of the following in one authenticated, idempotent mutation:

- expected current study revision;
- exact DNA version ID;
- exact DNA content digest;
- exact QA result ID linked to that version;
- no blocking result or blocking checks;
- `acknowledgeAdaptNotCopy = true`;
- `acknowledgeQAReview = true` when QA requires review.

The server stores a `PreferenceDNAApprovalSnapshot` on the exact version. A later approved version supersedes the prior approved lifecycle status, but the prior version's immutable DNA, QA result, approval snapshot, and approval timestamp remain intact.

Adding or correcting evidence after approval does not silently rewrite or revoke the approved historical artifact. It resets the active study to evidence review. After corrected evidence is studied, a new DNA version must pass its own QA and approval before it becomes the active approved guidance.

## Authenticated API Boundary

```text
POST /v1/edit-reference-studies/:studyId/preference-dna/:dnaVersionId/qa
POST /v1/edit-reference-studies/:studyId/preference-dna/:dnaVersionId/approve
```

Both routes validate strict request bodies, expected revision, tenant scope, durable idempotency, and exact immutable digest identity. Same-key/same-input replay returns the exact committed response. Stale revisions, changed replay input, wrong digests, wrong QA links, repeated QA, blocked approval, and missing acknowledgements fail without mutation.

## UI And Design Contract

Frontend authority remains:

1. `design.md` and repository product rules.
2. `design-system/MASTER.md` and `design-system/pages/edit-preferences.md`.
3. Current ReEditPro route/workflow/UI documents.
4. UI UX Pro Max as supporting craft and accessibility guidance only.

The canonical `/preferences` surface keeps Study Chat primary and adds one compact QA/approval sequence inside the existing Preference DNA review:

- one `Run quality review` action before QA;
- visible non-passing findings with title, summary, and recovery guidance;
- passed checks collapsed by default;
- blocking findings paired with `Correct evidence`;
- one exact-version acknowledgement and approval action for non-blocked QA;
- a success state that explicitly says the version is not applied and production has not started.

Normal copy does not expose gate numbers, routes, QA record IDs, adapters, storage, providers, workers, or runtime implementation details. Status is communicated by text and semantics, not color alone. Controls retain visible focus, semantic labels, at least 44px interaction targets, responsive stacking, and reduced-motion-safe styling.

## Persistence And Privacy

The backend-local private aggregate validates on every read:

- one QA result per DNA version;
- the complete twelve-check registry exactly once;
- stable check IDs and QA content digest;
- exact DNA/evidence digest links;
- exact evidence/layer/rule links;
- status derived from blocking/review checks;
- false production side effects;
- approval-to-QA-to-version identity;
- required acknowledgement for review results;
- approved/superseded lifecycle consistency;
- collection bounds, scope, checksum, timestamps, and privacy exclusions.

Browser localStorage is not authority for QA or approval. No raw frames, source media, provider payloads, credentials, paths, signed URLs, or private storage internals enter browser DTOs.

## Verification

Primary behavior proof:

```text
npm run smoke:edit-reference-dna-qa-approval
```

It covers deterministic content, integrity and copy-safety blockers, confidence review, false side effects, exact digest/version links, cross-workspace rejection, duplicate-run rejection, idempotent replay, acknowledgement gates, Version 1 approval, corrected-evidence Version 2 approval, historical supersession, restart persistence, privacy inspection, and all seven individual study-goal layer policies.

Supporting proof includes canonical repository/API/client/UI smokes, Gate 2/3 regressions, focused Playwright approval/reload/correction behavior, the full browser suite, desktop/mobile visual QA, frontend/server typechecks, lint, build, secret/path scans, and the goal preflight/post-gate checks.

## Remaining Boundary

Gate 5 owns target-video adaptation and `PreferenceApplication`. `prepare_target_application` means the approved guidance is eligible for that later workflow; it is not an application command and does not imply that any edit changed.
