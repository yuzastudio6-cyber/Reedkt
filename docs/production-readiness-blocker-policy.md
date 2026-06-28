# Production Readiness Blocker Policy

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
