# Edit Reference Test Fixture Plan

Status: `gate_5_fixtures_executed_through_target_application`

Fixtures must test behavior, not only file presence. They must be deterministic, private, rights-safe, small, and explicit about whether they contain metadata, synthetic media, or previous approved-edit evidence.

## Fixture Families

### 1. Empty Workspace

- No Edit References.
- Expected UI: truthful empty state and New Reference action.
- Expected persistence: no aggregate file until the first mutation.

### 2. Study Foundation

- Reference name: `Editorial explainer reference`.
- Description: optional user direction.
- Goals: visual language, story/pacing, captions, color, B-roll, audio/SFX, graphics.
- Expected Gate 1 behavior: create/list/load, study creation, deterministic setup questions, user response, reload/readback, no evidence/DNA/QA claim.

### 3. Idempotent Message Replay

- Same workspace, study, client message ID, idempotency key, and request payload repeated.
- Expected: exact response replay and one persisted message.
- Conflict variant: same key with different content.
- Expected: conflict and no mutation.

### 4. Lifecycle Validation

- Valid: `draft -> collecting_evidence`.
- Later valid examples: `ready_to_study -> studying`, `studying -> needs_clarification`, `studying -> evidence_ready`.
- Invalid Gate 1 example: `collecting_evidence -> approved`.
- Expected: fail closed, unchanged state/revision.

### 5. Reference Video Metadata

- Synthetic/private fixture identity with duration/dimensions only.
- Expected before Gate 2: metadata attached; `media_not_studied`; no raw bytes/provider call.
- Later variants: no audio, text-heavy, scene-rich, portrait, wide, unknown dimensions.

### 6. Previous Approved Edit

- Exact project/edit/snapshot identity with rights-safe synthetic content.
- Expected: source provenance preserved; approved output may be studied only through private asset authority; no reference project history leakage.

### 7. Manual Evidence

- User describes pacing, captions, color, B-roll, audio, graphics, and avoidances.
- Expected: `manual_user_evidence`, confidence appropriate to user assertion, no fabricated media analysis.

### 8. Copy-Risk Fixtures

- Exact shot order request.
- Exact timecode request.
- Song/lyrics request.
- Creator/brand/logo/person identity request.
- Exact graphic/UI layout request.
- Reference-as-project-footage request.
- Expected: non-transferable/do-not-copy classification and blocking/review behavior.

### 9. Conflicting Evidence

- User asks for slow restrained pacing; reference evidence suggests rapid cuts.
- Expected: explicit conflict, instruction priority, user review, no silent resolution.

### 10. Low Confidence / Missing Evidence

- Sparse metadata, no actual study skills.
- Expected: clarification/evidence request, no approvable DNA.

### 11. DNA Versioning

- Version 1 from initial evidence.
- User correction creates Version 2.
- Expected: Version 1 immutable, exact evidence refs/digests, QA bound to each version.

### 12. Target Adaptation Pair

- One approved DNA applied to two different synthetic target edits: a voice-first tutorial and a silent lifestyle montage.
- Expected: different pacing/audio/caption/application hints, same high-level DNA provenance, no direct copied timing/shots.

### 13. Application Replacement And Removal

- Apply A, replace with B, clear.
- Expected: monotonic application version, usage events, exact history, downstream invalidation, no approved-snapshot mutation.

### 14. Privacy And DTO Redaction

- Seed storage paths, signed URLs, auth headers, provider payload-like values, and raw-frame fields in internal negative fixtures.
- Expected: reject or redact; browser response and logs contain none.

### 15. Tenant Isolation

- Two users/two workspaces with colliding display names and client message IDs.
- Expected: scoped isolation and no cross-workspace replay/read/write.
- Current Gate 1 proof: isolated private-local scopes; production RLS remains blocked.

### 16. Persistence Corruption And Recovery

- Invalid JSON, checksum mismatch, wrong scope, duplicate IDs, unsupported record version, oversized aggregate, symlink/traversal path.
- Expected: fail closed; no silent reset or data loss.

## Browser Fixtures

Focused Playwright begins at `/preferences` and proves:

1. Edit References is the default tab.
2. New Reference creates a backend/API record.
3. The study opens and deterministic questions are visible.
4. A user message is sent.
5. Reload returns the same reference/study/messages.
6. Workspace Defaults remains available and operational.
7. UI states remain truthful and no DNA/QA/provider/render/credit claim appears.
8. Keyboard navigation, focus, 1024/1440/1920 layout, and overflow checks pass.

Later Playwright fixtures extend this same canonical path for evidence, DNA, QA, approval, target application, replacement, removal, and downstream contexts.

## Fixture Storage Rules

- Store small JSON fixtures in repository test directories.
- Keep media synthetic or rights-cleared and outside browser DTOs.
- Never commit secrets, signed URLs, service credentials, private user media, or raw provider responses.
- Keep timestamps deterministic where the test does not exercise real time.
- Every fixture declares runtime source, mock/local/live status, provenance, and expected side-effect flags.

## Gate 2 Executed Fixtures

`server/smoke/edit-reference-evidence-study-smoke.ts` now executes the Empty/Study foundation dependency plus Reference Video Metadata, Previous Approved Edit identity, Manual Evidence, all six Copy-Risk families, Conflicting Evidence, Low/Missing Evidence, correction history, Privacy/DTO redaction, tenant isolation, idempotency conflict/replay, and restart persistence behaviors.

## Gate 3 Executed Fixtures

`server/smoke/edit-reference-dna-synthesis-smoke.ts` now executes DNA Versioning with premature-run rejection, exact evidence revision/digest linkage, deterministic rule/layer/content output, mandatory do-not-copy coverage, idempotent replay, unchanged-input rejection, correction-driven Version 2 creation, Version 1 immutable-content preservation, privacy inspection, restart persistence, and zero QA/application/provider/media/worker/render/credit side effects.

The focused browser fixture generates Version 1 from evidence-ready findings and reviews its layers, rules, copy boundaries, confidence, conflicts, and exact QA state.

## Gate 4 Executed Fixtures

`server/smoke/edit-reference-dna-qa-approval-smoke.ts` executes deterministic QA twice over identical immutable input, integrity/copy/safety/confidence blocker variants, exact-digest and cross-workspace API conflicts, one-result-per-version persistence, duplicate-run rejection, replay, review acknowledgement, Version 1 approval, corrected-evidence Version 2 approval, historical supersession, restart persistence, private-file inspection, all seven individual goal-to-layer policies, and zero production/application side effects.

The focused browser fixture runs quality review, expands review-required findings, proves approval stays disabled before acknowledgement, approves Version 1, reloads it, corrects evidence without rewriting the approval, creates and independently approves Version 2, reloads the new active approval, and keeps the target-application boundary truthful.

## Gate 5 Executed Fixtures

`server/smoke/edit-reference-target-application-smoke.ts` executes premature/unapproved rejection, exact version/digest/approval/QA authority, confirmed-frame enforcement, direct-copy target-instruction rejection, tenant isolation, idempotent replay, duplicate-target rejection, the Target Adaptation Pair, current-instruction precedence, universal copy-boundary retention, target-specific content digests, private persistence/reload, global application listing, and zero target-edit/plan/context/provider/media/worker/render/credit side effects.

The focused browser fixture displays the approved target-ready handoff, loads a real prepared application in Applied Edits, reviews target-specific guidance, keeps internal fields out of visible copy, and verifies horizontal overflow safety.

Application replacement/removal, downstream invalidation, remote RLS, live media study, and provider execution remain later-gate fixtures.
