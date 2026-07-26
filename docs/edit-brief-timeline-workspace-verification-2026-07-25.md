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
- The **Edit Brief** destination remains present from the start of every named
  edit. Before source preparation it owns the same full workspace and shows one
  clear return-to-Chat preparation gate instead of disappearing from navigation.
- Edit Brief removes the floating Chat composer and preview/status rail so the
  private player, marker timeline, and marker inspector have the full working
  width.
- The mounted Chat thread remains in memory for continuity but is visually
  hidden while Edit Brief is active, so prior messages cannot push the timeline
  below the fold.
- The source timeline is the primary surface. Overall goal, audience, style,
  assets, references, and delivery constraints remain available in a collapsed
  secondary disclosure.
- A point or range marker may be drafted before an overall goal. The canonical
  aggregate supports marker-first revision `0`; creating the first marker also
  starts the optional local Brief state.
- Marker editing, confirmation, archival, and Marker Chat follow-up remain
  usable when the user intentionally supplies timeline direction without an
  overall written Brief. None of those actions fabricate a Brief record.
- Markers that share or visually overlap the same moment are deterministically
  packed into separate 44-pixel rows. The lane grows with the row count instead
  of covering one instruction with another.
- Entering the workspace focuses its labeled region without focusing a text
  field or hiding the workspace heading and Back-to-Chat action, including the
  source-preparation gate on first entry.
- Chat messages and the planning controller stay mounted while the Brief
  presentation is active. Switching views therefore cannot fabricate a new
  planning context, silently unlock an approved Brief, or lose the current
  plan.
- Changing an unapproved Brief invalidates the prior plan and approval state,
  retains the saved Brief, and keeps a visible fresh-plan / fresh-credit-
  approval notice in the Brief workspace until a replacement plan is created.
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
  Brief, source-gated entry, workspace focus, visually hidden Chat history,
  reload, plan creation, approval lock, Brief-change invalidation, revised plan,
  and private review. The exact suite passed 20/20.
- `tests/e2e/edit-reference-canonical-real-file-flow.spec.ts`: the exact
  Edit Reference application flow still saves the Brief direction and
  completes apply, replace, reload, and remove response-loss recovery.
- `server/smoke/edit-brief-authority-smoke.ts`: point/range marker lifecycle,
  marker-first aggregate creation, CAS, durable idempotency, audit, QA,
  planning binding, tenant isolation, restart recovery, approval lock, and the
  process-branded private-workspace runtime's non-promotable boundary.
- `server/smoke/editor-full-stack-private-review-smoke.ts`: signed-in marker-
  first create/confirm, repeat same-time creation, non-overlapping row layout,
  archival history, Brief-driven plan invalidation/republication, eight private
  sources, one 4K approval, 27 canonical work items/jobs, and authenticated
  readback of the 16-second 3840×2160 private review.
- `server/smoke/canonical-product-ui-integration-readiness-smoke.ts`: strict
  source admission recognizes the three active named-edit workspace views.

## Local runtime boundary

The standard loopback private-workspace launcher now injects one process-branded
Edit Brief runtime port. It reuses the existing symlink-safe private authority
store and is accepted only when all of the following remain exact:

- non-production local API mode;
- mock worker and local storage modes;
- the server-authenticated local test user, with no bearer credential;
- one loopback host and one private authority store;
- no remote, multi-replica, provider, worker, billing, deployment, or
  production authority.

Environment flags or a structurally identical caller object cannot mint this
capability. Hosted absence, a forged port, a bearer user on the local-only port,
or any production mode continues to fail before repository access.

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
