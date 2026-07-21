# Edit Reference Study mutation response reconciliation

Date: 2026-07-20  
Status: mounted local/private evidence; hosted production authority remains gated

## Outcome

The canonical Edit Preference Study workspace now keeps one stable request identity across uncertain browser outcomes for:

- creating a named Edit Preference;
- saving Study Chat direction or a correction;
- running the evidence study;
- synthesizing a Preference DNA candidate;
- running Preference DNA quality review; and
- saving the explicit whole-video study review.

The browser does not report an interrupted mutation as successful merely because a nearby record exists. It reads the exact Edit Reference or whole-video review package and advances only when immutable identity, revision, result, and receipt evidence prove that the requested operation committed.

## Exact reconciliation rules

Study Chat requires one user message with the deterministic client-message identity, exact content, the paired assistant result, and the exact superseded evidence when the message is a correction.

Evidence study requires the same Edit Reference and Study, a later revision, one new orchestration, new skill-run identities, a new assistant result, and matching Study/reference evidence state.

DNA synthesis requires the same Edit Reference and Study, a later revision, the next immutable DNA version, review-required state, evidence revision lineage, adapt-not-copy boundary, and valid evidence/content digests.

DNA quality review requires the exact DNA identity and content digest, its linked new QA result, matching QA status, and a later Study revision.

Whole-video review requires the same review package and digest, exact decision set, later Study revision, selected state, and a durable selection-receipt identity. If that review is confirmed but the general Edit Reference refresh fails, the UI truthfully preserves the saved review and asks the user to refresh before continuing.

The create dialog retains one request identity for its lifetime. A retry in that same dialog therefore reuses the same domain request instead of creating a second named preference after an unknown response, while a deliberately opened new dialog still receives a new identity.

## Mounted proof

The canonical Chromium browser journey deliberately lets the local/private server commit and then drops each HTTP response for Study Chat, evidence study, DNA synthesis, and DNA quality review. The mounted `/preferences` workspace reads back each exact result, advances through the real state machine, and issues one mutation per action.

The long-form review browser journey first proves a normal retryable failure keeps every in-page choice, then simulates a committed save with a lost response. Exact review readback moves the same mounted panel to **Review saved** without issuing another mutation, creating Preference DNA, or applying guidance.

Focused evidence:

- canonical mounted browser/backend suite: 8/8 passed, including create, upload, Study, DNA, approval, and exact-edit application response-loss recovery;
- long-form review browser suite: 2/2 passed;
- long-form review service smoke: passed with durable selection recovery and tenant isolation;
- strict canonical product-UI source gate: 11/11 passed;
- production application-lifecycle and exact-edit transaction contract smokes: passed with `productionReady=false`;
- production frontend build: passed;
- server typecheck and full ESLint: passed;
- frontend/server boundary: passed for 855 files;
- secret scan: passed for 4,812 files with no printed secret values.

## Honest remaining boundary

This is browser-to-local/private-server recovery evidence. It does not supply live Supabase/Auth/RLS persistence, a deployed durable idempotency repository, hosted long-form workers, provider execution, customer pricing/credits, or public delivery. The V5 pre-plan study persistence contract, hosted long-form runtime port, distributed pre-plan study state port, and production application/planning contracts must still receive reviewed live adapters and same-SHA staging evidence before production readiness can become true.

No provider, cloud, Supabase, SQL, billing, deployment, public-delivery, or production-readiness gate is activated by this change.
