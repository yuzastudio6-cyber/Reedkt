# Edit Brief Architecture

Status: `implemented_exact_edit_private_scope`

Status date: 2026-07-26

This document is the UX, state-ownership, persistence, planning-transfer, and approval-boundary source of truth for the current Edit Brief. It describes the reviewed local/private product boundary. It does not claim production Supabase durability, shared multi-device synchronization, provider execution, rendering, public delivery, or live credit settlement.

## Product Role

- **Edit Brief:** what this exact edit is and must accomplish.
- **Edit Preferences:** how ReeditPro should edit it.
- **Chat:** how the user supplies current instructions, questions, and revisions.

The Edit Brief is optional because a strong chat prompt may already contain enough factual direction. It becomes available after Footage Prep, remains inside the named edit, and is reached through the compact `Edit Brief` workspace option beside Chat and Edit Preferences. The exact named-edit route uses `?view=brief` only to recover the selected workspace on navigation or reload; it does not create a second Brief route, record, or source of truth.

## Professional Workspace Presentation

When selected, Edit Brief owns the named edit's full main workspace. Chat messages, the floating Chat composer, and the secondary preview/status rail are hidden while the same exact-edit identity remains mounted.

- The existing compact project/workspace switcher is the only page-level heading and navigation chrome.
- Do not repeat the edit name, “Edit Brief workspace,” or explanatory hero headers inside the Brief canvas.
- Source preview, professional timeline, and collapsed Brief constraints form one continuous editing desk rather than three competing cards.
- The timeline presents a time ruler, cyan playhead, source clips, dedicated direction track, marker ranges, horizontal zoom/scroll, and explicit track labels.
- Clicking the timeline moves the playhead. Double-clicking an empty timeline moment, or choosing `Add direction`, opens the same playhead-anchored popover.
- The popover's primary control is one plain-language prompt: `What should happen here?` Ctrl/Command + Enter submits it through the same canonical marker save path as the visible action.
- Type, priority, point/range timing, and optional short label stay under a collapsed `More options` disclosure. They must not make the default marker interaction feel like completing a form.
- Existing directions reopen through the same popover. Escape closes it and returns focus to `Add direction`.
- Overall goal, audience, assets, style, and delivery constraints remain available in one collapsed secondary disclosure below the timeline.
- The Brief remains optional and planning-only. Opening, previewing, scrubbing, or drafting a direction does not approve a plan, reserve credits, call a provider, run a worker, or start rendering.

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

- Keep the Brief inside one full-space named-edit workspace rather than a chat card, permanent inspector form, drawer, or card wall.
- Preserve the compact Optional/Draft/Ready status in the editor header.
- Let preview and timeline use the available canvas. Keep structured Brief fields secondary and collapsed until requested.
- Make marker entry prompt-first through the playhead popover; advanced metadata is progressive disclosure.
- Preserve professional timeline efficiency: click seeks, double-click opens a direction at that moment, Ctrl/Command + Enter saves, and Escape closes without saving and returns focus.
- Use a flat, sectioned field hierarchy for expanded overall direction so it reads as one planning surface rather than a stack of competing cards.
- Keep planning-impact and approval-lock notices visually distinct without using oversized warning containers.
- Labels and helper copy must distinguish factual Brief direction from editing-behavior preferences.
- All editable controls live inside a semantic fieldset so the approved state can be locked consistently.
- The lock notice remains readable outside the disabled fieldset.
- Keyboard focus, Escape/focus return, 44px targets, readable labels, restrained status color, timeline zoom/scroll, and horizontal-overflow safety remain part of route-level QA.
- The summary grid may use two columns when space allows, but it must collapse to one column at compact width and remain free of horizontal overflow.

## Current Evidence

- The editor and keyboard suites pass 24/24 checks. Edit Brief coverage includes upload, setup, full-space open/focus, local preview, unchanged timeline height under the floating prompt, prompt-first direction entry, advanced-option disclosure, Escape/focus return, ready status, exact-edit persistence, reload recovery, plan creation, approval, lock notice, disabled fields, no internal provider names, and horizontal overflow.
- `tests/e2e/viewport.spec.ts` passes 64/64 checks. The focused Brief journey additionally exercises its preview, timeline, and popover at 375px, 768px, 1024px, and 1440px.
- `smoke:edit-brief-authority` covers exact-session point/range markers, lifecycle, CAS/idempotency, tenant isolation, restart recovery, source/frame/QA/plan-hint preparation, approval locking, and fail-closed production selection.
- `smoke:planning-input-safety` covers full handoff round trip, full Planning Context transfer, and immutable approved-snapshot capture.
- The focused Edit Brief browser journey covers the continuous editing-desk geometry and bounded marker prompt at 375px, 768px, 1024px, and 1440px, including the honest fail-closed mock marker boundary.
- Guarded connected-private visual review confirms a 64px compact Brief header at 768px and 1024px, one H1, no horizontal overflow, exact timeline anchoring, Ctrl+Enter canonical save, focus return, and cleanup through the same marker lifecycle authority.
- App/server TypeScript, full ESLint, frontend/server boundary, repository secret scan, production build, and diff-integrity checks pass for this slice.

## Remaining Production Boundaries

- No durable Supabase Brief record or RLS policy is implemented.
- No cross-device conflict resolution or collaboration model is implemented.
- No provider or worker reads this data outside the existing approved/private test boundary.
- Source changes may require a later dedicated stale-asset review UX when selected source ids no longer exist.
- Real execution must remain blocked until approved snapshot, credit, worker, storage, security, and deployment evidence gates pass.
