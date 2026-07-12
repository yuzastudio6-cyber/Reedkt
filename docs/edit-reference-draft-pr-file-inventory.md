# Edit Reference Draft PR File Inventory

Status date: 2026-07-12

Comparison: working tree for `codex/edit-reference-end-to-end` against `origin/codex/reeditpro-web-ui-shell` at `e405e69e1a43fd2609854d8acaa7a4ef959b7e94`.

## Summary

| Measure | Result |
| --- | ---: |
| Total changed paths | 162 |
| Added | 100 |
| Modified | 62 |
| Deleted | 0 |
| Supabase migration paths changed | 0 |
| Package lock changed | No |
| Selected-base migration count | 24 |
| Verified source migration count | 21 |

## Category Count

| Category | Paths |
| --- | ---: |
| Browser tests | 15 |
| Design authority | 2 |
| Documentation and evidence | 38 |
| Frontend and shared application code | 66 |
| Root configuration | 4 |
| Server, routes, services, and smokes | 35 |
| Validation scripts | 2 |

## Scope Notes

- Every path belongs to the Edit Reference feature, a required dependency, active-route reconciliation, validation, design authority, or PR-readiness evidence.
- No dependency directory, build output, Playwright report, test result, local upload object, local media fixture, Supabase temp/branch directory, credential, secret, or signed URL is included.
- `package.json` adds validation/smoke scripts; `package-lock.json` is byte-identical to the base.
- No migration file is added, modified, renamed, or deleted.
- The verified source branch remains the rollback/source reference.

## Complete Path Inventory

| Status | Path |
| --- | --- |
| M | `.gitignore` |
| M | `AGENTS.md` |
| A | `design-system/MASTER.md` |
| A | `design-system/pages/edit-preferences.md` |
| M | `docs/edit-preferences-route-entrypoint.json` |
| M | `docs/edit-preferences-route-entrypoint.md` |
| A | `docs/edit-reference-adaptation-proof.md` |
| A | `docs/edit-reference-browser-e2e-report.md` |
| A | `docs/edit-reference-definition-of-done.md` |
| A | `docs/edit-reference-draft-pr-base-reconciliation.md` |
| A | `docs/edit-reference-draft-pr-commit-map.md` |
| A | `docs/edit-reference-draft-pr-file-inventory.md` |
| A | `docs/edit-reference-draft-pr-readiness.md` |
| A | `docs/edit-reference-final-acceptance-matrix.md` |
| A | `docs/edit-reference-gate-1-study-session-foundation.md` |
| A | `docs/edit-reference-gate-2-evidence-study-orchestration.md` |
| A | `docs/edit-reference-gate-3-versioned-dna-synthesis.md` |
| A | `docs/edit-reference-gate-4-dna-qa-approval.md` |
| A | `docs/edit-reference-gate-5-target-application.md` |
| A | `docs/edit-reference-gate-6-downstream-integration.md` |
| A | `docs/edit-reference-gate-7-lifecycle-closure.md` |
| A | `docs/edit-reference-gate-8-1-application-entrypoints.md` |
| A | `docs/edit-reference-gate-8-1-browser-report.md` |
| A | `docs/edit-reference-gate-8-1-known-limitations.md` |
| A | `docs/edit-reference-gate-8-beta-readiness.md` |
| A | `docs/edit-reference-gate-verification-log.md` |
| A | `docs/edit-reference-goal-status.json` |
| A | `docs/edit-reference-goal-status.md` |
| A | `docs/edit-reference-goal.md` |
| A | `docs/edit-reference-known-limitations.md` |
| A | `docs/edit-reference-live-study-closure.md` |
| A | `docs/edit-reference-persistence-contract.md` |
| A | `docs/edit-reference-persistence-readback-report.md` |
| A | `docs/edit-reference-pr-file-inventory.md` |
| A | `docs/edit-reference-rollback-plan.md` |
| A | `docs/edit-reference-security-privacy-report.md` |
| A | `docs/edit-reference-selector-chat-state-consistency.md` |
| A | `docs/edit-reference-skill-provenance-report.md` |
| A | `docs/edit-reference-skill-registry.md` |
| A | `docs/edit-reference-test-fixture-plan.md` |
| A | `docs/edit-reference-ui-contract.md` |
| A | `docs/project-edit-session-supabase-boundary.md` |
| M | `package.json` |
| A | `playwright.config.ts` |
| A | `scripts/validation/edit-reference-goal-postgate.mjs` |
| A | `scripts/validation/edit-reference-goal-preflight.mjs` |
| M | `server/app.ts` |
| A | `server/edit-references/disabled-supabase-edit-reference-repository.ts` |
| A | `server/edit-references/edit-reference-copy-safety.ts` |
| A | `server/edit-references/edit-reference-dna-qa.ts` |
| A | `server/edit-references/edit-reference-dna-synthesis.ts` |
| A | `server/edit-references/edit-reference-evidence-orchestrator.ts` |
| A | `server/edit-references/edit-reference-media-study.ts` |
| A | `server/edit-references/edit-reference-repository.ts` |
| A | `server/edit-references/edit-reference-target-adaptation.ts` |
| A | `server/edit-references/private-edit-reference-repository.ts` |
| M | `server/errors/error-codes.ts` |
| A | `server/middleware/production-rate-limit.ts` |
| A | `server/middleware/project-access.ts` |
| A | `server/routes/edit-reference-routes.ts` |
| A | `server/services/approved-snapshot-validation.ts` |
| A | `server/services/edit-reference-service.ts` |
| A | `server/services/production-rate-limit-service.ts` |
| M | `server/smoke/edit-preferences-route-entrypoint-smoke.ts` |
| A | `server/smoke/edit-reference-adaptation-proof-smoke.ts` |
| A | `server/smoke/edit-reference-api-client-smoke.ts` |
| A | `server/smoke/edit-reference-dna-qa-approval-smoke.ts` |
| A | `server/smoke/edit-reference-dna-synthesis-smoke.ts` |
| A | `server/smoke/edit-reference-downstream-integration-smoke.ts` |
| A | `server/smoke/edit-reference-evidence-study-smoke.ts` |
| A | `server/smoke/edit-reference-gate-8-1-closure-smoke.ts` |
| A | `server/smoke/edit-reference-gate-8-readiness-smoke.ts` |
| A | `server/smoke/edit-reference-goal-control-plane-smoke.ts` |
| A | `server/smoke/edit-reference-lifecycle-closure-smoke.ts` |
| A | `server/smoke/edit-reference-repository-smoke.ts` |
| A | `server/smoke/edit-reference-study-session-foundation-smoke.ts` |
| A | `server/smoke/edit-reference-target-application-smoke.ts` |
| A | `server/smoke/edit-reference-ui-adapter-smoke.ts` |
| M | `server/smoke/project-edit-brief-marker-flow-smoke.ts` |
| M | `server/smoke/project-edit-session-backend-local-route-smoke.ts` |
| M | `server/types.ts` |
| M | `src/App.tsx` |
| M | `src/backend/api/project-edit-brief-mock-route-handlers.ts` |
| A | `src/backend/preference-dna/preference-dna-evidence-scoring-service.ts` |
| A | `src/backend/preference-dna/preference-dna-layer-registry.ts` |
| A | `src/backend/preference-dna/preference-dna-transferability-service.ts` |
| A | `src/backend/project-edit-session-preference/edit-reference-chat-command-service.ts` |
| A | `src/backend/project-edit-session-preference/project-edit-session-preference-application-integration-service.ts` |
| M | `src/backend/project-edit-session-preference/project-edit-session-preference-state-service.ts` |
| M | `src/backend/project-edit-session-preference/project-edit-session-preference-summary-service.ts` |
| M | `src/backend/qwen-runtime/qwen-marker-chat-bridge-service.ts` |
| M | `src/backend/qwen-runtime/qwen-marker-chat-prompt-service.ts` |
| M | `src/backend/qwen-runtime/qwen-runtime-validation-service.ts` |
| M | `src/components/AppShell.tsx` |
| A | `src/components/preferences/EditReferenceWorkspacePage.tsx` |
| A | `src/components/preferences/WorkspaceDefaultsPanel.tsx` |
| M | `src/components/projects/brief/ProjectEditBriefEmptyState.tsx` |
| M | `src/components/projects/brief/ProjectEditBriefMarkerChatPanel.tsx` |
| A | `src/components/projects/brief/ProjectEditBriefMarkerContextPanel.tsx` |
| M | `src/components/projects/brief/ProjectEditBriefMarkerDrawer.tsx` |
| M | `src/components/projects/brief/ProjectEditBriefMarkerQAPanel.tsx` |
| M | `src/components/projects/brief/ProjectEditBriefPlanBridgePanel.tsx` |
| A | `src/components/projects/brief/ProjectEditBriefPreferenceApplicationCard.tsx` |
| M | `src/components/projects/brief/ProjectEditBriefQASummaryCard.tsx` |
| M | `src/components/projects/brief/ProjectEditBriefWorkspace.tsx` |
| A | `src/components/projects/brief/ProjectEditReferenceBriefWorkspace.tsx` |
| M | `src/components/projects/NewEditSessionCreatePanel.tsx` |
| A | `src/components/projects/NewEditSessionEditReferenceSelector.tsx` |
| M | `src/components/projects/ProjectEditSessionChatInput.tsx` |
| A | `src/components/projects/ProjectEditSessionEditReferencePicker.tsx` |
| M | `src/components/projects/ProjectEditSessionPreferencePanel.tsx` |
| M | `src/components/projects/ProjectEditSessionPreferenceStatusCard.tsx` |
| M | `src/data/mockData.ts` |
| A | `src/lib/edit-preference-user-copy.ts` |
| A | `src/lib/edit-reference-api-client.ts` |
| A | `src/lib/edit-reference-approved-options.ts` |
| A | `src/lib/edit-reference-deterministic-hash.ts` |
| A | `src/lib/edit-reference-downstream-context.ts` |
| A | `src/lib/edit-reference-media-upload-client.ts` |
| A | `src/lib/edit-reference-ui-adapter.ts` |
| M | `src/lib/project-edit-brief-api-client-adapter.ts` |
| M | `src/lib/project-edit-brief-marker-chat-ui-adapter.ts` |
| M | `src/lib/project-edit-brief-plan-rules.ts` |
| M | `src/lib/project-edit-brief-plan-ui-adapter.ts` |
| A | `src/lib/project-edit-brief-preference-application-ui-adapter.ts` |
| M | `src/lib/project-edit-brief-qa-rules.ts` |
| M | `src/lib/project-edit-brief-qa-ui-adapter.ts` |
| M | `src/lib/project-edit-session-api-client.ts` |
| M | `src/lib/project-edit-session-backend-local.ts` |
| M | `src/lib/project-edit-session-chat-ui-adapter.ts` |
| M | `src/lib/project-edit-session-create-flow-ui-adapter.ts` |
| A | `src/lib/project-edit-session-edit-reference-integration.ts` |
| M | `src/pages/PreferencesPage.tsx` |
| A | `src/pages/ProjectEditSessionChatPage.tsx` |
| M | `src/styles/buttons.css` |
| M | `src/styles/layout.css` |
| M | `src/styles/preferences.css` |
| M | `src/styles/project-edit-brief.css` |
| M | `src/styles/project-edit-sessions.css` |
| M | `src/types/api-routes.ts` |
| A | `src/types/edit-reference-integration.ts` |
| A | `src/types/edit-reference.ts` |
| A | `src/types/preference-dna-builder.ts` |
| M | `src/types/project-edit-brief-plan.ts` |
| M | `src/types/project-edit-brief-qa.ts` |
| M | `src/types/project-edit-session-preference.ts` |
| M | `src/types/qwen-marker-chat-runtime.ts` |
| M | `tests/e2e/edit-preferences-route-entrypoint.spec.ts` |
| A | `tests/e2e/edit-reference-downstream-integration.spec.ts` |
| A | `tests/e2e/edit-reference-gate-8-1-entrypoints.spec.ts` |
| A | `tests/e2e/edit-reference-gate-8-beta-readiness.spec.ts` |
| A | `tests/e2e/edit-reference-lifecycle-closure.spec.ts` |
| A | `tests/e2e/edit-reference-study-session.spec.ts` |
| M | `tests/e2e/helpers/routes.ts` |
| M | `tests/e2e/project-create-edit-upload-local-api.spec.ts` |
| M | `tests/e2e/project-edit-brief-e2e.spec.ts` |
| M | `tests/e2e/project-edit-brief-internal-testing-entrypoint.spec.ts` |
| M | `tests/e2e/project-edit-brief-shell.spec.ts` |
| M | `tests/e2e/project-source-video-backend-upload-local-api.spec.ts` |
| M | `tests/e2e/project-source-video-backend-upload.spec.ts` |
| M | `tests/e2e/project-source-video-brief-playback.spec.ts` |
| M | `tests/e2e/project-start-to-edit-session.spec.ts` |
