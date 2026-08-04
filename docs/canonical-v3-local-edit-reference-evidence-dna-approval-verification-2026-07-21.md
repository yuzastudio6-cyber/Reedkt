# Canonical V3 local Edit Reference evidence, DNA, QA, and approval verification

Date: 2026-07-21
Scope: isolated local Supabase reset and mounted local browser only
Production authority: false

## Outcome

The canonical V3 local chain now persists the complete deterministic
Edit Preference lifecycle behind the existing authenticated ReEditPro HTTP
surface:

1. create or reopen a library preference;
2. save exact Study Chat direction as evidence;
3. run the bounded manual-evidence study;
4. synthesize immutable Preference DNA;
5. persist the DNA QA result;
6. approve the exact DNA/QA pair with explicit adapt-not-copy and QA-review
   acknowledgements;
7. recover the committed result through the original idempotency key when the
   HTTP response is lost;
8. save a later correction, supersede the prior reusable version without
   mutating its content or approval history, and create a new approval; and
9. reload the browser and restore the same signed-in workspace state.

Migration
`202607210009_edit_reference_domain_evidence_dna_approval_rpcs.sql` adds the
forward-only V2 command/read contract and an append-only DNA lifecycle-event
ledger. Existing V1 commands remain delegated through their original
transaction. A new server-only idempotency lookup is performed before any
prepared result is recomputed. Browser-shaped prepared payloads are rejected
by the TypeScript boundary and the service-role credential remains inside the
loopback backend closure.

## Evidence

The deterministic reset suite proves:

- clean migrations `001` through `009`;
- two-user/two-workspace authenticated RLS isolation;
- authenticated roles cannot execute service-role domain mutation/read RPCs
  or write lifecycle tables directly;
- exact replay returns the original receipt and changed replay conflicts;
- a blocked retry and unsupported media/provider branch perform no mutation;
- approved DNA content and lifecycle history cannot be updated or deleted;
- Study Chat correction supersedes the old reusable version while preserving
  immutable approval and audit history;
- direct service, mounted HTTP, restart readback, and mounted Chromium all use
  the same canonical repository port; and
- browser approval response loss performs readback recovery rather than a
  duplicate mutation.

The browser proof uses a locally signed authenticated JWT for a user created
through the isolated local Auth admin endpoint. The JWT is placed only in the
browser's local Supabase session storage; the service-role key is never passed
to the browser, a response, or a log. The project workspace bootstrap accepts
both legacy membership rows with an `id` and the canonical composite
`(workspace_id, user_id)` membership key.

## Honest boundary

The deterministic no-provider QA result is `requires_user_review`. The user
may explicitly approve that reusable guidance, but the existing exact-edit
application-preparation SQL still requires a `passed` QA result. This proof
does not weaken that gate or claim that deterministic fallback guidance is
currently eligible for target application.

Reference-video study remains fail-closed in this repository lane until the
canonical pre-plan study-result commit adapter can persist real media/visual
evidence through the shared worker/checkpoint/cost spine. Kimi K3 provider
reasoning, Qwen fallbacks, Qwen2.5-VL visual execution, remote Supabase,
deployed Auth/RLS/Storage, billing, customer credits, rendering, deployment,
and public delivery were not activated or tested here.
