# Edit Preferences Architecture

Status: `implemented_current_private_scope`

Status date: 2026-07-13

This document is the terminology, UX, state-ownership, and planning-boundary source of truth for the implemented Edit Preferences experience. It describes the current private/local product boundary; it does not claim production Supabase durability, shared multi-device synchronization, live billing, provider execution, rendering, or credit mutation.

## Authoritative Terminology

`Preferences` and `Edit Preferences` are the same ReeditPro product feature.

- **Edit Preferences** is the user-facing name.
- `/preferences`, `PreferencesPage`, and other internal identifiers may retain the shorter technical name.
- Do not create separate products called General Preferences, Global Preferences, or Project Preferences.
- Account settings, billing, security, and internal testing are not Edit Preferences.

There is one Edit Preferences system with two scopes:

1. **Saved Edit Preferences** — reusable defaults copied into edits created later.
2. **Current Edit Preferences** — the effective values and explicit overrides owned by one exact named edit.

## Simple Product Model

- **Edit Brief:** What are we making?
- **Edit Preferences:** How should ReeditPro make it?
- **Chat:** How the user communicates current instructions, revisions, and questions.

## Implemented Product Boundary

### Saved Edit Preferences

The signed-in `/preferences` destination provides workspace-scoped defaults for:

- Edit level.
- Workflow type.
- Cleanup preference.
- Visual preference.
- Mood/style.
- Credit preference.
- Preferred target platform.
- Whether relevant defaults should begin confirmed for a new edit.

The page uses the user-facing name **Edit Preferences** and an explicit **Save defaults** action. It supports the current local-test and reviewed private-internal persistence boundary, draft preservation, unsaved-change protection, retry, refresh, discard, and save feedback.

Saved defaults do not mutate existing edits.

### Immutable creation baseline

When a named edit is created, `createEditSetupSnapshotFromPreferences` copies the seven effective preference values into that edit and records an immutable creation baseline containing:

- The copied values.
- A preference snapshot ID.
- The time the baseline was captured.
- The persistence source.
- Provenance (`saved_edit_preferences` for a new saved-default snapshot).

Later edits to Saved Edit Preferences do not move this baseline. “Use original” always means the values copied when this edit was created, not the latest values now stored on `/preferences`.

Older stored edits without the new baseline shape are recovered with a compatibility baseline derived from their existing setup values and marked with `legacy_edit_snapshot` provenance. This preserves deterministic reset behavior without pretending an older edit originated from the current saved-default record.

### Current Edit Preferences

An exact named edit now has a dedicated Current Edit Preferences workspace at the existing named-edit URL with:

```text
?view=preferences
```

This is query-addressable workspace state, not a new top-level route or a second preference product. The destination is available only when a real project and named edit are open.

The implemented current-edit fields are exactly:

- Edit level.
- Workflow type.
- Cleanup preference.
- Visual preference.
- Mood/style.
- Credit preference.
- Target platform.

The workspace groups these fields into editing approach, creative direction, and delivery/cost. Each field shows whether it still uses the original creation baseline or has been changed for this edit.

## Inheritance, Overrides, And Reset

The edit stores effective current values plus the keys that differ from the immutable creation baseline.

```text
Visual direction
Balanced
Uses original default
```

After a current-edit change:

```text
Visual direction
Graphics-forward
Changed for this edit
[Use original]
```

Implemented behavior:

- Editing a control creates a draft only; opening the workspace is non-mutating.
- **Apply to this edit** is explicit. There is no autosave of current-edit overrides.
- A no-op apply does not create a revision or invalidate planning.
- Applying changed values persists them to the exact user/workspace/project/edit UI handoff. Canonical plan save separately synchronizes those explicit values with the server-owned Exact Edit Preference authority described below.
- Override keys are derived by comparing effective values with the immutable baseline.
- The edit preference revision and update time advance after an applied change.
- **Use original** resets one field to its creation baseline.
- **Use all original defaults** resets every implemented field to that same baseline.
- Resetting does not read or adopt newly changed Saved Edit Preferences.

Draft navigation is protected. Attempting to switch to Chat or Edit Brief with unapplied changes presents a discard guard, and browser unload is guarded while the draft is dirty.

## Workspace Information Architecture

The named edit exposes a compact workspace switcher for:

1. **Chat** — the default and primary editor.
2. **Edit Brief** — the existing inline brief workspace when available.
3. **Edit Preferences** — the query-addressable exact-edit workspace.

Current route behavior:

- Chat uses the named-edit URL without a `view` query.
- Current Edit Preferences uses `?view=preferences` and can be restored by direct navigation or reload.
- Edit Brief remains the existing single inline brief experience; the header control focuses that same brief instead of creating a duplicate editable source of truth.
- Switching destinations does not create a new project or edit identity.

The preference workspace replaces the chat canvas while active. It is not rendered as another large card inside the conversation, and it does not compete with the chat composer.

## Planning And Invalidation Rules

All seven implemented current-edit fields are planning inputs. Applying any changed field requires a fresh edit plan and fresh estimate when a draft plan already exists.

The shared change resolver reports:

- Which fields changed.
- Whether a new plan is required.
- Whether a new estimate is required.
- Whether the draft plan must be cleared.
- Whether source preparation must be rerun.
- Whether output-frame confirmation must be repeated.

| Change | Plan consequence | Additional consequence |
| --- | --- | --- |
| Any implemented field | Recompile planning input; clear an existing draft plan and estimate | No generation or credit action starts |
| Cleanup preference | Same plan/estimate invalidation | Footage Prep/source cleanup must be completed again |
| Target platform | Same plan/estimate invalidation | Output frame/aspect ratio becomes unconfirmed and must be chosen again |

The persisted planning trace carries the effective current preferences, persistence source, override keys, and current preference revision. These values participate in the safe planning fingerprint rather than relying on raw chat text alone.

Applying a current-edit preference never:

- Approves a plan.
- Reserves, spends, releases, or refunds credits.
- Starts generation, a provider, a worker, rendering, or export.
- Silently preserves a stale draft plan or estimate.

## Approval And Revision Boundary

Current Edit Preferences are editable while the edit is still in its pre-approval planning flow.

Once the edit has an approved snapshot, credit reservation, active/private execution state, review state, completed internal state, or revision handoff state, the workspace becomes read-only. The UI preserves the approved snapshot and reservation trace and directs the user back to Chat for a revision request.

This prevents a form edit from mutating approved work in place. A meaningful post-approval change must enter the existing Chat-led revision/replanning flow and produce the appropriate new plan/version rather than rewriting the approved snapshot.

The backend may prepare that Chat-led replacement plan against a locked Exact Edit Preference record only when the canonical baseline, preference revision, effective values, and already verified source/frame evidence are identical. This is read-only authority reuse: the preference record revision does not advance. Any attempt to change locked source/frame evidence or preference values fails closed; the later replacement-plan publication still requires the exact unconsumed revision-decision authority and the next immutable plan version.

## Field Ownership

### Edit Brief owns factual and deliverable context

- Goal.
- Audience.
- Deliverable.
- Confirmed output frame/aspect ratio.
- Target duration.
- Source clips and source order.
- Reference and reference focus.
- Must-use information/assets.
- Avoidances and constraints.
- Project-specific notes.

Target platform currently appears in the implemented Edit Preferences fields because it expresses a preferred destination. Changing it deliberately invalidates frame confirmation; the confirmed output frame remains an approval-gated Brief/planning fact.

### Edit Preferences owns editing behavior

The seven fields above are implemented now. The broader product ontology may later add pacing, caption behavior, transition restraint, Real Motion preference, music/SFX direction, ducking, or review behavior, but those must not be presented as implemented current-edit controls until their types, persistence, planning consequences, and tests exist.

### Chat owns explicit current instruction

Chat may request a preference or Brief change, but raw chat text is not an alternate preference database. The instruction must be compiled into structured intent and persisted through the relevant edit/revision flow.

For soft editing behavior, precedence is:

1. Explicit current Chat instruction.
2. Current Edit Preferences override.
3. The edit's immutable creation baseline copied from Saved Edit Preferences.

Safety, platform, tier, frame, provider, credit, and approved-snapshot rules remain higher-order constraints.

## Persistence Boundary

- Saved Edit Preferences use the existing saved-default repository/API boundary.
- Current Edit Preferences continue to ride the exact-edit local/private UI handoff record for visible editing and reload behavior.
- Creating or saving an internal named-edit state idempotently initializes a separate server-owned Exact Edit Preference authority for that owner/workspace/project/edit. Its immutable baseline is copied from the saved workspace defaults when present, or from the reviewed server defaults otherwise.
- Before a canonical handoff is prepared, the browser reads that exact authority through the authenticated frontend-safe route, applies only explicit current-edit differences with optimistic revision matching and a deterministic idempotency key, and rebuilds the canonical plan components with the returned baseline snapshot ID and preference revision. Foreign identity, malformed authority, unknown fields, a locked-record write, or an unresolved write fails closed. A Chat-led replacement handoff may reuse a locked record only through the exact read-only evidence rule above.
- After finalized source authority has been verified, the backend derives source-preparation and output-frame confirmation evidence from the exact canonical components and promotes that evidence into the same Exact Edit Preference authority. The browser cannot author those evidence hashes or confirmation IDs.
- The creation baseline, effective values, override keys, preference revision, authority record revision, and planning evidence remain tenant/project/edit scoped.
- These are local/private authenticated routes and files, not a new production database table or public production API.
- This is sufficient for the current local/private recovery and test boundary.
- It is not proof of production multi-device durability, live Supabase migrations/RLS, conflict resolution, or shared collaborative editing.

## Internal Testing Placement

Supabase readiness, API health, upload/project route probes, runtime configuration, and connection diagnostics are not Edit Preferences.

The existing internal-testing disclosure is absent from normal UI and navigation. It is rendered only in development or the E2E environment when the explicit `internalTesting=1` query is present. Normal users see Saved Edit Preferences without diagnostic architecture leakage.

If a real connection problem blocks user work, normal product UI may show one compact actionable error and route authorized developers to the gated diagnostic surface.

## Current Test Evidence

Focused Playwright coverage verifies:

- The canonical `/preferences` route renders the seven-field Saved Edit Preferences form, while `/edit-preferences` redirects to the same destination.
- Saved-default drafts survive failed writes, refresh, retry, sidebar navigation, sign-out guards, and signed-in reload recovery without crossing identity/workspace scope.
- A new edit receives its saved creation baseline.
- The exact-edit preference destination is query-addressable.
- A current-edit field can be overridden and recovered after reload.
- Dirty navigation is guarded.
- One field can be reset to the immutable creation baseline.
- Override metadata and revision persist.
- A cleanup change clears a draft plan/estimate and requires Footage Prep again.
- Approved work—including a freshly recorded or recovered canonical snapshot—makes Edit Preferences read-only.
- Returning to Chat preserves the approved snapshot and reservation trace.

Existing saved-preference coverage continues to verify workspace-scoped default load/save behavior and the new-edit snapshot bridge.

The focused Saved/Current preference matrix currently passes 12 route, persistence, inheritance, override, invalidation, and approval-lock browser tests. Guarded local visual review also passes at 1024px and 1440px with no console errors. This is bounded private/internal evidence, not whole-product or production-durability signoff.

Focused backend smokes additionally verify server-side initialization, exact frontend read/update synchronization, optimistic revision and idempotency behavior, canonical baseline/revision binding, derived source/frame evidence promotion, read-only locked-evidence reuse for an authorized revision flow, rejection of locked-evidence replacement, replay, malformed-response rejection, and tenant isolation. None of this evidence approves a plan or starts credit, tool, provider, worker, render, or delivery activity.

## Remaining Production And Product Work

- Prove exact-edit baseline/override durability in the future production database and tenancy/RLS boundary.
- Define stale-write/concurrent-editor behavior before collaborative or multi-device editing.
- Define user-visible preference history if the product needs more than the current revision/audit metadata.
- Add broader current-edit controls only with explicit field ownership, planning consequences, persistence, and focused tests.
- Keep all generation, provider, worker, render, export, and credit execution behind the existing plan/estimate approval boundary.
