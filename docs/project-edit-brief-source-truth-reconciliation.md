# Project Edit Brief Source-Truth Reconciliation

## Decision

`project_edit_brief_source_truth_reconciliation_passed_mock_local_ready_for_owner_review`

## Source Audit

- Clean target branch: `codex/reeditpro-web-ui-shell`.
- Clean source SHA: `5bd57641fb18b7bff8dfb831ae75a63dda6a5ba6`.
- Reconciliation branch: `codex/rp-edit-brief-source-truth-reconciliation`.
- Historical implementation evidence: `/Users/macuser/Developer/REeditpro` at `11ffea3b65d1f0af23c147d3a24d43408691a620` contained the fullest Project Edit Brief implementation but was not used as a direct source of truth because it was dirty and included unrelated historical lanes.
- Dirty workspace intentionally avoided: `/Volumes/backup/REeditpro`.
- No GitHub pull request with a complete Project Edit Brief source-of-truth implementation was open at reconciliation time.

## Landed Scope

- Project Home route and persistent mock Project Edit Session shell.
- Edit Session chat route with Brief, History, Versions, Preview, and Details route sections.
- Project Edit Brief workspace route at `/projects/:projectId/edits/:editSessionId/brief`.
- Mock/local Project Edit Brief repository, row mappers, disabled Supabase repository skeleton, API route registry, browser-safe API client, and route handler coverage.
- Marker timeline and drawer, Marker Chat, metadata-only attachments, export settings recommendations, QA/conflict detection, planner-hint packaging, and visual-context sampling plans.
- Smoke coverage and E2E smoke coverage for Project Edit Brief behavior.

## Explicitly Not Landed

- Live Supabase migrations, reads, writes, storage, signed URL creation, or service-role actions.
- Provider/model calls, Qwen runtime execution, media processing, file-byte reads, uploads, external URL fetches, render/export jobs, worker dispatch, or credit reservation/spend.
- Unrelated historical Edit Preference DNA runtime and internal-testing UI panels. The Edit Brief slice keeps a static mock preference option only where Project Edit Session UX needs a visible preference card.

## Validation Summary

Passed:

- `npm run smoke:edit-brief-surface-audit`
- `npm run smoke:edit-brief-architecture`
- `npm run smoke:project-edit-brief-types`
- `npm run smoke:project-edit-brief-repository`
- `npm run smoke:project-edit-brief-api-routes`
- `npm run smoke:project-edit-brief-api-client`
- `npm run smoke:project-edit-brief-route-client-qa-closure`
- `npm run smoke:project-edit-brief-ui-shell`
- `npm run smoke:project-edit-brief-marker-flow`
- `npm run smoke:project-edit-brief-marker-chat`
- `npm run smoke:project-edit-brief-attachments`
- `npm run smoke:project-edit-brief-export-settings`
- `npm run smoke:project-edit-brief-qa`
- `npm run smoke:project-edit-brief-plan`
- `npm run smoke:project-edit-brief-visual-context`
- `npm run smoke:project-edit-brief-e2e`
- `npm run smoke:project-edit-brief-supabase-repository`
- `npm run smoke:project-edit-brief-internal-testing-review-pr-readiness`
- `npm run smoke:project-edit-brief-internal-testing-completion-audit`
- `npm run typecheck:server`
- `npm run build`
- `git diff --check`
- `git diff --cached --check`

## Remaining Gates

- Owner review for whether this Project Edit Brief shell should become the canonical first-pass user workflow.
- Real authenticated project/session access policy.
- Supabase production readiness gates after RP-EDITBRIEF-13: owner-approved durable roots, migration review, RLS, explicit Data API grants, Storage policy review, service-role boundary, and remote deployment validation.
- Conditional launch-readiness evidence after RP-EDITBRIEF-14: external beta, real-user-media beta, and paid production can pass only when their named approvals/evidence exist; default status remains blocked beyond internal dry-run.
- Owner input collection after RP-EDITBRIEF-15: canonical workflow, durable schema roots, auth/access, Supabase security, media lifecycle, planner integration, credit/cost, provider/model, worker/render, and operations approvals remain required before production persistence implementation.
- Owner evidence intake after RP-EDITBRIEF-15A: the checked-in template is complete but intentionally contains no approvals; RP-EDITBRIEF-16 remains blocked until real owner evidence is recorded.
- Owner evidence readiness after RP-EDITBRIEF-15B: the checked-in template still evaluates as blocked; RP-EDITBRIEF-16 may start only after all ten owner inputs are approved or waived with owner, evidence reference, reviewed timestamp, and notes.
- Owner evidence assignment after RP-EDITBRIEF-15C: the review packet names the owner group, required decision, and minimum evidence for each missing owner input; it does not approve or waive any input.
- Owner evidence local validation after RP-EDITBRIEF-15D: reviewers can run `check:project-edit-brief-owner-evidence-readiness` or the strict CLI against a local filled evidence file before proposing a reviewed PR; unsafe evidence patterns fail closed.
- Owner evidence PR diff validation after RP-EDITBRIEF-15E: the future reviewed evidence PR should stage only the owner-evidence intake file, then run strict diff validation plus the readiness/safety evaluator.
- Owner evidence schema validation after RP-EDITBRIEF-15F: malformed owner evidence JSON fails before readiness, safety, or PR-diff validation runs.
- Owner evidence drafting after RP-EDITBRIEF-15G: reviewers can generate a safe local draft-to-fill from the review packet; generated strict examples are local format checks only and not source truth.
- Internal testing owner acceptance after RP-EDITBRIEF-15H: Codex/operator accepts the internal testing lane only, requiring production-shaped implementation and release-delta tracking while external beta, real-user-media beta, paid production, live Supabase writes, providers, workers, render/export, uploads, and credits remain blocked.
- Internal persistence plan after RP-EDITBRIEF-16: the production-shaped durable-root, route, idempotency, audit, and release-delta contract is defined for the next backend skeleton while migrations, SQL, live Supabase reads/writes, Storage, signed URLs, production routes, providers, media processing, workers, render/export, uploads, external beta, paid production, and credits remain blocked.
- Internal persistence backend skeleton after RP-EDITBRIEF-17: internal testing now has a backend seam with mock write-path evidence, disabled Supabase fail-closed evidence, mutating-operation idempotency/audit envelope validation, and partial expensive-work approval blocking while production routes and live execution remain blocked.
- Internal route integration after RP-EDITBRIEF-18: Project Edit Brief route handlers now use the internal persistence backend skeleton and return internal persistence metadata while production HTTP routes, live Supabase, Storage, providers, media processing, workers, render/export, uploads, external beta, paid production, and credits remain blocked.
- Internal testing readback QA after RP-EDITBRIEF-19: the connected route path is exercised for create brief, create marker, append Marker Chat, summary, and bundle readback with internal persistence metadata and safety flags preserved.
- Internal testing review after RP-EDITBRIEF-20: the internal testing chain is ready for owner review and repeated mock-internal testing, while PR readiness/merge hygiene still requires explicit owner or user action and public release gates remain separate.
- Internal testing completion audit after RP-EDITBRIEF-21: RP-EDITBRIEF-02 through RP-EDITBRIEF-20 are audited as complete for internal mock testing, while PR-ready/merge hygiene still requires explicit user request and public release gates remain separate.
- Real upload/source-media ingestion and privacy policy implementation.
- Planner integration from prepared Brief hints into approved plan snapshots.
- Credit estimate/reservation integration before expensive work.
- Worker/provider/render execution remains separately gated.
