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
- `npm run typecheck:server`
- `npm run build`
- `git diff --check`
- `git diff --cached --check`

## Remaining Gates

- Owner review for whether this Project Edit Brief shell should become the canonical first-pass user workflow.
- Real authenticated project/session access policy.
- Supabase migration/read-write implementation and RLS review.
- Real upload/source-media ingestion and privacy policy implementation.
- Planner integration from prepared Brief hints into approved plan snapshots.
- Credit estimate/reservation integration before expensive work.
- Worker/provider/render execution remains separately gated.
