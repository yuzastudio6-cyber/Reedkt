# Production Readiness Blocker Policy

Hard blockers include missing required launch-core tools, missing or blocked model weights, non-commercial or unknown model-weight licenses, evaluation-only production execution, GPU tools assigned to non-GPU workers, Revideo production execution, signed URL source-of-truth violations, raw prompt execution paths, secrets in config/scripts, and missing approved-snapshot enforcement.

Warnings include optional tools missing, future-only tools not installed, OpenImageIO/OpenColorIO runtime/media approval pending, FFmpeg LGPL commercial verification pending, libass pending manual verification, source-install review required, and host tools missing in static mode.

Hard blockers must be actionable and evidence-driven. A blocker record should identify the exact missing proof or approval, preserve the safety gate it protects, and point to the next bounded source review, install proof, local execution proof, diagnostics packet, deployment proof, or QA packet that can retire it. Blocker labels must not be used as intentional blanket freezes for unrelated safe progress.

Blocked means "do not perform the unsafe action yet"; it does not mean "stop reducing the blocker." Safe metadata, source review, local-only proofs, safe blocker-reduction previews, diagnostics, mock-safe backend skeletons, deployment preflights, owner approvals, QA packets, and rollback plans should continue when they can shrink or retire a named blocker without claiming beta, production, billing, provider, Supabase, storage, or product readiness early.

Intentional blanket blockers are invalid source truth. If a report says something is blocked but cannot name the exact unsafe action, the missing evidence, and the next safe forward lane, the report itself is incomplete. Fix the blocker metadata first, then continue the smallest safe review/proof/QA/planning lane that reduces the blocker without opening the protected runtime gate.

Readiness and operator reports should expose the split in machine-readable form. The blocked action scope should name the exact unsafe action that is closed, while allowed forward-progress scopes should name the safe source review, local dependency proof, bounded command/import proof, preview, diagnostics, deployment preflight, owner approval, monitoring, support, or rollback lane that can continue.

Production hardening reports must carry the same contract as the beta tool blocker ledger:

- `blockerForwardProgressPolicy.intentionalBlanketBlocksAllowed: false`
- `blockerForwardProgressPolicy.blockerScope: named_unsafe_action_only`
- `blockerForwardProgressPolicy.safeForwardProgressRequired: true`
- `blockerForwardProgressPolicy.nextSafeActionRequiredForBlockers: true`
- `safeBlockerReductionAllowed: true`
- `blockedActionScope`, limited to the unsafe launch/runtime/delivery actions still closed.
- `allowedForwardProgressScopes`, listing safe source review, local proof, diagnostics, QA, deployment preflight, owner approval, security/privacy review, and rollback/monitoring/support planning lanes.

If a future blocker says beta or production is blocked but omits this split, treat the report as incomplete. Repair the blocker metadata first, then keep reducing the named blocker through the smallest safe lane. Do not use the missing metadata as a reason to stop all safe work.

`npm run smoke:scoped-blocker-forward-progress-policy` is the focused regression check for this contract. It validates the tool beta readiness report, blocker ledger, backend operator status, and production hardening report against one shared source-level policy: `intentionalBlanketBlocksAllowed: false`, `safeBlockerReductionAllowed: true`, named blocked action scopes, and named allowed forward-progress scopes. If the smoke fails, fix the blocker metadata or safe-lane mapping before adding new readiness blockers.

Workers execute approved plan snapshots and private artifact references. Raw chat, signed URLs, and evaluation-only tools cannot become production execution inputs.
