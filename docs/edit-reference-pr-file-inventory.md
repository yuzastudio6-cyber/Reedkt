# Edit Reference PR File Inventory

Status: `complete_local_unpushed`

Starting commit: `48540ee9b3d14c8345b0cedf11b6b449424324c3`

Gate 7 implementation commit: `42d34cdc04179c6808a4c3f23286885daf116006`

Gate 7 verification commit: `abb3b9548baa92c5bcdd4d5cee45a53e1ef6f66e`

Gate 8 implementation commit: `7ff15993c505af65abcbc61e0db259061f583e25`

Target branch: `codex/beta-integration-reconcile`

Total changed paths: 171

Supabase migration paths changed: 0

Package-lock paths changed: 0

## Inventory Summary

| Area | Paths | Review focus |
| --- | ---: | --- |
| Documentation and governance | 28 | goal contracts, Gates 1–8 evidence, status, limitations, rollback |
| Design-system authority | 2 | Edit Preferences master/page rules |
| Server domain/API/security/smokes | 56 | repository, service, routes, study/DNA/adaptation/lifecycle proofs |
| Frontend/domain/UI/types | 69 | Edit References workspace and downstream Project/Edit Brief integration |
| Browser tests | 10 | focused study/downstream/lifecycle/Gate 8 flows and regressions |
| Validation scripts | 2 | canonical preflight/postgate checks |
| Root/configuration | 4 | scripts, app wiring, Playwright scope, repository instructions |

## Scope Review

- The inventory is the union of the goal diff from the starting commit and final Gate 8 paths.
- No file under `supabase/migrations/` changed; migration baseline/current remain 21.
- No `package-lock.json`, dependency version, provider credential, environment file, private media, generated test result, build output, or AppleDouble file is included.
- Historical/reference repositories are outside this branch and were read-only.
- No push or pull request was created.

## Exact Name-Status Inventory

```text
M	.gitignore
M	AGENTS.md
A	design-system/MASTER.md
A	design-system/pages/edit-preferences.md
A	docs/edit-reference-adaptation-proof.md
A	docs/edit-reference-browser-e2e-report.md
A	docs/edit-reference-definition-of-done.md
A	docs/edit-reference-final-acceptance-matrix.md
A	docs/edit-reference-gate-1-study-session-foundation.md
A	docs/edit-reference-gate-2-evidence-study-orchestration.md
A	docs/edit-reference-gate-3-versioned-dna-synthesis.md
A	docs/edit-reference-gate-4-dna-qa-approval.md
A	docs/edit-reference-gate-5-target-application.md
A	docs/edit-reference-gate-6-downstream-integration.md
A	docs/edit-reference-gate-7-lifecycle-closure.md
A	docs/edit-reference-gate-8-beta-readiness.md
A	docs/edit-reference-gate-verification-log.md
A	docs/edit-reference-goal-status.json
A	docs/edit-reference-goal-status.md
A	docs/edit-reference-goal.md
A	docs/edit-reference-known-limitations.md
A	docs/edit-reference-persistence-contract.md
A	docs/edit-reference-persistence-readback-report.md
A	docs/edit-reference-pr-file-inventory.md
A	docs/edit-reference-rollback-plan.md
A	docs/edit-reference-security-privacy-report.md
A	docs/edit-reference-skill-provenance-report.md
A	docs/edit-reference-skill-registry.md
A	docs/edit-reference-test-fixture-plan.md
A	docs/edit-reference-ui-contract.md
A	docs/project-edit-brief-supabase-boundary.md
A	docs/project-edit-session-supabase-boundary.md
M	package.json
M	playwright.config.ts
A	scripts/validation/edit-reference-goal-postgate.mjs
A	scripts/validation/edit-reference-goal-preflight.mjs
M	server/app.ts
A	server/edit-references/disabled-supabase-edit-reference-repository.ts
A	server/edit-references/edit-reference-copy-safety.ts
A	server/edit-references/edit-reference-dna-qa.ts
A	server/edit-references/edit-reference-dna-synthesis.ts
A	server/edit-references/edit-reference-evidence-orchestrator.ts
A	server/edit-references/edit-reference-repository.ts
A	server/edit-references/edit-reference-target-adaptation.ts
A	server/edit-references/private-edit-reference-repository.ts
M	server/errors/error-codes.ts
A	server/middleware/production-rate-limit.ts
A	server/middleware/project-access.ts
A	server/routes/edit-reference-routes.ts
A	server/services/approved-snapshot-validation.ts
A	server/services/edit-reference-service.ts
A	server/services/production-rate-limit-service.ts
M	server/smoke/beta-integration-core-user-flow-smoke.ts
M	server/smoke/beta-integration-edit-preference-smoke.ts
M	server/smoke/edit-brief-edit-preference-readiness-audit-smoke.ts
M	server/smoke/edit-preference-auto-professional-smoke.ts
M	server/smoke/edit-preference-edit-plan-application-smoke.ts
M	server/smoke/edit-preference-project-repository-smoke.ts
M	server/smoke/edit-preference-repository-smoke.ts
M	server/smoke/edit-preference-resolver-smoke.ts
M	server/smoke/edit-preference-signal-smoke.ts
M	server/smoke/edit-preference-snapshot-smoke.ts
M	server/smoke/edit-preference-worker-application-smoke.ts
A	server/smoke/edit-reference-adaptation-proof-smoke.ts
A	server/smoke/edit-reference-api-client-smoke.ts
A	server/smoke/edit-reference-dna-qa-approval-smoke.ts
A	server/smoke/edit-reference-dna-synthesis-smoke.ts
A	server/smoke/edit-reference-downstream-integration-smoke.ts
A	server/smoke/edit-reference-evidence-study-smoke.ts
A	server/smoke/edit-reference-gate-8-readiness-smoke.ts
A	server/smoke/edit-reference-goal-control-plane-smoke.ts
A	server/smoke/edit-reference-lifecycle-closure-smoke.ts
A	server/smoke/edit-reference-repository-smoke.ts
A	server/smoke/edit-reference-study-session-foundation-smoke.ts
A	server/smoke/edit-reference-target-application-smoke.ts
A	server/smoke/edit-reference-ui-adapter-smoke.ts
M	server/smoke/lovable-dashboard-ui-alignment-smoke.ts
M	server/smoke/preference-video-dna-repository-smoke.ts
M	server/smoke/preference-video-e2e-smoke.ts
M	server/smoke/preference-video-rc-smoke.ts
M	server/smoke/project-edit-brief-attachments-smoke.ts
M	server/smoke/project-edit-brief-export-settings-smoke.ts
M	server/smoke/project-edit-brief-marker-chat-smoke.ts
M	server/smoke/project-edit-brief-plan-smoke.ts
M	server/smoke/project-edit-brief-qa-smoke.ts
M	server/smoke/project-edit-brief-repository-smoke.ts
M	server/smoke/project-edit-session-repository-smoke.ts
M	server/smoke/qwen-marker-chat-bridge-smoke.ts
M	server/smoke/sound-music-audio-planner-smoke.ts
M	server/tool-cost-metering/cost-math.ts
M	server/tool-cost-metering/mock-tool-cost-store.ts
M	server/types.ts
M	src/backend/project-edit-brief-attachments/project-edit-brief-attachment-validation-service.ts
M	src/backend/project-edit-brief-qa/project-edit-brief-qa-validation-service.ts
A	src/backend/project-edit-session-preference/project-edit-session-preference-application-integration-service.ts
M	src/backend/project-edit-session-preference/project-edit-session-preference-state-service.ts
M	src/backend/project-edit-session-preference/project-edit-session-preference-summary-service.ts
M	src/backend/qwen-runtime/qwen-marker-chat-prompt-service.ts
A	src/backend/repositories/supabase-project-edit-brief-repository.ts
A	src/backend/repositories/supabase-project-edit-session-repository.ts
M	src/components/AppShell.tsx
M	src/components/preferences/EditPreferenceCard.tsx
M	src/components/preferences/EditPreferenceContractSummary.tsx
M	src/components/preferences/EditPreferenceCreateChatDescriptionStep.tsx
M	src/components/preferences/EditPreferenceCreateFlow.tsx
M	src/components/preferences/EditPreferenceCreateReferenceStep.tsx
M	src/components/preferences/EditPreferenceCreateReviewStep.tsx
M	src/components/preferences/EditPreferenceCreateSuccessCard.tsx
M	src/components/preferences/EditPreferenceDetailPanel.tsx
M	src/components/preferences/EditPreferenceDNALayerSummarySection.tsx
M	src/components/preferences/EditPreferenceDNAQASummarySection.tsx
M	src/components/preferences/EditPreferenceLibraryPage.tsx
M	src/components/preferences/EditPreferenceSignalSummary.tsx
M	src/components/preferences/EditPreferenceSourceVideoCard.tsx
M	src/components/preferences/EditPreferenceUsageSummary.tsx
M	src/components/preferences/EditPreferenceVersionList.tsx
M	src/components/preferences/EditPreferenceVideoDNASection.tsx
A	src/components/preferences/EditReferenceWorkspacePage.tsx
M	src/components/preferences/useMockEditPreferenceLibrary.ts
M	src/components/projects/brief/ProjectEditBriefMarkerChatPanel.tsx
M	src/components/projects/brief/ProjectEditBriefMarkerContextPanel.tsx
M	src/components/projects/brief/ProjectEditBriefMarkerDrawer.tsx
M	src/components/projects/brief/ProjectEditBriefMarkerQAPanel.tsx
M	src/components/projects/brief/ProjectEditBriefPlanBridgePanel.tsx
A	src/components/projects/brief/ProjectEditBriefPreferenceApplicationCard.tsx
M	src/components/projects/brief/ProjectEditBriefQASummaryCard.tsx
M	src/components/projects/brief/ProjectEditBriefWorkspace.tsx
A	src/components/projects/ProjectEditSessionEditReferencePicker.tsx
M	src/components/projects/ProjectEditSessionPreferencePanel.tsx
M	src/components/projects/ProjectEditSessionPreferenceStatusCard.tsx
M	src/data/mockData.ts
A	src/lib/edit-preference-user-copy.ts
A	src/lib/edit-reference-api-client.ts
A	src/lib/edit-reference-downstream-context.ts
A	src/lib/edit-reference-ui-adapter.ts
M	src/lib/project-edit-brief-api-client-adapter.ts
M	src/lib/project-edit-brief-marker-chat-ui-adapter.ts
M	src/lib/project-edit-brief-marker-context-summaries.ts
M	src/lib/project-edit-brief-marker-context-ui-adapter.ts
M	src/lib/project-edit-brief-plan-rules.ts
M	src/lib/project-edit-brief-plan-ui-adapter.ts
A	src/lib/project-edit-brief-preference-application-ui-adapter.ts
M	src/lib/project-edit-brief-qa-rules.ts
M	src/lib/project-edit-brief-qa-ui-adapter.ts
M	src/lib/project-edit-session-api-client-adapter.ts
M	src/lib/project-edit-session-api-client.ts
A	src/lib/project-edit-session-edit-reference-integration.ts
M	src/pages/EditPreferencePage.tsx
M	src/pages/ProjectEditSessionChatPage.tsx
M	src/styles/buttons.css
M	src/styles/layout.css
M	src/styles/preferences.css
M	src/styles/project-edit-brief.css
M	src/styles/project-edit-sessions.css
M	src/types/api-routes.ts
A	src/types/edit-reference-integration.ts
A	src/types/edit-reference.ts
M	src/types/project-edit-brief-marker-context.ts
M	src/types/project-edit-brief-plan.ts
M	src/types/project-edit-brief-qa.ts
M	src/types/project-edit-session-preference.ts
M	tests/e2e/edit-level-ui.spec.ts
M	tests/e2e/edit-preferences.spec.ts
A	tests/e2e/edit-reference-downstream-integration.spec.ts
A	tests/e2e/edit-reference-gate-8-beta-readiness.spec.ts
A	tests/e2e/edit-reference-lifecycle-closure.spec.ts
A	tests/e2e/edit-reference-study-session.spec.ts
M	tests/e2e/helpers/routes.ts
M	tests/e2e/lovable-dashboard-ui-alignment.spec.ts
M	tests/e2e/preference-video-dna.spec.ts
M	tests/e2e/project-edit-session-navigation.spec.ts
```

## Review Order

1. Public Edit Reference and downstream integration contracts.
2. Private repository/service/routes and security/idempotency boundaries.
3. Evidence orchestration, DNA synthesis/QA, target adaptation, lifecycle, and Gate 8 repair tests.
4. Edit Preferences and Project Edit Session/Edit Brief UI behavior against `design.md` and `design-system/`.
5. Browser E2E and regression results.
6. Goal status, acceptance matrix, provenance/persistence/security reports, limitations, and rollback.

This inventory is ready for local PR review only. The branch remains unpushed.
