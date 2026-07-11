# Edit Reference Gate 1 — Study Session Foundation

Status: `implemented_backend_local`

Date: 2026-07-11

Production ready: **No**

Gate 1 establishes the first real Edit Reference vertical slice:

```text
/preferences
→ Edit References
→ create private reference and initial study
→ exchange user and deterministic assistant/system messages
→ reload
→ read the same reference, study, and messages from backend-local persistence
```

## Runtime Architecture

```text
src/types/edit-reference.ts
→ server/edit-references/edit-reference-repository.ts
→ server/edit-references/private-edit-reference-repository.ts
→ server/services/edit-reference-service.ts
→ server/routes/edit-reference-routes.ts
→ src/lib/edit-reference-api-client.ts
→ src/lib/edit-reference-ui-adapter.ts
→ src/components/preferences/EditReferenceWorkspacePage.tsx
```

The production seam is `DisabledSupabaseEditReferenceRepository`. It returns `EDIT_REFERENCE_PERSISTENCE_BLOCKED` and performs no database operation while the canonical migration/RLS baseline is unresolved.

## Durable Local Authority

The server stores one authenticated-user/workspace aggregate under:

```text
LOCAL_STORAGE_ROOT/edit-reference-private/scopes/<sha256(user + workspace)>/aggregate.json
```

Properties proven by behavior tests:

- raw user/workspace identity is absent from the path;
- directories are `0700` and files are `0600`;
- in-root directory components reject symlinks and unsafe non-directories;
- writes use a same-directory exclusive temporary file, fsync, atomic rename, and directory fsync;
- every read checks an envelope version, source, SHA-256 checksum, scope identity, collection bounds, unique IDs, links, lifecycle values, roles, message sequences, and forbidden persistence fields;
- one process-scope lock serializes mutations for the same user/workspace;
- idempotency stores the exact response snapshot and fails closed at its bounded capacity instead of evicting committed responses;
- list on an empty scope creates no persistence file;
- browser localStorage is not referenced by the API client or workspace.

This is backend-local proof, not distributed or cross-device production authority.

## Implemented Operations

| Operation | Route | Gate 1 behavior |
| --- | --- | --- |
| Create reference | `POST /v1/edit-references` | Atomically creates reference, initial study, setup messages, usage/audit records |
| List references | `GET /v1/edit-references?workspaceId=...` | Typed summaries from the private repository |
| Load reference | `GET /v1/edit-references/:referenceId` | Current study, messages, future typed collections, safety state |
| Update/archive reference | `PATCH /v1/edit-references/:referenceId` | Expected-revision check and safe archive behavior |
| Create study | `POST /v1/edit-references/:referenceId/studies` | New current study with deterministic setup messages |
| Load study | `GET /v1/edit-reference-studies/:studyId` | Reference, study, messages, safety state |
| List messages | `GET /v1/edit-reference-studies/:studyId/messages` | Ordered typed message records |
| Update study | `PATCH /v1/edit-reference-studies/:studyId` | Expected revision, title update, server transition map |
| Append message | `POST /v1/edit-reference-studies/:studyId/messages` | User message plus deterministic acknowledgement in one commit |

Every mutation requires an `Idempotency-Key`; every request receives `x-request-id`. Browser users cannot choose assistant/system roles.

## Lifecycle Truth

Gate 1 implements only:

```text
draft -> collecting_evidence | archived
collecting_evidence -> ready_to_study | needs_clarification | archived
ready_to_study -> collecting_evidence | needs_clarification | archived
needs_clarification -> collecting_evidence | ready_to_study | archived
```

The full lifecycle enum exists for later gates. Gate 1 rejects transitions that would claim evidence study, DNA, QA, application, or failure execution.

## UI Truth

`/preferences` now has exactly four primary tabs:

1. Edit References — default.
2. Workspace Defaults — preserves the prior mock/default library behavior.
3. Applied Edits — truthful zero state until approved applications exist.
4. Safety & Privacy — plain-language privacy, approval, and copy-risk rules.

The Edit References desktop workspace provides saved-reference, Study Chat, and DNA/QA inspector panels. The inspector is a typed mapping of backend detail state and explicitly shows:

- `Study evidence not complete`;
- `No analysis run yet`;
- `DNA not generated yet`;
- `QA not run`;
- the next required action.

Normal user copy does not expose gate numbers, mock/local implementation terms, provider/model names, database details, worker state, or internal runtime labels. Those facts remain available in typed responses, tests, and engineering evidence without becoming product copy.

## Design-System Compliance

Frontend authority follows this order:

1. `design.md` and ReEditPro product rules.
2. `design-system/MASTER.md` and `design-system/pages/edit-preferences.md`.
3. UI UX Pro Max as supporting guidance only.

Gate 1 proves:

- one route H1 and one focal introduction;
- keyboard-first skip navigation;
- semantic tabs with Left/Right/Home/End navigation;
- visible labels, focus states, status/error live behavior, and state-aware async button copy;
- 44px tabs, icon actions, compact buttons, and primary controls;
- no page-level horizontal overflow at 375px or the compact desktop breakpoint;
- stacked mobile panels and a horizontally contained tab strip;
- reduced-motion-safe skip-link behavior;
- in-app browser review of empty, creation, populated, desktop, and 375px states;
- zero browser console errors during visual QA.

## Side-Effect Proof

All Gate 1 DTOs report false for:

- provider/model calls;
- file-byte reads and external fetches;
- media processing and workers;
- generation/render jobs;
- credit reservation/spend;
- Supabase reads/writes;
- raw frame/provider-payload persistence.

No SQL migration was added. Migration baseline/current remain 21.

## Readiness

- Backend-local persistence: behavior verified.
- API/client/UI: behavior verified.
- Browser reload: behavior verified.
- Workspace Defaults compatibility: behavior verified.
- Production Supabase/RLS/cross-device persistence: blocked.
- Evidence skills, DNA, QA, approval, and application: not implemented by this gate.
- `productionReady`: false.
