# Edit Reference Definition Of Done

Status: `fulfilled_backend_local`

Edit Reference is not complete when types, mock labels, a profile card, or a local provider proof exists. It is complete only when the same canonical system demonstrates the full user journey and all evidence gates below.

## Required End-to-End User Journey

A tester must be able to:

1. Open Edit Preferences.
2. Create an Edit Reference study.
3. Add a reference video or previous approved edit.
4. See study skills and truthful progress.
5. Review visual, story, caption, color, pacing, B-roll, audio, graphic, and safety findings.
6. Correct findings through Preference Study Chat.
7. Generate Preference DNA from versioned evidence.
8. Review Preference DNA QA and do-not-copy rules.
9. Approve an exact DNA version.
10. Open a different target edit.
11. Select the Edit Reference during edit setup or tag it through structured chat context.
12. See target-specific adaptation rather than direct copying.
13. See adapted rules in Project Edit Session, Edit Brief, Marker Context, Marker Chat, Plan Hints, and QA.
14. Reload without losing canonical state.
15. Replace or remove the applied Edit Reference without mutating approved history.
16. Pass backend, browser, persistence, privacy, and adaptation tests.

## Artifact And Identity Requirements

- Every Edit Reference, study, message, evidence item, asset, skill run, DNA version, QA result, application, and usage event has stable typed identity.
- Display names and handles are not database identity.
- Every mutation is scoped to the authorized workspace/user and uses a bounded idempotency key.
- Every mutable record has revision/version evidence and safe conflict behavior.
- Approved DNA versions are immutable; correction creates a new version.
- Application points to the exact approved DNA version and exact target edit.

## Study And Skill Requirements

- Skill status comes from structured skill-run records, not inferred UI copy.
- A fallback is reported as fallback and never as live execution.
- Every skill has typed inputs/outputs, proof, safe failure, privacy, and provenance policy.
- Evidence records distinguish user-provided facts, metadata, extracted observations, model inference, fallback inference, and manual correction.
- Raw sampled frames and raw provider payloads are not persisted by default.
- Media tools/providers run only through approved backend boundaries.

## DNA And QA Requirements

- DNA rules are evidence-linked, categorized, confidence-scored, and marked transferable/non-transferable/review-required.
- Universal and evidence-specific do-not-copy rules are present.
- QA checks completeness, evidence coverage, contradictions, copy risk, identity/brand/person risk, source safety, confidence, transferability, side effects, and review readiness.
- QA blocking findings prevent approval and application.
- User corrections are versioned and traceable.

## Target Adaptation Requirements

- Application considers target source context, user intent, edit level, output frame, speech, story role, platform, budget, and approved constraints.
- Reference-specific timing, shots, captions, music, SFX, layouts, logos, people, or creator identity are never copied as instructions.
- Current user instructions outrank Preference DNA, and safety/platform/tier/frame/credit/approved-snapshot rules outrank both.
- The same approved DNA can produce different safe application hints for different target videos.
- Replace/clear operations preserve history and invalidate/replan downstream work when required.

## Persistence And API Requirements

- Browser localStorage is not canonical for Edit References, studies, messages, evidence, DNA versions, QA, or applications.
- Repository, service, route, client, and UI use one canonical public contract.
- Backend-local testing survives process/repository recreation and browser reload.
- The production repository seam fails closed until schema/RLS evidence exists.
- Browser responses exclude secrets, storage paths, signed URLs, raw provider payloads, raw frames, and internal credentials.
- Idempotent replay cannot duplicate messages or side effects.

## UX Requirements

- `/preferences` defaults to Edit References and retains Workspace Defaults, Applied Edits, and Safety & Privacy.
- Left, center, and right panels follow `docs/edit-reference-ui-contract.md`.
- Loading, empty, ready, saving, saved, retry, not-found, denied, unavailable, and blocking states remain distinct.
- The UI is keyboard-usable, reduced-motion-safe, responsive at approved desktop widths, and free of horizontal overflow.
- No placeholder panel claims study, DNA, QA, or application work that has not happened.

## Verification Requirements

- Repository, route, client, service, persistence, study, skill, DNA, QA, application, privacy, and adaptation smokes pass.
- Focused Playwright tests prove real user behavior and reload.
- Existing dashboard, Projects, Project Edit Session, Edit Brief, Marker Chat, Edit Preference, Preference Video/DNA, Edit Level, build, lint, typecheck, and frontend-boundary regressions pass.
- Migration count and remote-mutation state are recorded after every gate.
- The final worktree is clean and no push/PR occurs without explicit approval.
- `productionReady` remains false until remote schema, RLS, tenancy, storage, service identity, provider, worker, observability, and release evidence pass.

## Completion Evidence

Gates 1–7 satisfy the required journey in the canonical backend-local system, including exact-version DNA approval, target-aware adaptation, downstream Project Edit Session/Edit Brief/Marker Chat/Plan Hint/QA use, reload, replacement, removal, immutable history, downstream invalidation, privacy, responsive browser behavior, and regression coverage. The implementation authority is recorded in `docs/edit-reference-gate-7-lifecycle-closure.md` and the append-only verification log.

This does not satisfy the separate production-readiness conditions above. Production database/RLS/cross-device authority, live media/provider skills, distributed workers, observability, and release evidence remain blocked or unverified.
