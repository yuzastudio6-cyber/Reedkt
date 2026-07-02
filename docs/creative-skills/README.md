# Creative Skill System Foundation Audit

This directory is the documentation-only foundation audit for future ReeditPro Creative Skill System work.

It is not an implementation of skills, a runtime registry, a database schema, a provider router, a worker contract, or a UI surface. It exists to keep future Creative Skill System prompts aligned with the existing ReeditPro source truths before any new skill doctrine, contracts, or execution paths are designed.

## Required Rule

"Creative Skill System work must remain planning-first, approval-gated, credit-aware, and professional. Skills are not rigid templates or random effects. Every skill must eventually have a planning contract before execution."

## Audit Files

| File | Purpose |
| --- | --- |
| [creative-skill-system-architecture.md](creative-skill-system-architecture.md) | Defines the RP-SKILLS-01 doctrine for what skills are, how they preserve taste, and how future planning contracts must stay approval-gated. |
| [skill-planning-contracts.md](skill-planning-contracts.md) | Defines the RP-SKILLS-02 universal planning envelope every future specialized skill contract inherits. |
| [skill-planning-contract-checklist.md](skill-planning-contract-checklist.md) | Provides a concise checklist and fail conditions for future skill contract prompts. |
| [transition-planning-contract.md](transition-planning-contract.md) | Defines the RP-SKILLS-03 transition-specific planning contract that inherits the universal envelope. |
| [transition-planning-contract-checklist.md](transition-planning-contract-checklist.md) | Provides transition-specific checklist items and fail conditions for future transition prompts. |
| [overlay-compositing-planning-contract.md](overlay-compositing-planning-contract.md) | Defines the RP-SKILLS-04 overlay/compositing-specific planning contract that inherits the universal envelope and references transition edge behavior. |
| [overlay-compositing-planning-contract-checklist.md](overlay-compositing-planning-contract-checklist.md) | Provides overlay/compositing-specific checklist items and fail conditions for future overlay prompts. |
| [graphic-design-planning-contract.md](graphic-design-planning-contract.md) | Defines the RP-SKILLS-05 Graphic Design / VisualExplain-specific planning contract that inherits the universal and overlay/compositing envelopes. |
| [graphic-design-planning-contract-checklist.md](graphic-design-planning-contract-checklist.md) | Provides Graphic Design / VisualExplain-specific checklist items and fail conditions for future graphic design prompts. |
| [motion-design-planning-contract.md](motion-design-planning-contract.md) | Defines the RP-SKILLS-06 motion-design-specific planning contract that inherits the universal, transition, overlay/compositing, and graphic design envelopes where relevant. |
| [motion-design-planning-contract-checklist.md](motion-design-planning-contract-checklist.md) | Provides motion-design-specific checklist items and fail conditions for future motion design prompts. |
| [three-d-visual-planning-contract.md](three-d-visual-planning-contract.md) | Defines the RP-SKILLS-07 3D-visual-specific planning contract that inherits the universal, transition, overlay/compositing, graphic design, and motion design envelopes where relevant. |
| [three-d-visual-planning-contract-checklist.md](three-d-visual-planning-contract-checklist.md) | Provides 3D-visual-specific checklist items and fail conditions for future 3D prompts. |
| [b-roll-planning-contract.md](b-roll-planning-contract.md) | Defines the RP-SKILLS-08 B-roll-specific planning contract that inherits the universal, transition, overlay/compositing, graphic design, motion design, and 3D envelopes where relevant. |
| [b-roll-planning-contract-checklist.md](b-roll-planning-contract-checklist.md) | Provides B-roll-specific checklist items and fail conditions for future B-roll prompts. |
| [caption-planning-contract.md](caption-planning-contract.md) | Defines the RP-SKILLS-09 caption-specific planning contract that inherits the universal, overlay/compositing, graphic design, motion design, transition, 3D, and B-roll envelopes where relevant. |
| [caption-planning-contract-checklist.md](caption-planning-contract-checklist.md) | Provides caption-specific checklist items and fail conditions for future caption prompts. |
| [sound-music-planning-contract.md](sound-music-planning-contract.md) | Defines the RP-SKILLS-10 SoundSync/music/SFX/audio-support-specific planning contract that inherits the universal, transition, overlay/compositing, graphic design, motion design, 3D, B-roll, and caption envelopes where relevant. |
| [sound-music-planning-contract-checklist.md](sound-music-planning-contract-checklist.md) | Provides SoundSync/music/SFX-specific checklist items and fail conditions for future sound/music prompts. |
| [storytiming-coordination-contract.md](storytiming-coordination-contract.md) | Defines the RP-SKILLS-11 StoryTiming coordination contract that coordinates all prior Creative Skill planning contracts across time, focus, density, permissions, conflicts, approvals, and QA. |
| [storytiming-coordination-contract-checklist.md](storytiming-coordination-contract-checklist.md) | Provides StoryTiming-specific checklist items and fail conditions for future coordination prompts. |
| [edit-preference-creative-direction-contract.md](edit-preference-creative-direction-contract.md) | Defines the RP-SKILLS-12 Edit Preference Creative Direction contract for user, workspace, project, workflow, and Reference DNA preference planning. |
| [edit-preference-creative-direction-contract-checklist.md](edit-preference-creative-direction-contract-checklist.md) | Provides edit-preference-specific checklist items and fail conditions for future preference prompts. |
| [skill-taxonomy-and-family-catalog-contract.md](skill-taxonomy-and-family-catalog-contract.md) | Defines the RP-SKILLS-13 Skill Taxonomy and Family Catalog contract for canonical skill families, keys, aliases, relationships, and planning-contract mapping. |
| [skill-taxonomy-and-family-catalog-contract-checklist.md](skill-taxonomy-and-family-catalog-contract-checklist.md) | Provides skill taxonomy and catalog checklist items and fail conditions for future taxonomy prompts. |
| [visual-opportunity-engine-contract.md](visual-opportunity-engine-contract.md) | Defines the RP-SKILLS-14 Visual Opportunity Engine contract for detecting moments before concept ideation or skill selection. |
| [visual-opportunity-engine-contract-checklist.md](visual-opportunity-engine-contract-checklist.md) | Provides visual opportunity checklist items and fail conditions for future opportunity detection prompts. |
| [creative-concept-ideation-contract.md](creative-concept-ideation-contract.md) | Defines the RP-SKILLS-15 Creative Concept Ideation contract for generating and evaluating concept candidates from visual opportunities before skill selection. |
| [creative-concept-ideation-contract-checklist.md](creative-concept-ideation-contract-checklist.md) | Provides creative concept checklist items and fail conditions for future concept ideation prompts. |
| [skill-candidate-scoring-and-resolver-contract.md](skill-candidate-scoring-and-resolver-contract.md) | Defines the RP-SKILLS-16 Skill Candidate Scoring and Resolver contract for mapping selected concepts to scored skill candidates and route previews. |
| [skill-candidate-scoring-and-resolver-contract-checklist.md](skill-candidate-scoring-and-resolver-contract-checklist.md) | Provides resolver checklist items and fail conditions for future skill candidate scoring prompts. |
| [skill-route-and-plan-assembly-contract.md](skill-route-and-plan-assembly-contract.md) | Defines the RP-SKILLS-17 Skill Route and Plan Assembly contract for turning selected skill candidates into future route intent, plan record requirements, and route summaries. |
| [skill-route-and-plan-assembly-contract-checklist.md](skill-route-and-plan-assembly-contract-checklist.md) | Provides route assembly checklist items and fail conditions for future skill route prompts. |
| [skill-credit-and-approval-planning-contract.md](skill-credit-and-approval-planning-contract.md) | Defines the RP-SKILLS-18 Skill Credit and Approval Planning contract for turning future skill routes into credit estimate items, approval groups, lower-cost alternatives, and no-generation-before-approval gates. |
| [skill-credit-and-approval-planning-contract-checklist.md](skill-credit-and-approval-planning-contract-checklist.md) | Provides credit and approval planning checklist items and fail conditions for future credit/approval prompts. |
| [skill-qa-and-validation-contract.md](skill-qa-and-validation-contract.md) | Defines the RP-SKILLS-19 Skill QA and Validation contract for checking future skill plans before user-facing display, approval, preview, revision, or future execution gates. |
| [skill-qa-and-validation-contract-checklist.md](skill-qa-and-validation-contract-checklist.md) | Provides QA and validation checklist items and fail conditions for future skill QA prompts. |
| [skill-diagnostics-and-static-validation-contract.md](skill-diagnostics-and-static-validation-contract.md) | Defines the RP-SKILLS-20 Skill Diagnostics and Static Validation contract for future repository checks and static validation boundaries. |
| [skill-diagnostics-and-static-validation-contract-checklist.md](skill-diagnostics-and-static-validation-contract-checklist.md) | Provides diagnostics and static validation checklist items and fail conditions for future diagnostics prompts. |
| [../../src/types/creative-skills-core.ts](../../src/types/creative-skills-core.ts) | Defines the RP-SKILLS-21 Creative Skill core taxonomy and catalog TypeScript contracts. |
| [../../src/types/creative-skill-plans.ts](../../src/types/creative-skill-plans.ts) | Defines the RP-SKILLS-21 universal and specialized Creative Skill planning TypeScript contracts. |
| [../../src/types/creative-skill-workflow.ts](../../src/types/creative-skill-workflow.ts) | Defines the RP-SKILLS-21 Creative Skill workflow, preference, opportunity, concept, candidate, route, and credit/approval TypeScript contracts. |
| [../../src/types/creative-skill-qa.ts](../../src/types/creative-skill-qa.ts) | Defines the RP-SKILLS-21 Creative Skill QA TypeScript contracts. |
| [../../src/types/creative-skill-diagnostics.ts](../../src/types/creative-skill-diagnostics.ts) | Defines the RP-SKILLS-21 Creative Skill diagnostics/static validation TypeScript contracts. |
| [../../src/lib/mock-creative-skill-records.ts](../../src/lib/mock-creative-skill-records.ts) | Defines the RP-SKILLS-22 static mock Creative Skill records and grouped fixture scenarios. |
| [type-contract-reconciliation-report.md](type-contract-reconciliation-report.md) | Records the RP-SKILLS-23 reconciliation findings for Creative Skill types, mock fixtures, exports, validation, and handoff. |
| [creative-skill-schema-planning-contract.md](creative-skill-schema-planning-contract.md) | Defines the RP-SKILLS-24 Creative Skill schema planning contract for future table groups, RLS/security, migration sequencing, and no-SQL boundaries. |
| [creative-skill-schema-planning-contract-checklist.md](creative-skill-schema-planning-contract-checklist.md) | Provides RP-SKILLS-24 schema planning checklist items and fail conditions for future schema prompts. |
| [creative-skill-supabase-migration-blueprint-and-rls-readiness-contract.md](creative-skill-supabase-migration-blueprint-and-rls-readiness-contract.md) | Defines the RP-SKILLS-25 Creative Skill Supabase migration blueprint and RLS readiness contract for future migration packages without writing SQL or migrations. |
| [creative-skill-supabase-migration-blueprint-and-rls-readiness-contract-checklist.md](creative-skill-supabase-migration-blueprint-and-rls-readiness-contract-checklist.md) | Provides RP-SKILLS-25 migration blueprint and RLS readiness checklist items and fail conditions for future migration-readiness prompts. |
| [creative-skill-catalog-migration-readiness-review.md](creative-skill-catalog-migration-readiness-review.md) | Defines the RP-SKILLS-26 Creative Skill Catalog Migration Readiness Review for the first future catalog-only migration package. |
| [creative-skill-catalog-migration-readiness-review-checklist.md](creative-skill-catalog-migration-readiness-review-checklist.md) | Provides RP-SKILLS-26 catalog migration readiness checklist items and fail conditions for future readiness prompts. |
| [manifests/creative-skill-catalog-canonical-seed-manifest.json](manifests/creative-skill-catalog-canonical-seed-manifest.json) | Provides the RP-SKILLS-29 static canonical Creative Skill catalog seed manifest for future seed review. |
| [manifests/README.md](manifests/README.md) | Documents the manifest directory, source precedence, key-resolution guidance, and no-seed-execution boundary. |
| [creative-skill-catalog-canonical-seed-manifest-completion.md](creative-skill-catalog-canonical-seed-manifest-completion.md) | Records RP-SKILLS-29 manifest coverage, canonicalization decisions, validation expectations, readiness decision, and handoff. |
| [creative-skill-catalog-canonical-seed-manifest-completion-checklist.md](creative-skill-catalog-canonical-seed-manifest-completion-checklist.md) | Provides RP-SKILLS-29 manifest completion checks and fail cases. |
| [creative-skill-catalog-canonical-seed-manifest-static-review-and-seed-migration-readiness.md](creative-skill-catalog-canonical-seed-manifest-static-review-and-seed-migration-readiness.md) | Records the RP-SKILLS-30 static manifest review, seed projection, insertion strategy, decisions, and handoff. |
| [creative-skill-catalog-canonical-seed-manifest-static-review-and-seed-migration-readiness-checklist.md](creative-skill-catalog-canonical-seed-manifest-static-review-and-seed-migration-readiness-checklist.md) | Provides RP-SKILLS-30 static review and seed-readiness checklist items and fail conditions. |
| [creative-skill-catalog-canonical-seed-migration-implementation-report.md](creative-skill-catalog-canonical-seed-migration-implementation-report.md) | Records RP-SKILLS-31 seed migration implementation details, projection, assertions, validation, and handoff. |
| [creative-skill-catalog-canonical-seed-migration-static-review-and-local-apply-readiness.md](creative-skill-catalog-canonical-seed-migration-static-review-and-local-apply-readiness.md) | Records the RP-SKILLS-32 static review of both catalog migrations, row parity, RLS posture, and local apply readiness. |
| [creative-skill-catalog-canonical-seed-migration-static-review-and-local-apply-readiness-checklist.md](creative-skill-catalog-canonical-seed-migration-static-review-and-local-apply-readiness-checklist.md) | Provides RP-SKILLS-32 static review and local-readiness checklist items and fail conditions. |
| [creative-skill-local-supabase-readiness-repair.md](creative-skill-local-supabase-readiness-repair.md) | Records the RP-SKILLS-33 local Supabase readiness decision packet and owner questions. |
| [creative-skill-local-supabase-readiness-repair-checklist.md](creative-skill-local-supabase-readiness-repair-checklist.md) | Provides RP-SKILLS-33 readiness repair checks and fail conditions. |
| [creative-skill-local-supabase-owner-decision-packet.md](creative-skill-local-supabase-owner-decision-packet.md) | Records the RP-SKILLS-34 owner decision packet for local Supabase config readiness. |
| [creative-skill-local-supabase-owner-decision-packet-checklist.md](creative-skill-local-supabase-owner-decision-packet-checklist.md) | Provides RP-SKILLS-34 owner decision checks and fail conditions. |
| [creative-skill-local-supabase-config-creation.md](creative-skill-local-supabase-config-creation.md) | Records the RP-SKILLS-35 local-only Supabase config creation, safety findings, readiness decision, and handoff. |
| [creative-skill-local-supabase-config-creation-checklist.md](creative-skill-local-supabase-config-creation-checklist.md) | Provides RP-SKILLS-35 local Supabase config checks and fail conditions. |
| [creative-skill-catalog-migrations-disposable-local-apply-and-data-verification.md](creative-skill-catalog-migrations-disposable-local-apply-and-data-verification.md) | Records the RP-SKILLS-36 disposable local apply attempt, local port-conflict blocker, and data-verification status. |
| [creative-skill-catalog-migrations-disposable-local-apply-and-data-verification-checklist.md](creative-skill-catalog-migrations-disposable-local-apply-and-data-verification-checklist.md) | Provides RP-SKILLS-36 local apply/data-verification checks and fail conditions. |
| [creative-skill-local-supabase-environment-repair-decision-packet.md](creative-skill-local-supabase-environment-repair-decision-packet.md) | Records the RP-SKILLS-37 owner decision packet for the local Supabase port-conflict repair path. |
| [creative-skill-local-supabase-environment-repair-decision-packet-checklist.md](creative-skill-local-supabase-environment-repair-decision-packet-checklist.md) | Provides RP-SKILLS-37 local environment repair checks and fail conditions. |
| [creative-skill-local-supabase-port-repair.md](creative-skill-local-supabase-port-repair.md) | Records the RP-SKILLS-38 owner-approved local Supabase port repair for `reeditpro-local`. |
| [creative-skill-local-supabase-port-repair-checklist.md](creative-skill-local-supabase-port-repair-checklist.md) | Provides RP-SKILLS-38 local port repair checks and fail conditions. |
| [creative-skill-catalog-migrations-disposable-local-apply-and-data-verification-retry.md](creative-skill-catalog-migrations-disposable-local-apply-and-data-verification-retry.md) | Records the RP-SKILLS-39 disposable local apply retry and migration-chain blocker. |
| [creative-skill-catalog-migrations-disposable-local-apply-and-data-verification-retry-checklist.md](creative-skill-catalog-migrations-disposable-local-apply-and-data-verification-retry-checklist.md) | Provides RP-SKILLS-39 local apply retry checks and fail conditions. |
| [creative-skill-catalog-migration-local-failure-repair.md](creative-skill-catalog-migration-local-failure-repair.md) | Records the RP-SKILLS-40 local migration-chain repair and new blocker. |
| [creative-skill-catalog-migration-local-failure-repair-checklist.md](creative-skill-catalog-migration-local-failure-repair-checklist.md) | Provides RP-SKILLS-40 repair checks and fail conditions. |
| [beta-integration-merge-readiness-report.md](beta-integration-merge-readiness-report.md) | Records the RP-BETA-INTEGRATION-01 repo identity, validation, blockers, and merge-readiness status. |
| [local-migration-chain-blocker-repair-202605180001-owner-id.md](local-migration-chain-blocker-repair-202605180001-owner-id.md) | Records the RP-BETA-INTEGRATION-02 owner compatibility repair and new blocker. |
| [local-migration-chain-blocker-repair-202605180001-owner-id-checklist.md](local-migration-chain-blocker-repair-202605180001-owner-id-checklist.md) | Provides RP-BETA-INTEGRATION-02 owner repair checks and fail conditions. |
| [local-migration-chain-blocker-repair-202605180004-credit-estimate-plan-version.md](local-migration-chain-blocker-repair-202605180004-credit-estimate-plan-version.md) | Records the RP-BETA-INTEGRATION-07 credit-estimate plan-version compatibility repair and new blocker. |
| [local-migration-chain-blocker-repair-202605180004-credit-estimate-plan-version-checklist.md](local-migration-chain-blocker-repair-202605180004-credit-estimate-plan-version-checklist.md) | Provides RP-BETA-INTEGRATION-07 credit-estimate plan-version repair checks and fail conditions. |
| [local-migration-chain-blocker-repair-202605180005-generation-request-snapshot.md](local-migration-chain-blocker-repair-202605180005-generation-request-snapshot.md) | Records the RP-BETA-INTEGRATION-08 generation-request snapshot compatibility repair and new blocker. |
| [local-migration-chain-blocker-repair-202605180005-generation-request-snapshot-checklist.md](local-migration-chain-blocker-repair-202605180005-generation-request-snapshot-checklist.md) | Provides RP-BETA-INTEGRATION-08 generation-request snapshot repair checks and fail conditions. |
| [local-migration-chain-blocker-repair-202605180005-generated-asset-version.md](local-migration-chain-blocker-repair-202605180005-generated-asset-version.md) | Records the RP-BETA-INTEGRATION-09 generated asset version index repair and new blocker. |
| [local-migration-chain-blocker-repair-202605180005-generated-asset-version-checklist.md](local-migration-chain-blocker-repair-202605180005-generated-asset-version-checklist.md) | Provides RP-BETA-INTEGRATION-09 generated asset version repair checks and fail conditions. |
| [local-migration-chain-blocker-repair-202605180006-qa-check-result-column.md](local-migration-chain-blocker-repair-202605180006-qa-check-result-column.md) | Records the RP-BETA-INTEGRATION-10 QA check result column syntax repair and new blocker. |
| [local-migration-chain-blocker-repair-202605180006-qa-check-result-column-checklist.md](local-migration-chain-blocker-repair-202605180006-qa-check-result-column-checklist.md) | Provides RP-BETA-INTEGRATION-10 QA check result column repair checks and fail conditions. |
| [local-migration-chain-blocker-repair-202605180006-qa-report-approved-snapshot.md](local-migration-chain-blocker-repair-202605180006-qa-report-approved-snapshot.md) | Records the RP-BETA-INTEGRATION-11 QA report approved-snapshot repair and new blocker. |
| [local-migration-chain-blocker-repair-202605180006-qa-report-approved-snapshot-checklist.md](local-migration-chain-blocker-repair-202605180006-qa-report-approved-snapshot-checklist.md) | Provides RP-BETA-INTEGRATION-11 QA report approved-snapshot repair checks and fail conditions. |
| [local-migration-chain-blocker-repair-202605180007-workspace-member-function.md](local-migration-chain-blocker-repair-202605180007-workspace-member-function.md) | Records the RP-BETA-INTEGRATION-12 workspace member function signature repair and new blocker. |
| [local-migration-chain-blocker-repair-202605180007-workspace-member-function-checklist.md](local-migration-chain-blocker-repair-202605180007-workspace-member-function-checklist.md) | Provides RP-BETA-INTEGRATION-12 workspace member function repair checks and fail conditions. |
| [local-migration-chain-blocker-repair-202605180007-workspace-owner-admin-function.md](local-migration-chain-blocker-repair-202605180007-workspace-owner-admin-function.md) | Records the RP-BETA-INTEGRATION-13 workspace owner/admin function signature repair and new blocker. |
| [local-migration-chain-blocker-repair-202605180007-workspace-owner-admin-function-checklist.md](local-migration-chain-blocker-repair-202605180007-workspace-owner-admin-function-checklist.md) | Provides RP-BETA-INTEGRATION-13 workspace owner/admin function repair checks and fail conditions. |
| [local-migration-chain-blocker-repair-202605180008-storage-buckets-ownership.md](local-migration-chain-blocker-repair-202605180008-storage-buckets-ownership.md) | Records the RP-BETA-INTEGRATION-14 storage buckets ownership comment repair and local environment blocker. |
| [local-migration-chain-blocker-repair-202605180008-storage-buckets-ownership-checklist.md](local-migration-chain-blocker-repair-202605180008-storage-buckets-ownership-checklist.md) | Provides RP-BETA-INTEGRATION-14 storage buckets ownership repair checks and fail conditions. |
| [local-docker-environment-repair-and-storage-migration-retry.md](local-docker-environment-repair-and-storage-migration-retry.md) | Records the RP-BETA-INTEGRATION-15 Docker environment repair and storage migration retry result. |
| [local-docker-environment-repair-and-storage-migration-retry-checklist.md](local-docker-environment-repair-and-storage-migration-retry-checklist.md) | Provides RP-BETA-INTEGRATION-15 Docker and local Supabase retry checks and fail conditions. |
| [local-migration-chain-blocker-repair-202605200001-storage-upload-policy-comments.md](local-migration-chain-blocker-repair-202605200001-storage-upload-policy-comments.md) | Records the RP-BETA-INTEGRATION-16 storage upload policy comment repair and local chain pass. |
| [local-migration-chain-blocker-repair-202605200001-storage-upload-policy-comments-checklist.md](local-migration-chain-blocker-repair-202605200001-storage-upload-policy-comments-checklist.md) | Provides RP-BETA-INTEGRATION-16 storage upload policy comment repair checks and fail conditions. |
| [creative-skill-catalog-full-local-data-and-rls-verification.md](creative-skill-catalog-full-local-data-and-rls-verification.md) | Records the RP-BETA-INTEGRATION-17 full local Creative Skill catalog data and RLS verification. |
| [creative-skill-catalog-full-local-data-and-rls-verification-checklist.md](creative-skill-catalog-full-local-data-and-rls-verification-checklist.md) | Provides RP-BETA-INTEGRATION-17 full local catalog verification checks and fail conditions. |
| [end-to-end-beta-merge-readiness-and-commit-plan.md](end-to-end-beta-merge-readiness-and-commit-plan.md) | Records the RP-BETA-INTEGRATION-18 beta merge-readiness decision, validation results, blockers, and commit plan. |
| [end-to-end-beta-merge-readiness-and-commit-plan-checklist.md](end-to-end-beta-merge-readiness-and-commit-plan-checklist.md) | Provides RP-BETA-INTEGRATION-18 merge-readiness checks and fail conditions. |
| [sound-agent-planner-build-repair.md](sound-agent-planner-build-repair.md) | Records the RP-BETA-INTEGRATION-19 sound-agent planner build repair, validation results, and remaining beta blockers. |
| [sound-agent-planner-build-repair-checklist.md](sound-agent-planner-build-repair-checklist.md) | Provides RP-BETA-INTEGRATION-19 build repair checks and fail conditions. |
| [owner-staging-approval-and-commit-execution.md](owner-staging-approval-and-commit-execution.md) | Records the RP-BETA-INTEGRATION-20 owner-approved local staging and commit execution. |
| [owner-staging-approval-and-commit-execution-checklist.md](owner-staging-approval-and-commit-execution-checklist.md) | Provides RP-BETA-INTEGRATION-20 local commit execution checks and fail conditions. |
| [post-commit-merge-readiness-and-qwen-reconciliation-decision.md](post-commit-merge-readiness-and-qwen-reconciliation-decision.md) | Records the RP-BETA-INTEGRATION-21 post-commit merge-readiness review and Qwen reconciliation decision. |
| [post-commit-merge-readiness-and-qwen-reconciliation-decision-checklist.md](post-commit-merge-readiness-and-qwen-reconciliation-decision-checklist.md) | Provides RP-BETA-INTEGRATION-21 post-commit review checks and fail conditions. |
| [repo-audit.md](repo-audit.md) | Summarizes the current repo state, inspected architecture, gaps, constraints, and risks. |
| [source-of-truth-map.md](source-of-truth-map.md) | Maps likely Creative Skill domains to existing owner docs, types, mocks, migrations, and boundaries. |
| [duplicate-lane-checklist.md](duplicate-lane-checklist.md) | Lists duplicate-lane checks that future skill work must pass before adding new docs, contracts, or runtime concepts. |
| [open-pr-impact-map.md](open-pr-impact-map.md) | Captures current open PR overlap around AI graphics, tool routing, SoundSync, worker runtime, and 3D/browser tool lanes. |
| [implementation-handoff.md](implementation-handoff.md) | Provides the handoff for the next prompt, `RP-SKILLS-01 Creative Skill System doctrine`. |

## RP-SKILLS-01 Doctrine

`RP-SKILLS-01` adds the Creative Skill System architecture doctrine. It defines what a ReeditPro skill is and is not, how professional restraint works, how skills relate to tools and signature systems, and why every future selected skill must produce a planning contract before execution.

It still does not implement schema, runtime, prompts, migrations, providers, workers, UI, package changes, Supabase execution, or generation logic.

## RP-SKILLS-02 Universal Planning Envelope

`RP-SKILLS-02` defines the universal skill planning envelope that future specialized contracts inherit. It documents required context, planning reason quality, pseudo-record fields, timing/composition/audio/tool/credit/approval/QA/revision envelopes, rejected candidates, StoryTiming handoff, inheritance rules, examples, and anti-patterns.

It remains docs-only. It does not implement TypeScript, schema, migrations, runtime, prompts, providers, workers, UI, package changes, Supabase execution, browser/WebGL/canvas runtime, or generation logic.

## RP-SKILLS-03 Transition Planning Contract

`RP-SKILLS-03` defines the transition-specific planning contract. It documents transition doctrine, when to use or avoid transitions, transition families, intensity, edge behavior, timing/composition/audio pseudo-records, transition scoring, workflow and edit-preference guidance, credit/approval behavior, QA, revision behavior, examples, anti-patterns, and RP-SKILLS-04 handoff.

It remains docs-only. It does not implement TypeScript, schema, migrations, runtime, prompts, providers, workers, UI, package changes, Supabase execution, render/export, browser/WebGL/canvas runtime, or generation logic.

## RP-SKILLS-04 Overlay And Compositing Planning Contract

`RP-SKILLS-04` defines the overlay/compositing-specific planning contract. It documents overlay doctrine, roles, use/avoid rules, visual density, screen zones, safe areas, collision planning, persistent edge treatment, blend/opacity/material intent, tracking/masking/depth/occlusion planning, layer order, timing/composition pseudo-records, scoring, source/evidence safety, credit/approval behavior, QA, revision behavior, examples, anti-patterns, duplicate/overlap notes, and RP-SKILLS-05 handoff.

It remains docs-only. It does not implement TypeScript, schema, migrations, runtime, prompts, providers, workers, UI, package changes, Supabase execution, render/export, browser/WebGL/canvas runtime, Playwright execution, or generation logic.

## RP-SKILLS-05 Graphic Design Planning Contract

`RP-SKILLS-05` defines the Graphic Design / VisualExplain-specific planning contract. It documents graphic design doctrine, roles, use/avoid rules, information hierarchy, layout families, typography intent, density, style intent, source/proof safety, relationships to captions, overlays, motion design, 3D, B-roll, browser/app visuals, SoundSync, workflow context, edit preference, timing/structure pseudo-records, scoring, credit/approval behavior, QA, revision behavior, examples, anti-patterns, duplicate/overlap notes, and RP-SKILLS-06 handoff.

It remains docs-only. It does not implement TypeScript, schema, migrations, runtime, prompts, providers, workers, UI, package changes, Supabase execution, render/export, browser/WebGL/canvas runtime, Playwright execution, design tokens, or generation logic.

## RP-SKILLS-06 Motion Design Planning Contract

`RP-SKILLS-06` defines the motion-design-specific planning contract. It documents motion doctrine, motion roles, use/avoid rules, energy, motion language, easing intent, accessibility and comfort, repetition control, edit-preference and workflow guidance, relationships to transitions, overlays, graphics, captions, B-roll, 3D, Stroke Motion, Real Motion, browser/app visuals, SoundSync, and StoryTiming, timing/behavior/composition pseudo-records, scoring, credit/approval behavior, QA, revision behavior, examples, anti-patterns, duplicate/overlap notes, and RP-SKILLS-07 handoff.

It remains docs-only. It does not implement TypeScript, schema, migrations, runtime, animation code, prompts, providers, workers, UI, package changes, Supabase execution, render/export, browser/WebGL/canvas runtime, Playwright execution, design tokens, or generation logic.

## RP-SKILLS-07 3D Visual Planning Contract

`RP-SKILLS-07` defines the 3D-visual-specific planning contract. It documents 3D doctrine, role family, B-roll versus overlay versus screen interaction decisions, use/avoid rules, impact levels, style/material intent, camera/scale/depth, lighting/shadow/contact/reflection, tracking/masking/occlusion, source/model/provenance, timing/spatial/motion pseudo-records, scoring, edit-preference and workflow guidance, relationships to other skills, Real Motion boundary, browser/app safety, accessibility, repetition, credit/approval behavior, QA, revision behavior, examples, anti-patterns, duplicate/overlap notes, and RP-SKILLS-08 handoff.

It remains docs-only. It does not implement TypeScript, schema, migrations, runtime, animation code, 3D runtime, model loading, prompts, providers, workers, UI, package changes, Supabase execution, render/export, browser/WebGL/canvas runtime, Playwright execution, design tokens, or generation logic.

## RP-SKILLS-08 B-roll Planning Contract

`RP-SKILLS-08` defines the B-roll-specific planning contract. It documents B-roll doctrine, role family, source type/status, proof/context levels, full-frame versus inset/PIP/split-screen behavior, use/avoid rules, density, timing/source/composition/audio pseudo-records, scoring, edit-preference and workflow guidance, relationships to other skills, 3D boundary, browser/app/screen safety, accessibility/trust, repetition, credit/approval behavior, QA, revision behavior, examples, anti-patterns, duplicate/overlap notes, and RP-SKILLS-09 handoff.

It remains docs-only. It does not implement TypeScript, schema, migrations, runtime, capture code, media analysis code, stock/search integrations, generation code, prompts, providers, workers, UI, package changes, Supabase execution, render/export, browser/WebGL/canvas runtime, Playwright execution, design tokens, or app behavior.

## RP-SKILLS-09 Caption Planning Contract

`RP-SKILLS-09` defines the caption-specific planning contract. It documents caption doctrine, roles, source/accuracy models, use/avoid rules, density, style/readability, animation/emphasis, accessibility and multilingual future notes, source/proof/claim safety, timing around B-roll, graphics, and hero visuals, timing/text/placement pseudo-records, scoring, edit-preference and workflow guidance, relationships to other skills, credit/approval behavior, QA, revision behavior, examples, anti-patterns, duplicate/overlap notes, and RP-SKILLS-10 handoff.

It remains docs-only. It does not implement TypeScript, schema, migrations, runtime, caption rendering, ASR, transcript processing, translation, media analysis, browser capture, prompts, providers, workers, UI, package changes, Supabase execution, render/export, browser/WebGL/canvas runtime, Playwright execution, design tokens, or app behavior.

## RP-SKILLS-10 Sound/Music Planning Contract

`RP-SKILLS-10` defines the SoundSync/music/SFX/audio-support-specific planning contract. It documents sound/music doctrine, sound roles, source and rights/provenance models, use/avoid rules, mood and energy, music cues, beat maps, ducking and speech safety, SFX, ambience and room tone, lyrics policy, reference music DNA safety, generated music future boundaries, scoring, edit-preference and workflow guidance, relationships to other skills, accessibility/comfort/trust, repetition, credit/approval behavior, QA, revision behavior, examples, anti-patterns, duplicate/overlap notes, and RP-SKILLS-11 handoff.

It remains docs-only. It does not implement TypeScript, schema, migrations, runtime, audio generation, music generation, SFX generation, Lyria integration, audio mixing, mastering, media analysis, prompts, providers, workers, UI, package changes, Supabase execution, render/export, browser/WebGL/canvas runtime, Playwright execution, design tokens, or app behavior.

## RP-SKILLS-11 StoryTiming Coordination Contract

`RP-SKILLS-11` defines the StoryTiming coordination contract. It documents StoryTiming doctrine, prior-contract coordination, coordination inputs, lifecycle, time windows, primary focus, secondary support, visual/audio density, focus/density budgets, safe zones, caption/overlay/graphic/motion/transition/B-roll/3D/Real Motion/Stroke Motion/browser/app/SoundSync coordination rules, conflicts, resolution actions, permission gates, pseudo-records, scoring, edit-preference and workflow influence, credit/approval behavior, QA, revision behavior, examples, anti-patterns, duplicate/overlap notes, and RP-SKILLS-12 handoff.

It remains docs-only. It does not implement TypeScript, schema, migrations, runtime orchestration, media processing, audio processing, caption rendering, browser capture, 3D runtime, animation runtime, prompts, providers, workers, UI, package changes, Supabase execution, render/export, browser/WebGL/canvas runtime, Playwright execution, design tokens, or app behavior.

## RP-SKILLS-12 Edit Preference Creative Direction Contract

`RP-SKILLS-12` defines the Edit Preference Creative Direction contract. It documents preference doctrine, priority order, sources, confidence and strength, documentation-only preference profile and resolved snapshot pseudo-records, conflict resolution, visual density, motion intensity, transition energy, caption, B-roll, Graphic Design / VisualExplain, 3D, Real Motion, Stroke Motion, SoundSync/SFX, restraint, wow-factor, credit sensitivity, preferred/blocked skill behavior, skill scoring, creative concept generation, StoryTiming influence, workflow context, QA, revision behavior, examples, anti-patterns, duplicate/overlap notes, and RP-SKILLS-13 handoff.

It remains docs-only. It does not implement TypeScript, schema, migrations, preference runtime, settings UI, profile storage, runtime orchestration, media processing, audio processing, caption rendering, browser capture, 3D runtime, animation runtime, prompts, providers, workers, UI, package changes, Supabase execution, render/export, browser/WebGL/canvas runtime, Playwright execution, design tokens, or app behavior.

## RP-SKILLS-13 Skill Taxonomy And Family Catalog Contract

`RP-SKILLS-13` defines the Skill Taxonomy and Family Catalog contract. It documents taxonomy doctrine, skill/family/role/subskill/tool/provider/worker/prompt/UI boundaries, naming rules, canonical top-level families, family relationships, a grouped launch skill list, lifecycle and route/use statuses, recommendation levels, complexity, credit tendency, approval tendency, aliases, duplicate prevention, planning-contract mapping, source-of-truth mapping, documentation-only catalog/family/relationship pseudo-records, edit-preference influence, StoryTiming influence, credit/approval influence, tool/worker/provider boundaries, taxonomy QA, examples, anti-patterns, duplicate/overlap notes, and RP-SKILLS-14 handoff.

It remains docs-only. It does not implement TypeScript, schema, migrations, skill catalog runtime, skill resolver runtime, preference runtime, settings UI, profile storage, runtime orchestration, media processing, audio processing, caption rendering, browser capture, 3D runtime, animation runtime, prompts, providers, workers, UI, package changes, Supabase execution, render/export, browser/WebGL/canvas runtime, Playwright execution, design tokens, or app behavior.

## RP-SKILLS-14 Visual Opportunity Engine Contract

`RP-SKILLS-14` defines the Visual Opportunity Engine contract. It documents opportunity doctrine, the planning-flow position before creative concept ideation and skill selection, required input context, opportunity type families, opportunity source model, confidence and evidence model, statuses, documentation-only opportunity/restraint/question/run/score-review pseudo-records, scoring, priority bands, skill-family handoff mapping, relationships to skill taxonomy, edit preference, StoryTiming, source/proof safety, credit/approval, user questions, duplicate/repetition behavior, opportunity QA, examples, anti-patterns, duplicate/overlap notes, and RP-SKILLS-15 handoff.

It remains docs-only. It does not implement TypeScript, schema, migrations, visual analysis runtime, opportunity detector runtime, skill resolver runtime, skill catalog runtime, preference runtime, settings UI, profile storage, runtime orchestration, media processing, audio processing, caption rendering, browser capture, 3D runtime, animation runtime, prompts, providers, workers, UI, package changes, Supabase execution, render/export, browser/WebGL/canvas runtime, Playwright execution, design tokens, or app behavior.

## RP-SKILLS-15 Creative Concept Ideation Contract

`RP-SKILLS-15` defines the Creative Concept Ideation contract. It documents concept doctrine, the planning-flow position after visual opportunity detection and before skill candidate scoring, required input context, concept type families, visual/audio role models, candidate generation requirements, documentation-only candidate/selection/rejection/lower-cost/user-question/run pseudo-records, statuses, scoring, priority bands, relationships to visual opportunities, skill taxonomy, edit preference, StoryTiming, source/proof safety, credit/approval, tools/providers/workers, lower-cost alternatives, restraint concepts, duplicate/novelty behavior, concept QA, examples, anti-patterns, duplicate/overlap notes, and RP-SKILLS-16 handoff.

It remains docs-only. It does not implement TypeScript, schema, migrations, creative concept generator runtime, visual analysis runtime, opportunity detector runtime, skill resolver runtime, skill catalog runtime, preference runtime, settings UI, profile storage, runtime orchestration, media processing, audio processing, caption rendering, browser capture, 3D runtime, animation runtime, prompts, providers, workers, UI, package changes, Supabase execution, render/export, browser/WebGL/canvas runtime, Playwright execution, design tokens, or app behavior.

## RP-SKILLS-16 Skill Candidate Scoring And Resolver Contract

`RP-SKILLS-16` defines the Skill Candidate Scoring and Resolver contract. It documents resolver doctrine, the planning-flow position after Creative Concept Ideation and before route assembly, required input context, candidate mapping, candidate type/status models, documentation-only candidate/bundle/lower-cost/rejection/score-review/run/route-preview pseudo-records, recommendation levels, scoring formula, decision bands, preferred/blocked skill handling, must-follow/avoid rules, credit/approval behavior, lower-cost alternatives, StoryTiming readiness, source/proof safety, runtime-readiness metadata, skill relationships/conflicts, resolver QA, examples, anti-patterns, duplicate/overlap notes, and RP-SKILLS-17 handoff.

It remains docs-only. It does not implement TypeScript, schema, migrations, skill resolver runtime, scoring runtime, skill route runtime, skill catalog runtime, creative concept generator runtime, visual analysis runtime, opportunity detector runtime, preference runtime, settings UI, profile storage, runtime orchestration, media processing, audio processing, caption rendering, browser capture, 3D runtime, animation runtime, prompts, providers, workers, UI, package changes, Supabase execution, render/export, browser/WebGL/canvas runtime, Playwright execution, design tokens, or app behavior.

## RP-SKILLS-17 Skill Route And Plan Assembly Contract

`RP-SKILLS-17` defines the Skill Route and Plan Assembly contract. It documents route doctrine, the planning-flow position after Skill Candidate Scoring and before StoryTiming, credit/approval, schema/type, job/worker, QA, preview, and revision milestones, required input context, route decision/status models, documentation-only route/bundle/contract-attachment/required-record/lower-cost/conflict/QA/revision/user-summary/assembly-run pseudo-records, planning contract attachment, required plan record assembly, timing/scope rules, primary/support/optional roles, StoryTiming readiness, source/proof safety, approval scopes, credit impact, lower-cost route links, conflicts, QA, revisions, user-visible summaries, lifecycle, readiness gates, completeness formula, examples, anti-patterns, `signature_routes` compatibility, duplicate/overlap notes, and RP-SKILLS-18 handoff.

It remains docs-only. It does not implement TypeScript, schema, migrations, skill route runtime, plan assembly runtime, skill resolver runtime, scoring runtime, skill catalog runtime, creative concept generator runtime, visual analysis runtime, opportunity detector runtime, preference runtime, settings UI, profile storage, runtime orchestration, media processing, audio processing, caption rendering, browser capture, 3D runtime, animation runtime, prompts, providers, workers, UI, package changes, Supabase execution, render/export, browser/WebGL/canvas runtime, Playwright execution, design tokens, or app behavior.

## RP-SKILLS-18 Skill Credit And Approval Planning Contract

`RP-SKILLS-18` defines the Skill Credit and Approval Planning contract. It documents credit/approval doctrine, the planning-flow position after Skill Route and Plan Assembly and before user approval, future reservation, jobs/workers, QA, preview, revision, and export, required input context, credit impact values, estimate readiness, estimate categories and confidence, required/optional/premium/lower-cost behavior, documentation-only estimate item/lower-cost/approval group/approval copy/summary/revision impact pseudo-records, reservation boundaries, no-generation-before-approval gates, skill-family credit behavior, edit-preference credit sensitivity, StoryTiming influence, source/proof safety, revision credit behavior, audit/event expectations, QA, examples, anti-patterns, duplicate/overlap notes, and RP-SKILLS-19 handoff.

It remains docs-only. It does not implement TypeScript, schema, migrations, credit runtime, billing, Stripe, wallet, ledger, reservation, approval runtime, skill route runtime, plan assembly runtime, skill resolver runtime, scoring runtime, skill catalog runtime, creative concept generator runtime, visual analysis runtime, opportunity detector runtime, preference runtime, settings UI, profile storage, runtime orchestration, media processing, audio processing, music generation, SFX generation, caption rendering, browser capture, 3D runtime, animation runtime, prompts, providers, workers, UI, package changes, Supabase execution, render/export, browser/WebGL/canvas runtime, Playwright execution, design tokens, or app behavior.

## RP-SKILLS-19 Skill QA And Validation Contract

`RP-SKILLS-19` defines the Skill QA and Validation contract. It documents planning-not-execution QA doctrine, the planning-flow position before user-facing plan display, credit estimate display, approval, preview, revision, or future execution, required input context, QA stages, severity and status models, documentation-only requirement/result/report/repair pseudo-records, QA categories, planning completeness, professional taste, overuse and underuse checks, StoryTiming, captions, speech/sound, visual safety, source/proof safety, credit/approval compliance, user instruction and edit preference compliance, runtime boundaries, revision readiness, blocker/warning matrix, scoring, conceptual gates, examples, anti-patterns, existing edit-quality/planner-validation overlap, duplicate notes, and RP-SKILLS-20 handoff.

It remains docs-only. It does not implement TypeScript, schema, migrations, QA runtime, validation scripts, diagnostics scripts, credit runtime, billing, Stripe, wallet, ledger, reservation, approval runtime, skill route runtime, plan assembly runtime, skill resolver runtime, scoring runtime, skill catalog runtime, creative concept generator runtime, visual analysis runtime, opportunity detector runtime, preference runtime, settings UI, profile storage, runtime orchestration, media processing, audio processing, music generation, SFX generation, caption rendering, browser capture, 3D runtime, animation runtime, prompts, providers, workers, UI, package changes, Supabase execution, render/export, browser/WebGL/canvas runtime, Playwright execution, design tokens, or app behavior.

## RP-SKILLS-20 Skill Diagnostics And Static Validation Contract

`RP-SKILLS-20` defines the Skill Diagnostics and Static Validation contract. It documents diagnostics-not-execution doctrine, the roadmap position from docs-only contracts through future static checks, TypeScript contracts, schemas, fixtures, planner integration, CI/static boundaries, and runtime gates, diagnostic scope categories, static validation levels, severity and status models, documentation-only diagnostic rule/result/run pseudo-records, docs completeness, source-of-truth integrity, taxonomy, planning contract, pseudo-record, checklist, prompt duplication, runtime unlock, package mutation, migration timing, future TypeScript/schema/mock/planner diagnostics, credit/approval, source/proof, StoryTiming, QA diagnostics, rule keys, command boundaries, examples, anti-patterns, existing diagnostics overlap, duplicate notes, and RP-SKILLS-21 handoff.

It remains docs-only. It does not implement TypeScript, schema, migrations, CI workflows, diagnostics scripts, validation scripts, QA runtime, diagnostics runtime, validation runtime, credit runtime, billing, Stripe, wallet, ledger, reservation, approval runtime, skill route runtime, plan assembly runtime, skill resolver runtime, scoring runtime, skill catalog runtime, creative concept generator runtime, visual analysis runtime, opportunity detector runtime, preference runtime, settings UI, profile storage, runtime orchestration, media processing, audio processing, music generation, SFX generation, caption rendering, browser capture, 3D runtime, animation runtime, prompts, providers, workers, UI, package changes, Supabase execution, render/export, browser/WebGL/canvas runtime, Playwright execution, design tokens, or app behavior.

## RP-SKILLS-21 TypeScript Creative Skill Contracts

`RP-SKILLS-21` defines the first TypeScript-only Creative Skill contract layer. It adds typed shapes for Creative Skill taxonomy, universal and specialized skill planning, edit preference snapshots, visual opportunities, creative concepts, skill candidates, skill routes and plan assembly, credit/approval planning, QA, and diagnostics/static validation metadata.

It remains type-only. It does not implement planner logic, scoring logic, resolver logic, route assembly runtime, QA runtime, diagnostics runtime, validation scripts, schemas, migrations, Supabase execution, provider calls, workers, UI, package changes, render/export, media processing, audio generation, music generation, SFX generation, caption rendering, browser capture, 3D runtime, animation runtime, browser/WebGL/canvas runtime, Playwright execution, design tokens, or app behavior.

TypeScript files added:

- `src/types/creative-skills-core.ts`
- `src/types/creative-skill-plans.ts`
- `src/types/creative-skill-workflow.ts`
- `src/types/creative-skill-qa.ts`
- `src/types/creative-skill-diagnostics.ts`

## RP-SKILLS-22 Creative Skill Mock Records And Fixture Contracts

`RP-SKILLS-22` adds `src/lib/mock-creative-skill-records.ts` as static mock data that exercises the RP-SKILLS-21 contracts end to end. It includes taxonomy/catalog records, aliases, relationships, contract mappings, edit preferences, visual opportunities, creative concepts, skill candidates, routes, specialized skill plans, StoryTiming coordination records, credit/approval planning records, QA records, diagnostics records, and grouped scenarios.

It remains static fixture data only. It does not implement planner logic, scoring or resolver functions, validation scripts, schemas, migrations, Supabase execution, provider calls, workers, UI, package changes, render/export, media processing, browser capture, audio generation, music generation, SFX generation, caption rendering, 3D runtime, animation runtime, browser/WebGL/canvas runtime, or app behavior.

Fixture scenarios added:

- `clean_talking_head_restraint`
- `premium_real_estate_3d_optional`
- `product_demo_screen_interaction`
- `education_visual_explain`
- `marketing_ad_hero`
- `testimonial_trust_first`

Recommended next prompt: `RP-SKILLS-23 - Creative Skill Type Contract Reconciliation and Narrow Validation`.

## RP-SKILLS-23 Creative Skill Type Contract Reconciliation

`RP-SKILLS-23` reconciles the RP-SKILLS-21 TypeScript contracts and RP-SKILLS-22 static fixtures against existing repo type owners and docs. The reconciliation is recorded in [type-contract-reconciliation-report.md](type-contract-reconciliation-report.md).

It remains reconciliation-only. It does not implement planner logic, scoring or resolver functions, validation scripts, diagnostics scripts, schemas, migrations, Supabase execution, provider calls, workers, UI, package changes, render/export, media processing, browser capture, audio generation, music generation, SFX generation, caption rendering, 3D runtime, animation runtime, browser/WebGL/canvas runtime, or app behavior.

Recommended next prompt: `RP-SKILLS-24 - Creative Skill Schema Planning Contract`.

## RP-SKILLS-24 Creative Skill Schema Planning Contract

`RP-SKILLS-24` defines the Creative Skill schema planning contract. It maps RP-SKILLS docs, RP-SKILLS-21 TypeScript contracts, RP-SKILLS-22 static fixtures, and RP-SKILLS-23 reconciliation findings to future table groups, ownership fields, RLS/security expectations, migration sequencing, source/proof safety, approval/credit foreign-key strategy, StoryTiming references, QA/diagnostics records, lifecycle/versioning, JSON strategy, query/index needs, schema QA, examples, and anti-patterns.

It remains docs-only and no-SQL. It does not create migrations, SQL, database schema, RLS policies, Supabase connections, TypeScript contracts, runtime code, providers, workers, package changes, UI, render/export, or app behavior.

Recommended next prompt: `RP-SKILLS-25 - Creative Skill Supabase Migration Blueprint and RLS Readiness Contract`.

## RP-SKILLS-25 Creative Skill Supabase Migration Blueprint And RLS Readiness Contract

`RP-SKILLS-25` defines the Creative Skill Supabase migration blueprint and RLS readiness contract. It turns RP-SKILLS-24 schema planning into ordered future migration phases, table-by-table blueprint summaries, RLS/security readiness, FK strategy, status/enum readiness, JSON strategy, data retention and supersession, rollback and seed strategy, validation planning, query/index readiness, examples, anti-patterns, and RP-SKILLS-26 handoff.

It remains docs-only, no-SQL, and no-migration. It does not create Supabase migrations, SQL files, seed scripts, RLS policies, database schema, Supabase connections, TypeScript contracts, runtime services, planner logic, validation scripts, diagnostics scripts, CI workflows, provider calls, workers, jobs, render/export, UI, package changes, credentials, or app behavior.

Recommended next prompt: `RP-SKILLS-26 - Creative Skill Catalog Migration Readiness Review`.

## RP-SKILLS-26 Creative Skill Catalog Migration Readiness Review

`RP-SKILLS-26` defines the Creative Skill Catalog Migration Readiness Review. It evaluates whether the first future catalog-only migration package is ready for a later SQL migration prompt, compares the proposed catalog tables against RP-SKILLS docs, TypeScript contracts, mock fixtures, existing migrations, and signature-system ownership, and records the final decision `ready_with_warnings`.

It remains docs-only, no-SQL, and no-migration. It does not create Supabase migrations, SQL files, seed scripts, RLS policies, database schema, Supabase connections, TypeScript contracts, mock fixture changes, runtime services, planner logic, validation scripts, diagnostics scripts, CI workflows, provider calls, workers, jobs, render/export, UI, package changes, credentials, or app behavior.

Recommended next prompt: `RP-SKILLS-27 - Creative Skill Catalog Supabase Migration Implementation`.

## RP-SKILLS-27 Creative Skill Catalog Supabase Migration Implementation

`RP-SKILLS-27` adds the first local-only Creative Skill catalog migration package and records the implementation in [creative-skill-catalog-migration-implementation-report.md](creative-skill-catalog-migration-implementation-report.md).

Created migration file:

- `supabase/migrations/202606250001_creative_skill_catalog_foundation.sql`

The migration defines six catalog metadata tables only: `creative_skill_families`, `creative_skills`, `creative_skill_aliases`, `creative_skill_relationships`, `creative_skill_contract_mappings`, and `creative_skill_duplicate_reviews`.

The migration was not applied, executed, reset, deployed, or connected to Supabase. It adds no seed data, runtime behavior, TypeScript contracts, mock fixtures, package changes, UI, providers, workers, jobs, credit reservations, approval runtime, render/export behavior, browser/capture/media runtime, audio generation, caption rendering, or app behavior.

Recommended next prompt: `RP-SKILLS-28 - Creative Skill Catalog Migration Static Review and Canonical Seed Readiness`.

## RP-SKILLS-28 Creative Skill Catalog Migration Static Review And Seed Readiness

`RP-SKILLS-28` statically reviews the RP-SKILLS-27 migration and records canonical seed readiness in [creative-skill-catalog-migration-static-review-and-seed-readiness.md](creative-skill-catalog-migration-static-review-and-seed-readiness.md). The concise checklist is [creative-skill-catalog-migration-static-review-and-seed-readiness-checklist.md](creative-skill-catalog-migration-static-review-and-seed-readiness-checklist.md).

Migration static-review decision: `migration_static_review_repaired_and_passed`.

Canonical seed-readiness decision: `not_ready_seed_metadata_incomplete`.

The existing RP-SKILLS-27 migration was patched for concrete static review defects only. The migration remains unapplied, and no seed data was added. No Supabase connection, SQL execution, migration application, package change, TypeScript change, mock fixture change, runtime behavior, UI, provider call, worker, job, render/export, or app behavior was added.

Recommended next prompt: `RP-SKILLS-29 - Creative Skill Catalog Canonical Seed Manifest Completion`.

## RP-SKILLS-29 Creative Skill Catalog Canonical Seed Manifest Completion

`RP-SKILLS-29` completes the static canonical seed manifest for the Creative Skill catalog. It creates [manifests/creative-skill-catalog-canonical-seed-manifest.json](manifests/creative-skill-catalog-canonical-seed-manifest.json), [manifests/README.md](manifests/README.md), [creative-skill-catalog-canonical-seed-manifest-completion.md](creative-skill-catalog-canonical-seed-manifest-completion.md), and [creative-skill-catalog-canonical-seed-manifest-completion-checklist.md](creative-skill-catalog-canonical-seed-manifest-completion-checklist.md).

Manifest coverage: 21 canonical families, 140 canonical skills, 9 aliases, 20 relationships, and 450 contract mappings. Readiness decision: `seed_manifest_ready_with_warnings`.

The manifest is static review metadata only. It does not add SQL, seed rows, seed scripts, seed migrations, Supabase connections, TypeScript changes, mock fixture changes, package changes, runtime behavior, UI, providers, workers, jobs, credit runtime, approval runtime, render/export, browser/media, audio/music generation, caption runtime, WebGL/canvas/3D runtime, or app behavior. The RP-SKILLS-27 migration remains unapplied.

Recommended next prompt: `RP-SKILLS-30 - Creative Skill Catalog Canonical Seed Manifest Static Review and Seed Migration Readiness`.

## RP-SKILLS-30 Creative Skill Catalog Canonical Seed Manifest Static Review And Seed Migration Readiness

`RP-SKILLS-30` statically reviews the RP-SKILLS-29 manifest against TypeScript unions, migration constraints, source paths, aliases, relationships, contract mappings, label mappings, expected plan record names, and seed projection rules. It creates [creative-skill-catalog-canonical-seed-manifest-static-review-and-seed-migration-readiness.md](creative-skill-catalog-canonical-seed-manifest-static-review-and-seed-migration-readiness.md) and [creative-skill-catalog-canonical-seed-manifest-static-review-and-seed-migration-readiness-checklist.md](creative-skill-catalog-canonical-seed-manifest-static-review-and-seed-migration-readiness-checklist.md).

Manifest static-review decision: `seed_manifest_static_review_repaired_and_passed`.

Seed-migration-readiness decision: `ready_with_warnings_for_seed_migration`.

Validated counts: 21 families, 140 skills, 9 aliases, 20 relationships, 450 contract mappings, and 0 duplicate-review rows. The manifest was patched only for deterministic ordering. No seed migration was created, and the foundation migration remains unapplied.

Recommended next prompt: `RP-SKILLS-31 - Creative Skill Catalog Canonical Seed Migration Implementation`.

## RP-SKILLS-31 Creative Skill Catalog Canonical Seed Migration Implementation

`RP-SKILLS-31` creates the local-only seed migration `supabase/migrations/202606250002_creative_skill_catalog_canonical_seed.sql` from the reviewed canonical manifest. It also records implementation details in [creative-skill-catalog-canonical-seed-migration-implementation-report.md](creative-skill-catalog-canonical-seed-migration-implementation-report.md).

Seeded metadata counts in the migration: 21 families, 140 skills, 9 aliases, 20 relationships, 450 contract mappings, and 0 duplicate-review rows.

The migration is local-only and unapplied. The RP-SKILLS-27 foundation migration is also unapplied. No Supabase connection, SQL execution, migration application, runtime behavior, UI, providers, workers, package changes, TypeScript changes, mock fixture changes, manifest changes, credit runtime, approval runtime, render/export, browser/media, audio/music generation, caption runtime, WebGL/canvas/3D runtime, or app behavior occurred.

Recommended next prompt: `RP-SKILLS-32 - Creative Skill Catalog Canonical Seed Migration Static Review and Local Apply Readiness`.

## RP-SKILLS-32 Creative Skill Catalog Canonical Seed Migration Static Review And Local Apply Readiness

`RP-SKILLS-32` statically reviews the foundation migration and canonical seed migration against the manifest, TypeScript contracts, migration constraints, fail-closed assertions, and RLS/privilege boundaries. It creates [creative-skill-catalog-canonical-seed-migration-static-review-and-local-apply-readiness.md](creative-skill-catalog-canonical-seed-migration-static-review-and-local-apply-readiness.md) and [creative-skill-catalog-canonical-seed-migration-static-review-and-local-apply-readiness-checklist.md](creative-skill-catalog-canonical-seed-migration-static-review-and-local-apply-readiness-checklist.md).

Seed migration static-review decision: `seed_migration_static_review_passed`.

Local apply readiness decision: `blocked_local_apply_repository_not_ready`.

The seed migration did not require a patch. Both migrations remain unapplied. No Supabase CLI, Supabase connection, SQL execution, migration application, database/container startup, runtime behavior, UI, providers, workers, package changes, TypeScript changes, mock fixture changes, manifest changes, credit runtime, approval runtime, render/export, browser/media, audio/music generation, caption runtime, WebGL/canvas/3D runtime, or app behavior occurred.

Recommended next prompt: `RP-SKILLS-33 - Creative Skill Local Supabase Readiness Repair`.

## RP-SKILLS-33 Creative Skill Local Supabase Readiness Repair

`RP-SKILLS-33` documents the owner decision needed before adding local Supabase config for a future disposable local apply. It creates [creative-skill-local-supabase-readiness-repair.md](creative-skill-local-supabase-readiness-repair.md) and [creative-skill-local-supabase-readiness-repair-checklist.md](creative-skill-local-supabase-readiness-repair-checklist.md).

Config repair decision: `owner_decision_required`.

Local apply readiness decision: `blocked_owner_decision_required`.

No `supabase/config.toml`, `supabase/config.example.toml`, `supabase/seed.sql`, SQL, migration, credential, token, project ref, production URL, runtime behavior, UI, providers, workers, package change, TypeScript change, mock fixture change, manifest change, credit runtime, approval runtime, render/export, browser/media, audio/music generation, caption runtime, WebGL/canvas/3D runtime, or app behavior was added.

No Supabase CLI, Supabase connection, SQL execution, migration application, database/container startup, deployment, build, provider call, worker execution, render/export, or app runtime occurred.

Recommended next prompt: `RP-SKILLS-34 - Creative Skill Local Supabase Owner Decision Packet`.

## RP-SKILLS-34 Creative Skill Local Supabase Owner Decision Packet

`RP-SKILLS-34` creates the owner decision packet for local Supabase config readiness. It creates [creative-skill-local-supabase-owner-decision-packet.md](creative-skill-local-supabase-owner-decision-packet.md) and [creative-skill-local-supabase-owner-decision-packet-checklist.md](creative-skill-local-supabase-owner-decision-packet-checklist.md).

Decision outcome: `awaiting_owner_approval`.

Recommended approval text: `Approve RP-SKILLS-34 recommended decisions and proceed with RP-SKILLS-35.`

No `supabase/config.toml`, `supabase/config.example.toml`, `supabase/seed.sql`, SQL, migration, credential, token, project ref, production URL, runtime behavior, UI, providers, workers, package change, TypeScript change, mock fixture change, manifest change, credit runtime, approval runtime, render/export, browser/media, audio/music generation, caption runtime, WebGL/canvas/3D runtime, or app behavior was added.

No Supabase CLI, Supabase connection, SQL execution, migration application, database/container startup, deployment, build, provider call, worker execution, render/export, or app runtime occurred.

## RP-SKILLS-35 Creative Skill Local Supabase Config Creation

`RP-SKILLS-35` creates the local-only Supabase config for future disposable local migration verification. It creates [creative-skill-local-supabase-config-creation.md](creative-skill-local-supabase-config-creation.md), [creative-skill-local-supabase-config-creation-checklist.md](creative-skill-local-supabase-config-creation-checklist.md), and `supabase/config.toml`.

Config decision: `local_config_created`.

Local apply readiness decision: `ready_with_warnings_for_disposable_local_apply_prompt`.

Config file: `supabase/config.toml`.

Local project ID: `reeditpro-local`.

No `supabase/config.example.toml`, `supabase/seed.sql`, SQL, migration, credential, token, remote project ref, production URL, runtime behavior, UI, providers, workers, package change, TypeScript change, mock fixture change, manifest change, credit runtime, approval runtime, render/export, browser/media, audio/music generation, caption runtime, WebGL/canvas/3D runtime, or app behavior was added.

No Supabase CLI, Supabase connection, SQL execution, migration application, database/container startup, deployment, build, provider call, worker execution, render/export, or app runtime occurred.

Recommended next prompt: `RP-SKILLS-36 - Creative Skill Catalog Migrations Disposable Local Apply and Data Verification`.

## RP-SKILLS-36 Creative Skill Catalog Migrations Disposable Local Apply And Data Verification

`RP-SKILLS-36` attempted the first disposable local Supabase verification pass for the Creative Skill catalog migrations. It creates [creative-skill-catalog-migrations-disposable-local-apply-and-data-verification.md](creative-skill-catalog-migrations-disposable-local-apply-and-data-verification.md) and [creative-skill-catalog-migrations-disposable-local-apply-and-data-verification-checklist.md](creative-skill-catalog-migrations-disposable-local-apply-and-data-verification-checklist.md).

Local apply verification decision: `needs_owner_decision`.

Result summary:

- Static remote-safety preflight passed.
- Supabase CLI, Docker, Docker daemon, and `psql` were available.
- `supabase start` failed before migration application because `0.0.0.0:54322` was already allocated by an existing local Supabase stack named `reeditpro`.
- No migration application occurred.
- Table count, key parity, FK/counterpart, metadata, RLS/privilege, and fail-closed SQL verification did not run.
- Expected Creative Skill catalog counts remain 21 families, 140 skills, 9 aliases, 20 relationships, 450 contract mappings, and 0 duplicate reviews.

No remote Supabase, `supabase link`, `supabase db push`, remote SQL, production deploy, migration edit, manifest edit, TypeScript change, mock fixture change, package change, runtime behavior, UI, providers, workers, render/export, or app behavior occurred.

Recommended next prompt: `RP-SKILLS-37 - Creative Skill Local Supabase Environment Repair`.

## RP-SKILLS-37 Creative Skill Local Supabase Environment Repair Decision Packet

`RP-SKILLS-37` creates the docs-only owner decision packet for the RP-SKILLS-36 local Supabase port conflict. It creates [creative-skill-local-supabase-environment-repair-decision-packet.md](creative-skill-local-supabase-environment-repair-decision-packet.md) and [creative-skill-local-supabase-environment-repair-decision-packet-checklist.md](creative-skill-local-supabase-environment-repair-decision-packet-checklist.md).

Decision outcome: `awaiting_owner_repair_choice`.

Recommended repair option: Option C, patch `reeditpro-local` to a non-conflicting local-only port range in a future RP-SKILLS-38 prompt, because it preserves the existing local `reeditpro` stack.

Repair options documented:

- Option A: owner manually stops existing local `reeditpro` stack.
- Option B: owner approves Codex to stop only exact project ID `reeditpro`, without `--all` and without `--no-backup`.
- Option C: owner approves patching `reeditpro-local` to non-conflicting local ports.
- Option D: pause local apply verification.

No Supabase CLI, SQL, stop/start/db reset command, migration application, database/container start or stop, config patch, migration edit, manifest edit, TypeScript change, mock fixture change, package change, runtime behavior, UI, providers, workers, render/export, or app behavior occurred.

Recommended next owner approval message:

`Approve RP-SKILLS-37 Option C: Patch reeditpro-local to a non-conflicting local-only port range and proceed with RP-SKILLS-38 Creative Skill Local Supabase Port Repair.`

## RP-SKILLS-38 Creative Skill Local Supabase Port Repair

`RP-SKILLS-38` implements the owner-approved Option C repair by patching only `supabase/config.toml` and documenting the new local-only `reeditpro-local` port band. It creates [creative-skill-local-supabase-port-repair.md](creative-skill-local-supabase-port-repair.md) and [creative-skill-local-supabase-port-repair-checklist.md](creative-skill-local-supabase-port-repair-checklist.md).

Config decision: `local_port_repair_completed`.

Selected local-only port band:

- DB shadow: `55430`
- API: `55431`
- DB: `55432`
- Studio: `55433`
- Inbucket: `55434`
- SMTP: `55435`
- POP3: `55436`
- Analytics: `55437`
- Edge inspector: `55438`
- Pooler: `55439`

Local apply readiness decision: `ready_with_warnings_for_disposable_local_apply_prompt`.

No Supabase CLI, Supabase connection, SQL, migration application, database/container start or stop, seed file, config example, migration edit, manifest edit, TypeScript change, mock fixture change, package change, runtime behavior, UI, providers, workers, render/export, or app behavior occurred.

Recommended next prompt: `RP-SKILLS-39 - Creative Skill Catalog Migrations Disposable Local Apply and Data Verification Retry`.

## RP-SKILLS-39 Creative Skill Catalog Migrations Disposable Local Apply And Data Verification Retry

`RP-SKILLS-39` attempted the disposable local Supabase apply retry after the RP-SKILLS-38 port repair. It creates [creative-skill-catalog-migrations-disposable-local-apply-and-data-verification-retry.md](creative-skill-catalog-migrations-disposable-local-apply-and-data-verification-retry.md) and [creative-skill-catalog-migrations-disposable-local-apply-and-data-verification-retry-checklist.md](creative-skill-catalog-migrations-disposable-local-apply-and-data-verification-retry-checklist.md).

Local apply verification decision: `blocked_migration_failure`.

Result summary:

- Static remote-safety preflight passed.
- Patched ports `55430` through `55439` were free before start.
- Supabase CLI `2.105.0`, Docker `29.5.2`, Docker daemon, and `psql 18.4` were available.
- The local `reeditpro-local` stack started on the patched ports.
- `supabase db reset --local --no-seed` failed at `202605130007_generation_providers_generated_assets.sql`.
- Sanitized failure: `column reference "description" is ambiguous (SQLSTATE 42702)`.
- Creative Skill catalog migrations were not reached, so catalog counts, key parity, FK/counterpart checks, RLS/privilege checks, and fail-closed probes did not run.

Expected Creative Skill catalog counts remain 21 families, 140 skills, 9 aliases, 20 relationships, 450 contract mappings, and 0 duplicate reviews.

No remote Supabase, `supabase link`, `supabase db push`, remote SQL, production deploy, migration edit, manifest edit, TypeScript change, mock fixture change, package change, runtime behavior, UI, providers, workers, render/export, or app behavior occurred.

Recommended next prompt: `RP-SKILLS-40 - Creative Skill Catalog Migration Local Failure Repair`.

## RP-SKILLS-40 Creative Skill Catalog Migration Local Failure Repair

`RP-SKILLS-40` repairs the local migration-chain blocker from RP-SKILLS-39. It creates [creative-skill-catalog-migration-local-failure-repair.md](creative-skill-catalog-migration-local-failure-repair.md) and [creative-skill-catalog-migration-local-failure-repair-checklist.md](creative-skill-catalog-migration-local-failure-repair-checklist.md).

Repair decision: `migration_failure_repaired_but_new_blocker_found`.

Result summary:

- The failing `generation_provider_models` seed insert in `202605130007_generation_providers_generated_assets.sql` is now qualified so seed-owned model fields come from `seed`.
- Local reset now passes `202605130007_generation_providers_generated_assets.sql`.
- Local reset also passes `202605130008_render_preview_export_revision_qa.sql`.
- The chain now stops at `202605180001_reeditpro_core_workspace_projects.sql`.
- New sanitized blocker: `column "current_edit_session_id" referenced in foreign key constraint does not exist (SQLSTATE 42703)`.
- Creative Skill catalog migrations were still not reached, so minimal Creative Skill smoke did not run.

No remote Supabase, `supabase link`, `supabase db push`, remote SQL, production deploy, Creative Skill migration edit, manifest edit, TypeScript change, mock fixture change, package change, runtime behavior, UI, providers, workers, render/export, or app behavior occurred.

Recommended next prompt: `RP-SKILLS-41 - Local Migration Chain Blocker Repair for 202605180001_reeditpro_core_workspace_projects.sql`.

## RP-BETA-INTEGRATION-01 Beta Integration Merge Readiness

`RP-BETA-INTEGRATION-01` creates [beta-integration-merge-readiness-report.md](beta-integration-merge-readiness-report.md).

Beta integration decision: `blocked_not_merge_ready`.

Summary:

- RP-SKILLS and Qwen beta are separate clones of the same GitHub remote, not linked worktrees.
- The known `current_edit_session_id` blocker in `202605180001_reeditpro_core_workspace_projects.sql` was repaired.
- Local Supabase reset now reaches a new same-migration blocker: `column "owner_id" does not exist (SQLSTATE 42703)`.
- Creative Skill catalog migrations were still not reached, so catalog smoke/RLS verification did not run.
- Qwen beta validation passed in `/Users/macuser/Developer/REeditpro`, but those files were not copied or merged into the RP-SKILLS repo.
- RP-SKILLS lint and selected smoke checks passed; RP-SKILLS build remains blocked by existing Sound Agent type errors.
- No files were staged, no commits were created, and no local merge was performed.

Recommended next prompt: `RP-BETA-INTEGRATION-02 - Local Migration Chain Repair for 202605180001 Workspace Compatibility`.

## RP-BETA-INTEGRATION-02 Local Migration Chain Repair

`RP-BETA-INTEGRATION-02` creates [local-migration-chain-blocker-repair-202605180001-owner-id.md](local-migration-chain-blocker-repair-202605180001-owner-id.md) and [local-migration-chain-blocker-repair-202605180001-owner-id-checklist.md](local-migration-chain-blocker-repair-202605180001-owner-id-checklist.md).

Repair decision: `local_chain_blocker_repaired_but_new_blocker_found`.

Summary:

- The `workspaces.owner_id` and `projects.owner_id` compatibility gap in `202605180001_reeditpro_core_workspace_projects.sql` was repaired.
- Local reset now passes the previous owner-index blocker.
- Local reset now stops at a new same-migration blocker: `column "edit_session_id" does not exist (SQLSTATE 42703)`.
- Failing statement: `create index if not exists idx_chat_messages_session_created on public.chat_messages(edit_session_id, created_at)`.
- Creative Skill catalog migrations were still not reached, so catalog smoke/RLS verification did not run.
- No staging, commit, merge, push, deploy, remote Supabase, package, runtime, UI, provider, worker, or app behavior work occurred.

Recommended next prompt: `RP-BETA-INTEGRATION-03 - Local Migration Chain Repair for 202605180001 Chat Message Session Compatibility`.

## RP-BETA-INTEGRATION-03 Local Migration Chain Repair

`RP-BETA-INTEGRATION-03` creates [local-migration-chain-blocker-repair-202605180001-chat-message-session.md](local-migration-chain-blocker-repair-202605180001-chat-message-session.md) and [local-migration-chain-blocker-repair-202605180001-chat-message-session-checklist.md](local-migration-chain-blocker-repair-202605180001-chat-message-session-checklist.md).

Repair decision: `local_chain_blocker_repaired_but_new_blocker_found`.

Summary:

- The `chat_messages.edit_session_id` compatibility gap in `202605180001_reeditpro_core_workspace_projects.sql` was repaired with a nullable compatibility column and idempotent FK.
- The existing `idx_chat_messages_session_created` index remains on `edit_session_id, created_at` because newer edit-planning docs, TypeScript records, and RLS policies use `edit_session_id`.
- Local reset now passes the previous chat-message blocker.
- Local reset now stops at a new next-migration blocker: `column "status" does not exist (SQLSTATE 42703)`.
- Failing statement: `create index if not exists idx_media_assets_project_status on public.media_assets(project_id, status)`.
- Creative Skill catalog migrations were still not reached, so catalog smoke/RLS verification did not run.
- No staging, commit, merge, push, deploy, remote Supabase, package, runtime, UI, provider, worker, or app behavior work occurred.

Recommended next prompt: `RP-BETA-INTEGRATION-04 - Local Migration Chain Repair for 202605180002 Media Asset Status Compatibility`.

## RP-BETA-INTEGRATION-04 Local Migration Chain Repair

`RP-BETA-INTEGRATION-04` creates [local-migration-chain-blocker-repair-202605180002-media-asset-status.md](local-migration-chain-blocker-repair-202605180002-media-asset-status.md) and [local-migration-chain-blocker-repair-202605180002-media-asset-status-checklist.md](local-migration-chain-blocker-repair-202605180002-media-asset-status-checklist.md).

Repair decision: `local_chain_blocker_repaired_but_new_blocker_found`.

Summary:

- The `media_assets.status` compatibility gap in `202605180002_reeditpro_media_source_sequence.sql` was repaired with a `text` status column, default/backfill to `uploaded`, and `not null`.
- The existing `idx_media_assets_project_status` index remains on `project_id, status` because schema docs and TypeScript model generic media asset status.
- Local reset now passes the previous media-asset blocker.
- Local reset now stops at a new next-migration blocker: `column "edit_plan_version_id" does not exist (SQLSTATE 42703)`.
- Failing statement: `create index if not exists idx_edit_plan_segments_plan_order on public.edit_plan_segments(edit_plan_version_id, segment_order)`.
- Creative Skill catalog migrations were still not reached, so catalog smoke/RLS verification did not run.
- No staging, commit, merge, push, deploy, remote Supabase, package, runtime, UI, provider, worker, or app behavior work occurred.

Recommended next prompt: `RP-BETA-INTEGRATION-05 - Local Migration Chain Repair for 202605180003 Edit Plan Segment Version Compatibility`.

## RP-BETA-INTEGRATION-05 Local Migration Chain Repair

`RP-BETA-INTEGRATION-05` creates [local-migration-chain-blocker-repair-202605180003-edit-plan-segment-version.md](local-migration-chain-blocker-repair-202605180003-edit-plan-segment-version.md) and [local-migration-chain-blocker-repair-202605180003-edit-plan-segment-version-checklist.md](local-migration-chain-blocker-repair-202605180003-edit-plan-segment-version-checklist.md).

Repair decision: `edit_plan_version_nullable_fk_compatibility_repair`.

Local reset decision: `local_chain_blocker_repaired_but_new_blocker_found`.

Summary:

- The `edit_plan_segments.edit_plan_version_id` compatibility gap in `202605180003_reeditpro_intent_plan_versions.sql` was repaired with a nullable `uuid` column and idempotent FK to `edit_plan_versions(id)`.
- The existing `idx_edit_plan_segments_plan_order` index remains on `edit_plan_version_id, segment_order`.
- No backfill was added because older `edit_plan_id` segments do not have deterministic version rows in this migration.
- Local reset now passes the previous `edit_plan_version_id` blocker.
- Local reset now stops at a new next-migration blocker: `column "approved_plan_snapshot_id" referenced in foreign key does not exist (SQLSTATE 42703)`.
- Failing migration: `202605180004_reeditpro_credits_approval_snapshots.sql`.
- Creative Skill catalog migrations were still not reached, so catalog smoke/RLS verification did not run.
- No staging, commit, merge, push, deploy, remote Supabase, package, runtime, UI, provider, worker, or app behavior work occurred.

Recommended next prompt: `RP-BETA-INTEGRATION-06 - Local Migration Chain Repair for 202605180004 Approved Plan Snapshot Compatibility`.

## RP-BETA-INTEGRATION-06 Local Migration Chain Repair

`RP-BETA-INTEGRATION-06` creates [local-migration-chain-blocker-repair-202605180004-approved-plan-snapshot.md](local-migration-chain-blocker-repair-202605180004-approved-plan-snapshot.md) and [local-migration-chain-blocker-repair-202605180004-approved-plan-snapshot-checklist.md](local-migration-chain-blocker-repair-202605180004-approved-plan-snapshot-checklist.md).

Repair decision: `approved_plan_snapshot_nullable_fk_compatibility_repair`.

Local reset decision: `local_chain_blocker_repaired_but_new_blocker_found`.

Summary:

- The `approved_plan_snapshot_id` compatibility gap in `202605180004_reeditpro_credits_approval_snapshots.sql` was repaired for `credit_reservations` and `credit_ledger_entries`.
- The existing FK names and targets remain unchanged.
- No backfill was added because older credit rows do not have deterministic approved snapshot rows.
- No credits were reserved, spent, released, refunded, or granted.
- Local reset now passes the previous approved-plan-snapshot FK blocker.
- Local reset now stops at a new next-migration blocker: `column "edit_plan_version_id" does not exist (SQLSTATE 42703)`.
- Failing statement: `create index if not exists idx_credit_estimates_project_plan on public.credit_estimates(project_id, edit_plan_version_id)`.
- Creative Skill catalog migrations were still not reached, so catalog smoke/RLS verification did not run.
- No staging, commit, merge, push, deploy, remote Supabase, package, runtime, UI, provider, worker, or app behavior work occurred.

Recommended next prompt: `RP-BETA-INTEGRATION-07 - Local Migration Chain Repair for 202605180004 Credit Estimate Plan Version Compatibility`.

## RP-BETA-INTEGRATION-07 Local Migration Chain Repair

`RP-BETA-INTEGRATION-07` creates [local-migration-chain-blocker-repair-202605180004-credit-estimate-plan-version.md](local-migration-chain-blocker-repair-202605180004-credit-estimate-plan-version.md) and [local-migration-chain-blocker-repair-202605180004-credit-estimate-plan-version-checklist.md](local-migration-chain-blocker-repair-202605180004-credit-estimate-plan-version-checklist.md).

Repair decision: `credit_estimate_plan_version_nullable_fk_compatibility_repair`.

Local reset decision: `local_chain_blocker_repaired_but_new_blocker_found`.

Summary:

- The `credit_estimates.edit_plan_version_id` compatibility gap in `202605180004_reeditpro_credits_approval_snapshots.sql` was repaired with a nullable column and idempotent FK to `edit_plan_versions(id)`.
- The existing `idx_credit_estimates_project_plan` index remains unchanged.
- No backfill was added because older credit estimates do not have deterministic plan-version rows.
- No credits were reserved, spent, refunded, or granted.
- Local reset now passes the previous `credit_estimates.edit_plan_version_id` blocker.
- Local reset now stops at a new next-migration blocker: `column "approved_plan_snapshot_id" does not exist (SQLSTATE 42703)`.
- Failing statement: `create index if not exists idx_generation_requests_project_snapshot on public.generation_requests(project_id, approved_plan_snapshot_id)`.
- Creative Skill catalog migrations were still not reached, so catalog smoke/RLS verification did not run.
- No staging, commit, merge, push, deploy, remote Supabase, package, runtime, UI, provider, worker, or app behavior work occurred.

Recommended next prompt: `RP-BETA-INTEGRATION-08 - Local Migration Chain Repair for 202605180005 Generation Request Snapshot Compatibility`.

## RP-BETA-INTEGRATION-08 Local Migration Chain Repair

`RP-BETA-INTEGRATION-08` creates [local-migration-chain-blocker-repair-202605180005-generation-request-snapshot.md](local-migration-chain-blocker-repair-202605180005-generation-request-snapshot.md) and [local-migration-chain-blocker-repair-202605180005-generation-request-snapshot-checklist.md](local-migration-chain-blocker-repair-202605180005-generation-request-snapshot-checklist.md).

Repair decision: `generation_request_snapshot_nullable_fk_compatibility_repair`.

Local reset decision: `local_chain_blocker_repaired_but_new_blocker_found`.

Summary:

- The `generation_requests.approved_plan_snapshot_id` compatibility gap in `202605180005_reeditpro_generation_assets_jobs.sql` was repaired with a nullable column and idempotent FK to `approved_plan_snapshots(id)`.
- The existing `idx_generation_requests_project_snapshot` index remains unchanged.
- No backfill was added because older generation requests do not have deterministic approved snapshot rows.
- No generation, provider, job, credit, approval, runtime, UI, or app behavior was added.
- Local reset now passes the previous `generation_requests.approved_plan_snapshot_id` blocker.
- Local reset now stops at a new same-migration blocker: `column "version" does not exist (SQLSTATE 42703)`.
- Failing statement: `create index if not exists idx_generated_asset_versions_asset_version on public.generated_asset_versions(generated_asset_id, version)`.
- Creative Skill catalog migrations were still not reached, so catalog smoke/RLS verification did not run.
- No staging, commit, merge, push, deploy, remote Supabase, package, runtime, UI, provider, worker, or app behavior work occurred.

Recommended next prompt: `RP-BETA-INTEGRATION-09 - Local Migration Chain Repair for 202605180005 Generated Asset Version Compatibility`.

## RP-BETA-INTEGRATION-09 Local Migration Chain Repair

`RP-BETA-INTEGRATION-09` creates [local-migration-chain-blocker-repair-202605180005-generated-asset-version.md](local-migration-chain-blocker-repair-202605180005-generated-asset-version.md) and [local-migration-chain-blocker-repair-202605180005-generated-asset-version-checklist.md](local-migration-chain-blocker-repair-202605180005-generated-asset-version-checklist.md).

Repair decision: `generated_asset_version_number_index_retarget_repair`.

Local reset decision: `local_chain_blocker_repaired_but_new_blocker_found`.

Summary:

- The `generated_asset_versions` version index in `202605180005_reeditpro_generation_assets_jobs.sql` was retargeted from `version` to `version_number`.
- The existing `idx_generated_asset_versions_asset_version` index name remains unchanged.
- No duplicate `version` column, backfill, generated asset version semantic change, provider execution, job execution, credit behavior, approval behavior, runtime, UI, or app behavior was added.
- Local reset now passes the previous `generated_asset_versions.version` blocker.
- Local reset now stops at a new next-migration blocker: `syntax error at or near "text" (SQLSTATE 42601)`.
- Failing statement excerpt: `check text` inside `create table if not exists public.qa_check_results (...)`.
- Creative Skill catalog migrations were still not reached, so catalog smoke/RLS verification did not run.
- No staging, commit, merge, push, deploy, remote Supabase, package, runtime, UI, provider, worker, or app behavior work occurred.

Recommended next prompt: `RP-BETA-INTEGRATION-10 - Local Migration Chain Repair for 202605180006 QA Check Result Column Compatibility`.

## RP-BETA-INTEGRATION-10 Local Migration Chain Repair

`RP-BETA-INTEGRATION-10` creates [local-migration-chain-blocker-repair-202605180006-qa-check-result-column.md](local-migration-chain-blocker-repair-202605180006-qa-check-result-column.md) and [local-migration-chain-blocker-repair-202605180006-qa-check-result-column-checklist.md](local-migration-chain-blocker-repair-202605180006-qa-check-result-column-checklist.md).

Repair decision: `quote_reserved_check_column_repair`.

Local reset decision: `local_chain_blocker_repaired_but_new_blocker_found`.

Summary:

- The `qa_check_results.check` syntax blocker in `202605180006_reeditpro_qa_exports_audit.sql` was repaired by quoting the reserved column as `"check" text`.
- The logical `check` field was preserved because `QACheckResultRecord.check` already exists in `src/types/edit-planning-db.ts`.
- No QA field rename, compatibility duplicate column, QA runtime, export execution, credit behavior, approval behavior, provider, worker, UI, or app behavior was added.
- Local reset now passes the previous `qa_check_results.check` syntax blocker.
- Local reset now stops at a new same-migration blocker: `column "approved_plan_snapshot_id" does not exist (SQLSTATE 42703)`.
- Failing statement: `create index if not exists idx_qa_reports_project_snapshot on public.qa_reports(project_id, approved_plan_snapshot_id)`.
- Creative Skill catalog migrations were still not reached, so catalog smoke/RLS verification did not run.
- No staging, commit, merge, push, deploy, remote Supabase, package, runtime, UI, provider, worker, or app behavior work occurred.

Recommended next prompt: `RP-BETA-INTEGRATION-11 - Local Migration Chain Repair for 202605180006 QA Reports Approved Snapshot Compatibility`.

## RP-BETA-INTEGRATION-11 Local Migration Chain Repair

`RP-BETA-INTEGRATION-11` creates [local-migration-chain-blocker-repair-202605180006-qa-report-approved-snapshot.md](local-migration-chain-blocker-repair-202605180006-qa-report-approved-snapshot.md) and [local-migration-chain-blocker-repair-202605180006-qa-report-approved-snapshot-checklist.md](local-migration-chain-blocker-repair-202605180006-qa-report-approved-snapshot-checklist.md).

Repair decision: `qa_report_approved_snapshot_nullable_fk_compatibility_repair`.

Local reset decision: `local_chain_blocker_repaired_but_new_blocker_found`.

Summary:

- The `qa_reports.approved_plan_snapshot_id` compatibility gap in `202605180006_reeditpro_qa_exports_audit.sql` was repaired with a nullable column and idempotent FK to `approved_plan_snapshots(id)`.
- The existing `idx_qa_reports_project_snapshot` index remains unchanged.
- No backfill was added because older QA reports do not have deterministic approved snapshot rows.
- No QA runtime, export execution, credit behavior, approval behavior, provider, worker, UI, or app behavior was added.
- Local reset now passes the previous `qa_reports.approved_plan_snapshot_id` blocker.
- Local reset now stops at a new next-migration blocker: `cannot change name of input parameter "target_workspace_id" (SQLSTATE 42P13)`.
- Failing statement excerpt: `create or replace function public.is_workspace_member(workspace_uuid uuid)`.
- Creative Skill catalog migrations were still not reached, so catalog smoke/RLS verification did not run.
- No staging, commit, merge, push, deploy, remote Supabase, package, runtime, UI, provider, worker, or app behavior work occurred.

Recommended next prompt: `RP-BETA-INTEGRATION-12 - Local Migration Chain Repair for 202605180007 Workspace Member Function Signature Compatibility`.

## RP-BETA-INTEGRATION-12 Local Migration Chain Repair

`RP-BETA-INTEGRATION-12` creates [local-migration-chain-blocker-repair-202605180007-workspace-member-function.md](local-migration-chain-blocker-repair-202605180007-workspace-member-function.md) and [local-migration-chain-blocker-repair-202605180007-workspace-member-function-checklist.md](local-migration-chain-blocker-repair-202605180007-workspace-member-function-checklist.md).

Repair decision: `workspace_member_function_parameter_name_compatibility_repair`.

Local reset decision: `local_chain_blocker_repaired_but_new_blocker_found`.

Summary:

- The `is_workspace_member` parameter-name blocker in `202605180007_reeditpro_rls_policies.sql` was repaired by preserving `target_workspace_id`.
- Workspace membership behavior and positional policy call sites remain unchanged.
- No function drop/recreate path, RLS weakening, permissive policy, runtime, UI, provider, worker, or app behavior was added.
- Local reset now passes the previous `is_workspace_member` blocker.
- Local reset now stops at a new same-migration blocker: `cannot change name of input parameter "target_workspace_id" (SQLSTATE 42P13)`.
- Failing statement excerpt: `create or replace function public.is_workspace_owner_or_admin(workspace_uuid uuid)`.
- Creative Skill catalog migrations were still not reached, so catalog smoke/RLS verification did not run.
- No staging, commit, merge, push, deploy, remote Supabase, package, runtime, UI, provider, worker, or app behavior work occurred.

Recommended next prompt: `RP-BETA-INTEGRATION-13 - Local Migration Chain Repair for 202605180007 Workspace Owner/Admin Function Signature Compatibility`.

## RP-BETA-INTEGRATION-13 Local Migration Chain Repair

`RP-BETA-INTEGRATION-13` creates [local-migration-chain-blocker-repair-202605180007-workspace-owner-admin-function.md](local-migration-chain-blocker-repair-202605180007-workspace-owner-admin-function.md) and [local-migration-chain-blocker-repair-202605180007-workspace-owner-admin-function-checklist.md](local-migration-chain-blocker-repair-202605180007-workspace-owner-admin-function-checklist.md).

Repair decision: `workspace_owner_admin_function_parameter_name_compatibility_repair`.

Local reset decision: `local_chain_blocker_repaired_but_new_blocker_found`.

Summary:

- The `is_workspace_owner_or_admin` parameter-name blocker in `202605180007_reeditpro_rls_policies.sql` was repaired by preserving `target_workspace_id`.
- Workspace owner/admin behavior and positional policy call sites remain unchanged.
- No function drop/recreate path, RLS weakening, permissive policy, runtime, UI, provider, worker, or app behavior was added.
- Local reset now passes the previous `is_workspace_owner_or_admin` blocker.
- Local reset now stops at a new next-migration blocker: `must be owner of table buckets`.
- Failing migration: `202605180008_reeditpro_storage_buckets_policies.sql`.
- Creative Skill catalog migrations were still not reached, so catalog smoke/RLS verification did not run.
- No staging, commit, merge, push, deploy, remote Supabase, package, runtime, UI, provider, worker, or app behavior work occurred.

Recommended next prompt: `RP-BETA-INTEGRATION-14 - Local Migration Chain Repair for 202605180008 Storage Buckets Policy Ownership Compatibility`.

## RP-BETA-INTEGRATION-14 Local Migration Chain Repair

`RP-BETA-INTEGRATION-14` creates [local-migration-chain-blocker-repair-202605180008-storage-buckets-ownership.md](local-migration-chain-blocker-repair-202605180008-storage-buckets-ownership.md) and [local-migration-chain-blocker-repair-202605180008-storage-buckets-ownership-checklist.md](local-migration-chain-blocker-repair-202605180008-storage-buckets-ownership-checklist.md).

Repair decision: `storage_managed_object_comment_to_sql_comment_repair`.

Local reset decision: `blocked_local_environment`.

Summary:

- The ownership-sensitive `COMMENT ON storage.*` statements in `202605180008_reeditpro_storage_buckets_policies.sql` were converted to ordinary SQL comments.
- Bucket inserts, bucket privacy, storage policies, helper calls, and storage access behavior remain unchanged.
- No storage RLS weakening, public bucket change, permissive storage policy, runtime, UI, provider, worker, storage runtime, or app behavior was added.
- Local safety preflight passed, but `supabase start` failed because Docker was not reachable.
- `supabase db reset --local --no-seed` did not run, so the storage repair has not been locally reset-verified yet.
- Creative Skill catalog migrations were still not reached, so catalog smoke/RLS verification did not run.
- No staging, commit, merge, push, deploy, remote Supabase, package, runtime, UI, provider, worker, or app behavior work occurred.

Recommended next prompt: `RP-BETA-INTEGRATION-15 - Local Docker Environment Repair and Storage Migration Verification Retry`.

## RP-BETA-INTEGRATION-15 Local Docker Environment Repair And Storage Retry

`RP-BETA-INTEGRATION-15` creates [local-docker-environment-repair-and-storage-migration-retry.md](local-docker-environment-repair-and-storage-migration-retry.md) and [local-docker-environment-repair-and-storage-migration-retry-checklist.md](local-docker-environment-repair-and-storage-migration-retry-checklist.md).

Decision: `local_docker_repaired_but_new_migration_blocker_found`.

Summary:

- Docker Desktop was installed and started locally with `open -a Docker`.
- Docker daemon became reachable.
- `supabase start` passed for `reeditpro-local`.
- `supabase db reset --local --no-seed` passed the repaired `202605180008_reeditpro_storage_buckets_policies.sql` migration.
- Local reset stopped later at `202605200001_storage_upload_pipeline_readiness.sql` on `must be owner of relation objects`.
- Creative Skill catalog migrations were still not reached, so catalog smoke/RLS verification did not run.
- No migrations, config, TypeScript, manifest, mocks, package files, runtime, UI, provider, worker, or app behavior changed.
- No staging, commit, merge, push, deploy, remote Supabase, `supabase link`, or `supabase db push` occurred.

Recommended next prompt: `RP-BETA-INTEGRATION-16 - Local Migration Chain Repair for 202605200001 Storage Upload Pipeline Policy Comment Ownership Compatibility`.

## RP-BETA-INTEGRATION-16 Local Migration Chain Repair

`RP-BETA-INTEGRATION-16` creates [local-migration-chain-blocker-repair-202605200001-storage-upload-policy-comments.md](local-migration-chain-blocker-repair-202605200001-storage-upload-policy-comments.md) and [local-migration-chain-blocker-repair-202605200001-storage-upload-policy-comments-checklist.md](local-migration-chain-blocker-repair-202605200001-storage-upload-policy-comments-checklist.md).

Decision: `local_chain_blocker_repaired_and_local_chain_passed`.

Summary:

- Converted two ownership-sensitive `COMMENT ON POLICY ... ON storage.objects` statements in `202605200001_storage_upload_pipeline_readiness.sql` to ordinary SQL comments.
- Preserved bucket setup, private bucket intent, storage policies, path checks, helper calls, and project-member/project-editor access boundaries.
- `supabase start` and `supabase db reset --local --no-seed` passed locally for `reeditpro-local`.
- Minimal Creative Skill catalog smoke passed with counts `21/140/9/20/450/0`.
- No Creative Skill migrations, manifest, TypeScript contracts, mocks, packages, runtime, UI, provider, worker, or app behavior changed.
- No staging, commit, merge, push, deploy, remote Supabase, `supabase link`, or `supabase db push` occurred.

Recommended next prompt: `RP-BETA-INTEGRATION-17 - Creative Skill Catalog Full Local Data and RLS Verification`.

## RP-BETA-INTEGRATION-17 Creative Skill Catalog Full Local Data And RLS Verification

`RP-BETA-INTEGRATION-17` creates [creative-skill-catalog-full-local-data-and-rls-verification.md](creative-skill-catalog-full-local-data-and-rls-verification.md) and [creative-skill-catalog-full-local-data-and-rls-verification-checklist.md](creative-skill-catalog-full-local-data-and-rls-verification-checklist.md).

Decision: `creative_skill_catalog_full_local_verification_passed_with_warnings`.

Summary:

- Local-only `supabase db reset --local --no-seed` passed for `reeditpro-local`.
- Creative Skill catalog table counts matched `21/140/9/20/450/0`.
- Manifest parity passed for families, skills, aliases, relationships, contract mappings, and no-action counterparts.
- Family and skill metadata parity passed.
- Constraint, index, comment, RLS, policy, grant, role-simulation, duplicate-review, and rollback-only fail-closed checks passed.
- Protected files remained unchanged, including config, migrations, manifest, TypeScript contracts, mocks, and package files.
- No staging, commit, merge, push, deploy, remote Supabase, `supabase link`, or `supabase db push` occurred.

Recommended next prompt: `RP-BETA-INTEGRATION-18 - End-to-End Beta Merge Readiness and Commit Plan`.

## RP-BETA-INTEGRATION-18 End-to-End Beta Merge Readiness And Commit Plan

`RP-BETA-INTEGRATION-18` creates [end-to-end-beta-merge-readiness-and-commit-plan.md](end-to-end-beta-merge-readiness-and-commit-plan.md) and [end-to-end-beta-merge-readiness-and-commit-plan-checklist.md](end-to-end-beta-merge-readiness-and-commit-plan-checklist.md).

Decision: `blocked_build_failure`.

Summary:

- Repo identity, branch, remote, Qwen clone relationship, and dirty worktree state were documented.
- RP-BETA-INTEGRATION-17 remains the local Creative Skill catalog database verification baseline.
- `git diff --check`, `npm run lint`, and four safe smoke checks passed.
- `npm run build` failed on existing `src/backend/services/sound-agent-planner-service.ts` type errors.
- The branch tool-calling diagnostic failed because it rejects modified Supabase/migration files, including intentional migration-chain repairs.
- Future commit grouping and merge strategy were documented, but no staging, commit, merge, push, deploy, remote Supabase, Qwen copy, runtime, UI, provider, worker, manifest, TypeScript, mock, package, or migration edit occurred.

Recommended next prompt: `RP-BETA-INTEGRATION-19 - Sound Agent Planner Build Repair`.

## RP-BETA-INTEGRATION-19 Sound Agent Planner Build Repair

`RP-BETA-INTEGRATION-19` creates [sound-agent-planner-build-repair.md](sound-agent-planner-build-repair.md) and [sound-agent-planner-build-repair-checklist.md](sound-agent-planner-build-repair-checklist.md).

Decision: `sound_agent_build_repair_passed_with_warnings`.

Summary:

- Imported the existing `SoundAgentPlan` type into `src/backend/services/sound-agent-planner-service.ts`.
- Cleared the cascading cue/policy implicit type errors and `SoundTimingAnchor[]` mismatch.
- `npm run build`, `npm run lint`, and the four safe beta/sound smokes passed.
- No migrations, Supabase config, Creative Skill manifest, Creative Skill contracts, mocks, package files, Qwen clone files, staging, commit, merge, push, deploy, remote Supabase, provider calls, worker execution, or app behavior changed.
- Remaining blockers are Qwen clone reconciliation, tool-calling diagnostic policy mismatch, and owner-approved staging/commit/merge execution.

Recommended next prompt: `RP-BETA-INTEGRATION-20 - Owner Staging Approval and Commit Group Execution`.

## RP-BETA-INTEGRATION-20 Owner Staging Approval And Commit Execution

`RP-BETA-INTEGRATION-20` creates [owner-staging-approval-and-commit-execution.md](owner-staging-approval-and-commit-execution.md) and [owner-staging-approval-and-commit-execution-checklist.md](owner-staging-approval-and-commit-execution-checklist.md).

Decision: `local_commits_created_ready_for_merge_readiness_review`.

Summary:

- Created local commits for reviewed RP-SKILLS/RP-BETA docs, types, fixtures, catalog migrations, manifest, local migration-chain repairs, local config, and the sound-agent build repair.
- Used explicit path lists only; no broad `git add` was used.
- Excluded `supabase/.branches/`, `supabase/.temp/`, and Qwen clone files.
- Post-content-commit `git diff --check`, lint, build, and safe smokes passed.
- No merge, push, deploy, remote Supabase, Qwen mutation, provider call, worker execution, package mutation, or app behavior change occurred.

Recommended next prompt: `RP-BETA-INTEGRATION-21 - Post-Commit Merge Readiness Review and Qwen Reconciliation Decision`.

## RP-BETA-INTEGRATION-21 Post-Commit Merge Readiness And Qwen Reconciliation Decision

`RP-BETA-INTEGRATION-21` creates [post-commit-merge-readiness-and-qwen-reconciliation-decision.md](post-commit-merge-readiness-and-qwen-reconciliation-decision.md) and [post-commit-merge-readiness-and-qwen-reconciliation-decision-checklist.md](post-commit-merge-readiness-and-qwen-reconciliation-decision-checklist.md).

Decision: `post_commit_ready_for_qwen_reconciliation`.

Summary:

- Verified the six RP-BETA-INTEGRATION-20 local commits exist in order.
- Confirmed the current worktree has no staged files and only excluded local Supabase side artifacts remain untracked.
- Confirmed validation remains green for diff check, lint, build, and the four safe smokes.
- Confirmed Qwen beta files exist in the separate Qwen clone and are absent from the current RP-SKILLS repo.
- No staging, commit, merge, push, deploy, remote Supabase, Qwen mutation, Qwen copy, migration edit, manifest edit, TypeScript change, mock change, package change, provider call, worker execution, UI change, or app behavior change occurred.

Recommended next prompt: `RP-BETA-INTEGRATION-22 - Qwen Beta Clone Reconciliation Plan`.

## RP-BETA-INTEGRATION-22 Qwen Beta Clone Reconciliation Plan

`RP-BETA-INTEGRATION-22` creates [qwen-beta-clone-reconciliation-plan.md](qwen-beta-clone-reconciliation-plan.md) and [qwen-beta-clone-reconciliation-plan-checklist.md](qwen-beta-clone-reconciliation-plan-checklist.md).

Decision: `qwen_reconciliation_blocked_mixed_dirty_clone`.

Summary:

- Confirmed Qwen beta files remain absent from the current RP-SKILLS repo.
- Confirmed the separate Qwen clone contains the reported Qwen files, but they are untracked.
- Confirmed the reported Qwen files depend on additional untracked project-edit-brief/Qwen runtime files.
- Confirmed Qwen package/script changes are broad and dirty, including `@google-cloud/secret-manager`, `@playwright/test`, Qwen checks, project-edit-brief smokes, frontend-boundary checks, and Supabase safety scripts.
- Current repo validation passed for diff check, lint, build, and the four safe smokes.
- Qwen clone validation was skipped because the clone is dirty/mixed and not a stable import source.
- No Qwen mutation, Qwen file copy, package change, staging, commit, merge, push, deploy, remote Supabase, provider call, worker execution, runtime, UI, or app behavior change occurred.

Recommended next prompt: `RP-BETA-INTEGRATION-23 - Qwen Clone Cleanup and Commit Preparation Plan`.

## RP-BETA-INTEGRATION-23 Qwen Clone Cleanup And Commit Preparation Plan

`RP-BETA-INTEGRATION-23` creates [qwen-clone-cleanup-and-commit-preparation-plan.md](qwen-clone-cleanup-and-commit-preparation-plan.md) and [qwen-clone-cleanup-and-commit-preparation-plan-checklist.md](qwen-clone-cleanup-and-commit-preparation-plan-checklist.md).

Decision: `qwen_cleanup_plan_ready_for_owner_approval`.

Summary:

- Confirmed the Qwen clone remains mixed: `0` staged files, `144` tracked modified files, `2234` untracked files, and `414` Qwen/project-edit-brief/script-like untracked paths.
- Defined the future Qwen beta bundle: Qwen type contracts, backend Qwen runtime, Project Edit Brief integration, browser-safe marker-chat adapters, validation scripts/smokes, package changes, and curated docs.
- Documented package/script implications for `@google-cloud/secret-manager`, `@playwright/test`, Qwen checks, Project Edit Brief smokes, frontend-boundary checks, and Supabase safety scripts.
- Recommended future owner-approved Codex cleanup commits inside `/Users/macuser/Developer/REeditpro` before any import into RP-SKILLS.
- No Qwen mutation, Qwen file copy, package change, staging, commit, merge, push, deploy, remote Supabase, provider call, worker execution, runtime, UI, or app behavior change occurred.

Recommended next prompt: `RP-BETA-INTEGRATION-24 - Qwen Clone Owner-Approved Cleanup and Local Commit Execution`.

## RP-BETA-INTEGRATION-24 Qwen Clone Owner-Approved Cleanup And Local Commit Execution

`RP-BETA-INTEGRATION-24` creates [qwen-clone-owner-approved-cleanup-and-local-commit-execution.md](qwen-clone-owner-approved-cleanup-and-local-commit-execution.md) and [qwen-clone-owner-approved-cleanup-and-local-commit-execution-checklist.md](qwen-clone-owner-approved-cleanup-and-local-commit-execution-checklist.md).

Decision: `blocked_before_qwen_staging`.

Specific blocker: `blocked_qwen_package_conflict`.

Summary:

- Owner approval was accepted for local Qwen clone cleanup commits only.
- Qwen pre-stage validation passed for lint, build, Qwen secret leakage, Qwen runtime boundary, Qwen marker chat bridge, Project Edit Brief marker chat, frontend boundary, and Supabase command safety checks.
- Candidate path manifests were written to `/tmp` only.
- No Qwen files were staged or committed because `package.json`/`package-lock.json` include a broad script surface beyond Qwen beta-only scope.
- No Qwen mutation, Qwen file copy into RP-SKILLS, RP-SKILLS package/migration/manifest/type/mock change, push, deploy, merge, remote Supabase, provider call, worker execution, runtime, UI, or app behavior change occurred.

Recommended next prompt: `RP-BETA-INTEGRATION-25 - Qwen Package Script Split and Cleanup Commit Repair`.

## RP-BETA-INTEGRATION-25 Qwen Package Script Split And Cleanup Commit Repair

`RP-BETA-INTEGRATION-25` creates [qwen-package-script-split-and-cleanup-commit-repair.md](qwen-package-script-split-and-cleanup-commit-repair.md) and [qwen-package-script-split-and-cleanup-commit-repair-checklist.md](qwen-package-script-split-and-cleanup-commit-repair-checklist.md).

Decision: `qwen_package_script_split_repaired_and_local_commits_created`.

Summary:

- Created six local Qwen clone commits: `92d3111e5`, `f9d52f8ff`, `f87a40d65`, `f53b52621`, `df5f25c86`, and `11ffea3b6`.
- Repaired the package/script blocker by staging `package.json` with an index-only patch limited to eight approved scripts and the two approved dependencies.
- Staged Qwen files only from explicit `/tmp` manifests.
- Qwen pre-stage and post-commit validation passed for lint, build, Qwen safety, marker-chat, Project Edit Brief marker-chat, frontend-boundary, and Supabase command-safety checks.
- The Qwen clone remains dirty outside the six commits, with `143` tracked modified entries and `1174` untracked entries.
- No Qwen files were copied into RP-SKILLS, and no push, merge, deploy, remote Supabase, provider call, worker execution, package install, runtime, UI, or app behavior change occurred.

Recommended next prompt: `RP-BETA-INTEGRATION-26 - Qwen Beta Commit Import into RP-SKILLS Repo`.

## RP-BETA-INTEGRATION-26 Qwen Beta Commit Import Into RP-SKILLS Repo

`RP-BETA-INTEGRATION-26` creates [qwen-beta-commit-import-into-rp-skills-repo.md](qwen-beta-commit-import-into-rp-skills-repo.md) and [qwen-beta-commit-import-into-rp-skills-repo-checklist.md](qwen-beta-commit-import-into-rp-skills-repo-checklist.md).

Decision: `qwen_beta_commits_imported_but_validation_blocked_dependency_incomplete`.

Summary:

- Created `711039ae` - `docs(beta): record qwen reconciliation planning` before import.
- Imported the six reviewed Qwen commits into RP-SKILLS as local commits `7457a8cf`, `e20472aa`, `897bb81a`, `4abd758b`, `f8ad24ee`, and `62933d5c`.
- `git diff --check`, `npm run lint`, the existing beta/sound smokes, and static Qwen safety checks passed.
- `npm run build` and Qwen runtime smokes failed because the committed slice references Qwen clone dependencies that remain untracked there and absent here, including `src/types/api-routes.ts`.
- No uncommitted Qwen files were copied, and no push, merge, deploy, remote Supabase, provider call, worker execution, Creative Skill migration, manifest, type, mock, or Supabase config change occurred.

Recommended next prompt: `RP-BETA-INTEGRATION-27 - Qwen Import Dependency Completion and Build Repair`.

## RP-BETA-INTEGRATION-27 Qwen Import Dependency Completion And Build Repair

`RP-BETA-INTEGRATION-27` creates [qwen-import-dependency-completion-and-build-repair.md](qwen-import-dependency-completion-and-build-repair.md) and [qwen-import-dependency-completion-and-build-repair-checklist.md](qwen-import-dependency-completion-and-build-repair-checklist.md).

Decision: `qwen_dependency_completion_passed_with_warnings`.

Summary:

- Imported only the missing Qwen/Project Edit Brief dependency files needed by the already-imported RP-BETA-26 commits.
- Added bounded mock orchestrator exports for Qwen runtime-boundary and Supabase-command safety smokes.
- Patched target compatibility only in Qwen/Project Edit Brief surfaces and mock/error support.
- Created local commit `7a5c6c80` - `fix(qwen): import marker chat dependency files`.
- `git diff --check`, lint, build, all Qwen checks/smokes, Supabase-command safety checks/smokes, existing beta/API smokes, and sound/music smokes passed.
- Protected Supabase config, migrations, Creative Skill manifest, Creative Skill contracts, mock fixtures, and package files remained unchanged.
- The Qwen clone remained read-only and dirty outside the imported dependency slice.

Recommended next prompt: `RP-BETA-INTEGRATION-28 - Final Beta Merge Readiness Review`.

## RP-BETA-INTEGRATION-28 Final Beta Merge Readiness Review

`RP-BETA-INTEGRATION-28` creates [final-beta-merge-readiness-review.md](final-beta-merge-readiness-review.md) and [final-beta-merge-readiness-review-checklist.md](final-beta-merge-readiness-review-checklist.md).

Decision: `final_beta_merge_ready_with_warnings_for_owner_merge_approval`.

Summary:

- Verified expected RP-SKILLS, Qwen import, and RP-BETA-27 dependency completion commits through `7e8aca60`.
- Confirmed Qwen runtime, Project Edit Brief marker-chat, validation script, and RP-BETA-27 dependency files are present in the target repo.
- Confirmed the Qwen clone remains separate, read-only, unstaged, and dirty outside the imported slice.
- Used RP-BETA-17 as the Creative Skill catalog local database verification baseline.
- `git diff --check`, lint, build, Qwen checks/smokes, Supabase-command safety checks/smokes, beta/API smokes, and sound/music smokes passed.
- No merge, push, deploy, remote Supabase, provider call, worker execution, Qwen clone mutation, migration edit, manifest edit, Creative Skill type/mock edit, package change, or app behavior change occurred.

Recommended next prompt: `RP-BETA-INTEGRATION-29 - Owner-Approved Local Merge Execution`.

## RP-BETA-INTEGRATION-29 Owner-Approved Local Merge Execution

`RP-BETA-INTEGRATION-29` creates [local-merge-execution-report.md](local-merge-execution-report.md) and [local-merge-execution-checklist.md](local-merge-execution-checklist.md).

Decision: `local_merge_completed_with_warnings_validation_passed`.

Summary:

- Created local safety branch `backup/pre-beta-merge-20260702012431-all-owner-stack`.
- Merged `codex/reeditpro-tool-calling-worker-runtime-sound-cpu-contract-owner-review-merged-reconciliation-1` into `codex/reeditpro-tool-calling-all-owner-stack-reconciliation-1`.
- Local merge commit: `32e3e20168353104be46b3bc71eaf903ca3463ff`.
- No merge conflicts occurred.
- Diff check, lint, build, Qwen checks/smokes, Supabase-command safety checks/smokes, beta/API smokes, and sound/music smokes passed after merge.
- RP-BETA-17/RP-BETA-28 remain the Creative Skill catalog local database verification baseline.
- No push, deploy, remote Supabase, provider call, worker execution, package mutation, migration edit, Creative Skill manifest/type/mock edit, or Qwen clone mutation occurred.
- Warnings remain for local-only merge scope, the dirty separate Qwen clone, local Supabase side artifacts, and duplicate-suffixed untracked artifacts that were not mutated.

Recommended next prompt: `RP-BETA-INTEGRATION-30 - Remote Push and Deployment Owner Approval Packet`.

## Scope Boundary

Allowed in this audit:

- Markdown documentation under `docs/creative-skills/`.
- Evidence-backed mapping to existing docs, TypeScript contracts, mock planner logic, UI planning cards, migrations, and open PR clusters.
- Recommendations for how future skill work should avoid duplicate architecture.

Not allowed in this audit:

- Runtime skill implementation.
- TypeScript contract changes.
- Supabase migrations, SQL execution, or CLI usage.
- Provider API wiring, prompt router changes, generation calls, or credit ledger logic.
- Package installs, tool runtime unlocks, worker code, UI changes, or dev server work.

## Current Conclusion

The repo already has mature planning-first foundations for intent-led editing, source order, Reference DNA, professional edit quality, signature routing, StoryTiming, SoundSync, provider prompts, job orchestration, worker boundaries, tool candidates, and Supabase schema planning. A future Creative Skill System should be a thin doctrine and planning-contract layer over those source truths, not a competing architecture.
