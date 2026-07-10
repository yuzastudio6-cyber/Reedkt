# Production Readiness Blocker Policy

Hard blockers include missing required launch-core tools, missing or blocked model weights, non-commercial or unknown model-weight licenses, evaluation-only production execution, GPU tools assigned to non-GPU workers, Revideo production execution, signed URL source-of-truth violations, raw prompt execution paths, secrets in config/scripts, and missing approved-snapshot enforcement.

Warnings include optional tools missing, future-only tools not installed, OpenImageIO/OpenColorIO runtime/media approval pending, FFmpeg LGPL commercial verification pending, libass pending manual verification, source-install review required, and host tools missing in static mode.

Hard blockers must be actionable and evidence-driven. A blocker record should identify the exact missing proof or approval, preserve the safety gate it protects, and point to the next bounded source review, install proof, local execution proof, diagnostics packet, deployment proof, or QA packet that can retire it. Blocker labels must not be used as intentional blanket freezes for unrelated safe progress.

Blocked means "do not perform the unsafe action yet"; it does not mean "stop reducing the blocker." Safe metadata, source review, local-only proofs, safe blocker-reduction previews, diagnostics, mock-safe backend skeletons, deployment preflights, owner approvals, QA packets, and rollback plans should continue when they can shrink or retire a named blocker without claiming beta, production, billing, provider, Supabase, storage, or product readiness early.

Intentional blanket blockers are invalid source truth. If a report says something is blocked but cannot name the exact unsafe action, the missing evidence, and the next safe forward lane, the report itself is incomplete. Fix the blocker metadata first, then continue the smallest safe review/proof/QA/planning lane that reduces the blocker without opening the protected runtime gate.

Readiness and operator reports should expose the split in machine-readable form. The blocked action scope should name the exact unsafe action that is closed, while allowed forward-progress scopes should name the safe source review, local dependency proof, bounded command/import proof, preview, diagnostics, deployment preflight, owner approval, monitoring, support, or rollback lane that can continue.

Workers execute approved plan snapshots and private artifact references. Raw chat, signed URLs, and evaluation-only tools cannot become production execution inputs.

Production, beta, provider, billing, Supabase, storage, worker, media, and credit gates protect unsafe actions. They must not be used as blanket blockers for unrelated safe progress.

## Hard Rule

Intentional blanket blockers are not allowed.

Blockers are scoped guardrails, not global stop signs. A valid blocker
blocks only the unsafe action it names; it must not intentionally freeze unrelated safe work,
including source review, planning, diagnostics, QA, owner approval, deployment
preflight, monitoring, rollback, or mock-safe implementation work that can
reduce the blocker while preserving the gate.

A valid blocker must name:

- the exact unsafe action that remains blocked;
- the missing proof, approval, deployment, license, persistence, owner decision, runtime evidence, or QA evidence;
- the next smallest safe lane that can reduce or retire the blocker without bypassing the gate.

If any blocker report omits those details, the blocker report is incomplete.
Repair the blocker metadata first, then continue the smallest safe review,
proof, planning, diagnostics, QA, owner-approval, preflight, rollback,
monitoring, or mock-safe implementation lane. The missing metadata is not a
valid reason to stop all safe work.

## Allowed Safe Progress

Blocked means "do not perform the unsafe action yet." It does not mean "stop reducing the blocker."

Forward progress is required when a safe lane exists. Agents and automation
should choose the smallest useful lane that shrinks the evidence gap, records
the remaining unsafe-action boundary, and leaves unrelated scopes untouched.

Safe blocker-reduction lanes include:

- source review and owner/source classification;
- local dependency install proof;
- bounded command, import, or container proof;
- mock-safe backend skeletons;
- diagnostics and QA packets;
- deployment preflight and read-only prerequisite audit;
- scoped owner/environment remediation when explicitly approved;
- owner-approval packet collection;
- rollback, monitoring, incident-response, and support planning.

These lanes may move forward only when they preserve the gate they are reducing. They must not claim beta readiness, production readiness, billing readiness, provider readiness, storage readiness, runtime readiness, or product-ready status before the named evidence exists.

## Machine-Readable Contract

Readiness and blocker reports should expose the distinction between blocked unsafe actions and allowed safe work:

- `intentionalBlanketBlocksAllowed: false`
- `safeBlockerReductionAllowed: true`
- `blockerScopeType: "unsafe_action_only"`
- `mustContinueSafeProgressWhenAvailable: true`
- `blockedDoesNotMeanStopAllWork: true`
- `blockedActionScope`, limited to the unsafe launch, runtime, billing, storage, provider, worker, media, or delivery action that remains closed
- `allowedForwardProgressScopes`, listing the safe review/proof/diagnostics/QA/preflight/approval/planning lanes that may continue
- `nextSafeAction`, naming the next smallest useful step

Missing scoped-forward-progress metadata is a metadata defect, not a reason to
stop all safe work.

## Preserved Safety Gates

This policy does not weaken ReeditPro's approval or production gates:

- no expensive generation, rendering, editing, provider calls, workers, or media processing before approved plan and credit estimate gates;
- no live billing, wallet mutation, Stripe operation, Supabase write, migration, GCS write, signed URL, beta launch, or production launch without the required owner-approved evidence;
- no product-ready local OSS claim without accepted runtime, QA, monitoring, rollback, and owner evidence;
- no secrets, raw prompts, private media, public artifacts, or signed URLs in blocker evidence.

The rule is forward motion with guardrails: keep the unsafe action blocked, but keep shrinking the blocker.
