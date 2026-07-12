# Edit Reference Gate 2 — Evidence And Study Orchestration

Status: `implemented_backend_local`

Date: 2026-07-11

Production ready: **No**

Gate 2 extends the canonical Gate 1 study session with versioned evidence intake and truthful, deterministic skill orchestration:

```text
/preferences
→ open an Edit Reference
→ add a creative note, safe reference-video details, or approved-edit identity
→ persist source evidence and provenance
→ run the bounded evidence study
→ persist skill runs and evidence-linked findings
→ review copy-safety, conflict, fallback, and missing-evidence results
→ correct a source record without erasing history
→ reload the same evidence and findings
```

Gate 2 does not create Preference DNA, run DNA QA, approve a preference, apply it to an edit, read media bytes, call a model/provider, start a worker/render, or reserve/spend credits.

## Canonical Architecture

```text
src/types/edit-reference.ts
→ server/edit-references/edit-reference-repository.ts
→ server/edit-references/private-edit-reference-repository.ts
→ server/edit-references/edit-reference-evidence-orchestrator.ts
→ server/services/edit-reference-service.ts
→ server/routes/edit-reference-routes.ts
→ src/lib/edit-reference-api-client.ts
→ src/lib/edit-reference-ui-adapter.ts
→ src/components/preferences/EditReferenceWorkspacePage.tsx
```

The older `src/backend/preference-video-study/` layer remains a mock/future toolchain reference. Gate 2 reuses its taxonomy and do-not-copy intent but does not call its mock evidence generator because that generator creates placeholder observations. Canonical Edit Reference evidence is created only from actual user input, supplied metadata, deterministic review, or a blocked/fallback result with explicit provenance.

## Evidence Sources

### Creative note

- Stores user-described creative judgment.
- Category is one selected study goal or all selected goals.
- Transferability is explicitly chosen as transferable, reference-specific, do-not-copy, or review-required.
- Confidence basis is `user_asserted`.
- No media observation is implied.

### Reference video details

- Stores only label, duration, dimensions, orientation, audio-presence flag, rights basis, and a server-generated private asset identity.
- Runtime normalizes only those supplied values.
- `mediaStudyStatus` remains `media_not_studied`.
- It cannot create visual, scene, transcript, pacing, color, caption, audio, or motion observations.
- Browser/API input rejects unknown payload fields such as signed URLs.

### Previous approved edit identity

- Stores exact project, edit-session, and approved-snapshot identity plus a server-generated private asset identity.
- It does not open project history, snapshot payload, previews, or media.
- The media-structure skill run is blocked until private approved-snapshot authority is connected.
- It preserves provenance without leaking reference-project history.

### Corrected evidence

- A new creative-note record points to the exact superseded evidence ID.
- The superseded record remains durable and visible as history.
- A second correction of an already superseded record fails with a version conflict.
- Future orchestration uses the active correction and ignores the superseded source for synthesis, coverage, conflict, and copy-risk decisions.

## Skill-Run Truth

Every run stores:

- stable study-run and skill-run identity;
- registry skill ID and readiness at execution;
- input and output evidence IDs;
- runtime source (`verified_local`, `verified_mock`, `fallback`, or `not_started`);
- fallback flag, tools, result summary, warnings, and blockers;
- false side-effect flags for provider/model/file/URL/media/worker execution.

Implemented Gate 2 execution:

| Skill | Gate 2 execution | Truthful outcome |
| --- | --- | --- |
| Media Structure Metadata Map | `verified_local`, degraded | Normalizes supplied metadata only; video remains unstudied |
| Visual Language Analyst | fallback | Summarizes user-described direction; no frames/model |
| Story And Editorial Analyst | fallback | Structures user-described direction; no model reasoning |
| Speech And Pacing Evidence | blocked | No transcript/audio adapter; blocker recorded |
| Caption Design Evidence | fallback | Manual evidence only; no OCR/transcript |
| Color Treatment Evidence | fallback | Broad user direction only; no exact grade/LUT |
| Audio And Sound Design Evidence | fallback | Manual evidence only; no audio/MMAudio/Lyria |
| Graphics And Motion Evidence | fallback | Manual evidence only; no render/generated code |
| Transferability And Do-Not-Copy | `verified_mock` | Deterministic copy-safety classification |

No `verified_live` result is emitted because Gate 2 does not call Qwen or another provider.

## Copy Safety And Conflict Behavior

The deterministic safety pass recognizes direct requests for:

- exact shot order or shot-for-shot copying;
- exact timing/timecodes;
- exact graphic or UI layout;
- same song, lyrics, music, or SFX;
- creator, person, logo, brand, or identity imitation;
- reference video reuse as project footage.

Explicit prohibitions such as “never copy exact layouts” are treated as safety direction, not as copy requests. A direct-copy request creates do-not-copy evidence, blocks the safety run, and transitions the study to `needs_user_review`.

The deterministic conflict pass currently identifies simultaneous restrained/measured and rapid/high-energy pacing direction. It creates a review-required finding and never chooses silently.

## Evidence Completion

Gate 2 marks evidence ready only when:

- every selected study goal has active manual evidence, either goal-specific or `all_goals`;
- no direct-copy request is active;
- no deterministic conflict requires user choice.

Metadata-only or approved-edit-identity-only studies remain `needs_clarification`. This prevents an asset identity or dimensions from being mistaken for creative analysis.

Gate 2 can transition the current study to:

```text
ready_to_study
evidence_ready
needs_clarification
needs_user_review
```

It does not transition to DNA, QA, approval, application, render, or production states.

## API Operations

| Operation | Route | Behavior |
| --- | --- | --- |
| Add evidence | `POST /v1/edit-reference-studies/:studyId/evidence` | CAS + idempotency; persists source evidence/asset and deterministic chat update |
| Run evidence study | `POST /v1/edit-reference-studies/:studyId/evidence-study` | CAS + idempotency; persists derived findings, skill runs, lifecycle result, and chat update |
| Read evidence/findings | Existing reference detail route | Returns safe typed DTOs from the canonical aggregate |

Every mutation requires `Idempotency-Key`. Exact replay returns the committed response snapshot; a key collision with different input fails without mutation.

## Persistence And Privacy

Gate 2 remains in the existing private backend-local aggregate and therefore inherits Gate 1 checksum, scope, path, atomic-write, permission, capacity, and corruption protections.

Additional read-time validation covers:

- evidence source/category/confidence/transferability/provenance;
- metadata bounds and orientation;
- private asset kind, rights, and exact approved-edit identity;
- skill run readiness/runtime/input/output links and false side-effect flags;
- evidence correction links and single-successor behavior;
- collection ceilings for evidence, assets, and skill runs.

Browser DTOs contain no filesystem paths, signed URLs, secrets, raw frames, raw provider payloads, project history, or media bytes.

## UI And Design Authority

The `/preferences` Edit References workspace remains the canonical surface. Gate 2 adds:

- a compact evidence toolbar inside Study Chat;
- three plain-language evidence modes;
- explicit privacy boundaries for video details and approved-edit identity;
- saved source cards with correction history;
- one state-aware Study evidence action;
- latest evidence findings with user-facing runtime labels;
- inspector counts and copy-safety status;
- responsive and keyboard-accessible controls with 44px targets.

Authority order remains:

1. `design.md` and ReEditPro product rules.
2. `design-system/MASTER.md` and `design-system/pages/edit-preferences.md`.
3. Current ReEditPro UI/UX architecture.
4. UI UX Pro Max as supporting guidance only.

Normal UI does not expose gate numbers, repository/database terms, adapter/worker names, model/provider names, or mock labels.

## Verification

- `npm run smoke:edit-reference-evidence-study`
- `npm run smoke:edit-reference-study-session-foundation`
- `npm run smoke:edit-reference-repository`
- `npm run smoke:edit-reference-api-client`
- `npm run smoke:edit-reference-ui`
- `npx playwright test tests/e2e/edit-reference-study-session.spec.ts --workers=1`

The Gate 2 smoke covers metadata-only truth, approved-edit identity, manual evidence, exact idempotent replay, stale/collision failure, all copy-risk families, explicit safety wording, conflicting pacing, corrections, tenant isolation, DTO/storage privacy, restart persistence, and no DNA/QA side effects.

## Readiness

- Evidence persistence and reload: backend-local behavior verified.
- Evidence study orchestration: deterministic/fallback/blocked behavior verified.
- Copy safety and pacing conflict behavior: verified mock/deterministic.
- UI evidence journey: browser behavior verified.
- Media analysis, approved-snapshot retrieval, transcript/audio/visual workers, and live model reasoning: not executed.
- Production Supabase/RLS/cross-device persistence: blocked.
- Preference DNA synthesis, DNA QA, approval, and target application: later gates.
- `productionReady`: false.
