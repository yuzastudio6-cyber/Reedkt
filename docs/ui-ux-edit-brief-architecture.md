# Edit Brief Architecture

Status: `implemented_exact_edit_private_scope`

Status date: 2026-07-13

This document is the UX, state-ownership, persistence, planning-transfer, and approval-boundary source of truth for the current Edit Brief. It describes the reviewed local/private product boundary. It does not claim production Supabase durability, shared multi-device synchronization, provider execution, rendering, public delivery, or live credit settlement.

## Product Role

- **Edit Brief:** what this exact edit is and must accomplish.
- **Edit Preferences:** how ReeditPro should edit it.
- **Chat:** how the user supplies current instructions, questions, and revisions.

The Edit Brief is optional because a strong chat prompt may already contain enough factual direction. It becomes available after Footage Prep, remains inside the named edit, and is reached through the compact `Edit Brief` header action. That action focuses the single existing inline workspace; it does not create a second editable drawer, route, or source of truth.

## Implemented Brief Fields

The current structured brief can carry:

- Goal.
- Audience.
- Deliverable.
- Platform.
- Aspect ratio.
- Target duration.
- Required source asset ids.
- Optional source asset ids.
- Must-include notes.
- Avoid notes.
- User-provided reference URLs.
- Additional notes.
- Status: `not_started`, `draft`, or `ready`.

Reference URLs are planning metadata only. The UI and parser do not fetch them, call an external provider, or treat them as approved assets.

## UX States

### Optional

The brief has not been materially edited. Opening it is non-mutating and focuses the first useful control.

### Draft

The user has supplied structured direction that is not yet marked ready. Changes persist with the exact edit and visibly invalidate a stale draft plan or approval state when the planning consequence requires it.

### Ready

The structured direction is ready to join chat, source, setup, and preference inputs in the planning context. Ready does not approve the plan, reserve credits, or start generation.

### Locked

Once the edit has an approved snapshot, reservation trace, active/private execution state, private review state, completed internal state, or revision handoff state, the Brief becomes read-only. The UI explains that approved direction is frozen and sends requested changes back through Chat and replanning rather than mutating the approved snapshot in place.

## Exact-Edit Persistence

The full `EditBriefState` persists through the existing scoped `LocalInternalProjectHandoff` for the exact user, workspace, project, and edit identity.

- `parseEditBriefStateForHandoff` validates and canonicalizes restored data.
- Project/workspace mismatches are rejected instead of being silently adopted.
- Every typed operation updates the state revision and activity list.
- Reloading the exact named edit restores goal, status, source selections, notes, and reference URLs after Footage Prep exposes the workspace again.
- The persistence path reuses the existing reviewed local/private handoff and backend sync seam. It does not add a new public endpoint, preference table, Supabase migration, RLS policy, or production storage claim.

## Planning And Approval Transfer

Planning transfer is complete for the current typed fields:

1. The exact-edit Brief state is converted into `PlanningBriefInput`.
2. Goal, audience, deliverable, platform, aspect ratio, duration, source selections, must-include notes, avoid notes, reference URLs, and additional notes reach `PlanningContext`.
3. The mock-safe plan builder includes the full Brief direction in its deterministic context and completeness count.
4. Approval deep-copies that `PlanningBriefInput` into `ApprovedPlanSnapshot.editBriefSnapshot`.
5. Later mutable state cannot alter the frozen snapshot arrays or approved Brief evidence.

Workers must eventually execute the approved snapshot, not reread mutable Brief UI state or raw chat. This slice prepares that immutable handoff but does not authorize provider, worker, render, or credit execution.

## Interaction And Accessibility Rules

- Keep the Brief inside one focused inline workspace rather than a card wall.
- Preserve the compact Optional/Draft/Ready status in the editor header.
- Use a flat, sectioned field hierarchy so the brief reads as one professional planning surface rather than a stack of competing cards.
- Keep planning-impact and approval-lock notices visually distinct without using oversized warning containers.
- Labels and helper copy must distinguish factual Brief direction from editing-behavior preferences.
- All editable controls live inside a semantic fieldset so the approved state can be locked consistently.
- The lock notice remains readable outside the disabled fieldset.
- Keyboard focus, readable labels, restrained status color, and composer clearance remain part of route-level QA.
- The summary grid may use two columns when space allows, but it must collapse to one column at compact width and remain free of horizontal overflow.

## Current Evidence

- The focused editor suite passes 20/20 checks. Edit Brief coverage includes upload, setup, open/focus, edit, ready status, exact-edit persistence, reload recovery, plan creation, approval, lock notice, disabled fields, computed layout hierarchy, no internal provider names, composer alignment, and horizontal overflow.
- `tests/e2e/viewport.spec.ts` passes 59/59 checks, and the clean-shell/keyboard/zoom group passes 9/9.
- `smoke:planning-input-safety` covers full handoff round trip, full Planning Context transfer, and immutable approved-snapshot capture.
- Guarded local browser review passed at 1024px and 1280px with the responsive conversation/preview composition, bounded upload gate, no horizontal overflow, and no console errors.
- Frontend TypeScript, targeted ESLint, frontend/server boundary, and production build pass for this slice.

## Remaining Production Boundaries

- No durable Supabase Brief record or RLS policy is implemented.
- No cross-device conflict resolution or collaboration model is implemented.
- No provider or worker reads this data outside the existing approved/private test boundary.
- Source changes may require a later dedicated stale-asset review UX when selected source ids no longer exist.
- Real execution must remain blocked until approved snapshot, credit, worker, storage, security, and deployment evidence gates pass.
