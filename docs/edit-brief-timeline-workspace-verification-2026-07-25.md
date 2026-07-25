# Edit Brief timeline workspace verification — 2026-07-25

## Outcome

The active named-edit route now treats Edit Brief as a dedicated professional
subworkspace instead of an expanded form inside Edit Chat:

`/projects/:projectId/edits/:editSessionId?view=brief`

The route still owns one named edit and one planning flow. `view=brief` selects
presentation only; it does not create another brief, planner, approval,
snapshot, timing, estimate, queue, provider, tool, cost, render, or delivery
authority.

## Product behavior

- The editor header switches among **Chat**, **Edit Brief**, and
  **Edit Preferences** without changing the named-edit identity.
- Edit Brief removes the floating Chat composer and preview/status rail so the
  private player, marker timeline, and marker inspector have the full working
  width.
- The source timeline is the primary surface. Overall goal, audience, style,
  assets, references, and delivery constraints remain available in a collapsed
  secondary disclosure.
- A point or range marker may be drafted before an overall goal. The canonical
  aggregate supports marker-first revision `0`; creating the first marker also
  starts the optional local Brief state.
- Entering the workspace focuses its labeled region without focusing a text
  field or hiding the workspace heading and Back-to-Chat action.
- Chat messages and the planning controller stay mounted while the Brief
  presentation is active. Switching views therefore cannot fabricate a new
  planning context, silently unlock an approved Brief, or lose the current
  plan.
- Changing an unapproved Brief invalidates the prior plan and approval state,
  retains the saved Brief, and directs the user to create a fresh plan.
- Once the exact plan is approved, the Brief remains visible but locked.
- Reopening the same private source for browser playback does not upload,
  replace, edit, charge for, or publish the source.

## Responsive and accessibility evidence

The mounted browser proof covers 375, 768, 1024, and 1440 pixel widths:

- no horizontal overflow;
- one-column player/inspector layout through 1040 pixels;
- two-column professional layout above 1040 pixels;
- 44-pixel Back-to-Chat target;
- one labeled workspace region instead of a chat-log role;
- collapsed secondary direction is keyboard-operable;
- the Chat composer and preview rail are absent while the Brief is active.

## Authority and regression evidence

- `tests/e2e/editor.spec.ts`: full ordinary editor suite, including optional
  Brief, marker-first entry, reload, plan creation, approval lock, Brief-change
  invalidation, revised plan, and private review.
- `tests/e2e/edit-reference-canonical-real-file-flow.spec.ts`: the exact
  Edit Reference application flow still saves the Brief direction and
  completes apply, replace, reload, and remove response-loss recovery.
- `server/smoke/edit-brief-authority-smoke.ts`: point/range marker lifecycle,
  marker-first aggregate creation, CAS, durable idempotency, audit, QA,
  planning binding, tenant isolation, restart recovery, and approval lock.
- `server/smoke/canonical-product-ui-integration-readiness-smoke.ts`: strict
  source admission recognizes the three active named-edit workspace views.

## Honest closed gates

The controlled local browser and private repository proofs are not production
qualification. The hosted public Edit Brief route remains fail-closed until
same-release evidence exists for tenant-bound durable persistence, two-user /
two-workspace RLS, exact edit-session foreign keys, atomic compare-and-swap
RPCs, approval-lock transaction coupling, and durable idempotency/audit.

Marker attachment upload remains closed until finalized private
storage/media-asset lineage can be re-read server-side. No remote Supabase,
provider, Google Secret Manager, cloud worker, billing, deployment, public
delivery, or production-readiness action is performed by this slice.
