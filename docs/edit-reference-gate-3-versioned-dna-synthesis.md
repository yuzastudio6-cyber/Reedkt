# Edit Reference Gate 3 — Versioned Preference DNA Synthesis

Status: `implemented_backend_local`

Date: 2026-07-11

Production ready: **No**

Gate 3 turns evidence that passed the Gate 2 completion and copy-safety boundary into an immutable Preference DNA candidate:

```text
evidence-ready Edit Reference study
→ validate the latest copy-safety run
→ select active source evidence and latest derived findings
→ build evidence-linked Preference DNA rules and layers
→ append mandatory do-not-copy boundaries
→ freeze exact evidence revisions and content digests
→ persist a review-required DNA version
→ review the version in Study Chat
→ reload the same version without approval or application
```

Gate 3 does not run DNA QA, approve a version, apply it to an edit, read media bytes, call a model/provider, start a worker/render, mutate Supabase, or reserve/spend credits.

## Canonical Architecture

```text
src/types/edit-reference.ts
→ server/edit-references/edit-reference-dna-synthesis.ts
→ server/edit-references/edit-reference-repository.ts
→ server/edit-references/private-edit-reference-repository.ts
→ server/services/edit-reference-service.ts
→ server/routes/edit-reference-routes.ts
→ src/lib/edit-reference-api-client.ts
→ src/lib/edit-reference-ui-adapter.ts
→ src/components/preferences/EditReferenceWorkspacePage.tsx
```

The older mock Preference DNA builder remains a vocabulary and compatibility source. The canonical Gate 3 service does not call it as a second authority. It uses the approved layer registry, confidence-band policy, and safety-rule vocabulary while owning exact Edit Reference evidence/version identity itself.

## Synthesis Preconditions

Synthesis fails closed unless:

- the current study and evidence status are both `evidence_ready`;
- active, non-superseded source evidence exists;
- the most recent evidence orchestration produced derived evidence;
- the latest copy-safety skill completed;
- its copy-safety evidence is not classified `do_not_copy`;
- at least one transferable `must_follow` rule can be produced.

A study that needs clarification or user review cannot synthesize DNA. Repeating synthesis against unchanged evidence also fails rather than manufacturing a duplicate version. Exact idempotent replay returns the original committed response.

## Immutable Version Contract

Every version records:

- monotonic study-local version number;
- synthesis contract version and truthful `verified_mock` runtime source;
- exact evidence IDs and revisions in deterministic order;
- SHA-256 evidence-input digest;
- populated Preference DNA layer snapshots;
- evidence-linked rules and conflict snapshots;
- confidence and confidence band;
- mandatory adapt-not-copy policy;
- do-not-copy rule count;
- QA status `not_run`;
- SHA-256 immutable-content digest;
- false provider/model/media/worker/generation/render/credit flags.

Rule and conflict IDs are deterministic functions of their immutable content. Repeating the synthesis function with the same evidence yields the same input digest, rules, layers, and content digest; only the record identity and creation time may differ.

When new or corrected evidence is appended, the prior unapproved review candidate becomes `superseded` immediately so stale DNA cannot remain actionable. After the evidence is studied, a later synthesis creates the next version. The prior candidate's evidence links and content digest remain unchanged. Gate 4 owns QA, correction decisions, review, and approval.

## Evidence And Layer Integrity

Each rule, layer, and conflict may reference only evidence included in that version's exact input-revision set. Repository validation rejects:

- duplicate version numbers, DNA IDs, rule IDs, layer IDs, or input evidence IDs;
- evidence from another reference/study or the wrong revision;
- unsorted input-revision identity;
- layers that omit or add rules/evidence outside their own rule set;
- missing transferable rules;
- fewer than five mandatory do-not-copy rules;
- safety rules that are not `do_not_copy`;
- invalid confidence, transferability, coverage, or side-effect values;
- mismatched input or immutable-content digests.

Only populated layers are stored. Non-transferable or review-required evidence becomes context/conflict material rather than a reusable instruction, and its layer coverage remains review-required.

## API And Transaction Behavior

| Operation | Route | Behavior |
| --- | --- | --- |
| Synthesize DNA | `POST /v1/edit-reference-studies/:studyId/preference-dna` | Authenticated, CAS + idempotent mutation; atomically appends the version, supersedes older non-approved candidates, updates reference/study status, adds a deterministic chat message, usage event, and audit event |
| Read DNA | Existing Edit Reference detail route | Returns typed safe version, layer, rule, conflict, and status DTOs |

The request accepts only `workspaceId` and `expectedStudyRevision`. Unknown fields are rejected. The browser never writes DNA content directly.

## UI And Design Authority

The canonical `/preferences` Study Chat adds one state-aware action after evidence becomes ready and one compact Preference DNA review surface after synthesis. It shows:

- exact version number and `QA not run` state;
- layer, rule, copy-boundary, and evidence-confidence summaries;
- review-required conflicts when present;
- expandable layer/rule evidence summaries;
- the do-not-copy layer open by default;
- a clear immutable, not-approved, not-applied boundary.

The center remains a conversation-led workspace rather than a technical dashboard. Normal user copy does not expose gates, adapters, hashes, providers, mocks, database products, or runtime internals.

Frontend authority remains:

1. `design.md` and ReEditPro product rules.
2. `design-system/MASTER.md` and `design-system/pages/edit-preferences.md`.
3. Current ReEditPro UI/UX architecture documents.
4. UI UX Pro Max as supporting accessibility/craft guidance only where it does not conflict.

## Verification

- `npm run smoke:edit-reference-dna-synthesis`
- `npm run smoke:edit-reference-evidence-study`
- `npm run smoke:edit-reference-study-session-foundation`
- `npm run smoke:edit-reference-repository`
- `npm run smoke:edit-reference-api-client`
- `npm run smoke:edit-reference-ui`
- `npx playwright test tests/e2e/edit-reference-study-session.spec.ts --workers=1`

The Gate 3 smoke covers premature synthesis rejection, exact evidence linkage, deterministic content, immutable digests, mandatory copy boundaries, false side effects, idempotent replay, unchanged-input rejection, correction-driven Version 2 creation, Version 1 immutability, private-storage inspection, restart persistence, and no QA/application side effects.

## Readiness

- Deterministic evidence-to-DNA synthesis: verified mock.
- Backend-local version persistence/reload: verified.
- Browser DNA-generation and review journey: verified locally.
- DNA QA, correction review, approval, and application: not implemented by Gate 3.
- Live model/media/provider synthesis: not executed.
- Production Supabase/RLS/cross-device authority: blocked.
- `productionReady`: false.
