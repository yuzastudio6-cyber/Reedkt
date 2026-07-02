import type { DemoScenario } from './demo-scenarios'
import { demoScenarios } from './demo-scenarios'
import { createMockEditPlan } from './mock-planner'
import type {
  PlanValidationCheck,
  PlannerRegressionReport,
  PlanValidationStatus,
  ScenarioValidationReport,
} from './planner-validation'
import { validateMockEditPlan } from './planner-validation'
import { inferSourceSequenceMode } from './source-sequence'
import type { PlannerInput } from '../types/reeditpro'

function inputFromScenario(scenario: DemoScenario): PlannerInput {
  return {
    projectName: scenario.label,
    targetPlatform: scenario.targetPlatform,
    aspectRatio: scenario.aspectRatio,
    aspectRatioConfirmed: true,
    aspectRatioSource: 'demo_scenario',
    frameTemplateType: scenario.frameTemplateType,
    editingCategory: scenario.editingCategory,
    workflowType: scenario.workflowType,
    editLevel: scenario.editLevel,
    structurePreference: 'improve_if_needed',
    moodStyle: scenario.moodStyle,
    visualPreference: scenario.visualPreference,
    referenceUrl: scenario.referenceAttached ? scenario.referenceUrl : '',
    customInstructions: scenario.customInstructions,
    creditPreference: scenario.creditPreference,
    clips: scenario.clips,
    sourceOrderConfirmed: true,
    sourceSequenceMode: inferSourceSequenceMode(scenario.clips, scenario.customInstructions),
    cleanupPreference: scenario.editingCategory === 'documentary_case_study'
      ? 'documentary_faithful'
      : scenario.editingCategory === 'education_explainer'
        ? 'tutorial_complete'
        : scenario.editingCategory === 'lifestyle'
          ? 'preserve_natural'
          : 'balanced_cleanup',
    cleanupPreferenceConfirmed: true,
  }
}

function globalCheck(params: PlanValidationCheck): PlanValidationCheck {
  return params
}

function hasScenarioMatching(predicate: (scenario: DemoScenario) => boolean) {
  return demoScenarios.some(predicate)
}

function scenarioCheckPassed(scenario: ScenarioValidationReport, checkId: string) {
  return scenario.report.checks.some((check) => check.id === checkId && check.passed)
}

function createGlobalChecks(
  scenarioReports: ScenarioValidationReport[],
  unconfirmedFrameReport?: ScenarioValidationReport,
): PlanValidationCheck[] {
  return [
    globalCheck({
      id: 'regression-demo-count',
      category: 'demo_scenario',
      label: 'Launch demo scenarios exist',
      severity: 'blocking',
      passed: demoScenarios.length >= 5,
      message: 'Regression should cover at least the five launch demo scenarios.',
      relatedField: 'demoScenarios',
    }),
    globalCheck({
      id: 'regression-basic-coverage',
      category: 'demo_scenario',
      label: 'Basic scenario coverage',
      severity: 'error',
      passed: hasScenarioMatching((scenario) => scenario.editLevel === 'basic'),
      message: 'Regression should include at least one Basic scenario.',
      relatedField: 'demoScenarios.editLevel',
    }),
    globalCheck({
      id: 'regression-pro-coverage',
      category: 'demo_scenario',
      label: 'Pro scenario coverage',
      severity: 'error',
      passed: hasScenarioMatching((scenario) => scenario.editLevel === 'pro'),
      message: 'Regression should include at least one Pro scenario.',
      relatedField: 'demoScenarios.editLevel',
    }),
    globalCheck({
      id: 'regression-premium-coverage',
      category: 'demo_scenario',
      label: 'Premium scenario coverage',
      severity: 'error',
      passed: hasScenarioMatching((scenario) => scenario.editLevel === 'premium'),
      message: 'Regression should include at least one Premium scenario.',
      relatedField: 'demoScenarios.editLevel',
    }),
    globalCheck({
      id: 'regression-documentary-coverage',
      category: 'demo_scenario',
      label: 'Documentary scenario coverage',
      severity: 'error',
      passed: hasScenarioMatching((scenario) => scenario.editingCategory === 'documentary_case_study'),
      message: 'Regression should include a Documentary / Case Study scenario.',
      relatedField: 'demoScenarios.editingCategory',
    }),
    globalCheck({
      id: 'regression-education-coverage',
      category: 'demo_scenario',
      label: 'Education scenario coverage',
      severity: 'error',
      passed: hasScenarioMatching((scenario) => scenario.editingCategory === 'education_explainer'),
      message: 'Regression should include an Education / Explainer scenario.',
      relatedField: 'demoScenarios.editingCategory',
    }),
    globalCheck({
      id: 'regression-storytelling-coverage',
      category: 'demo_scenario',
      label: 'Storytelling scenario coverage',
      severity: 'error',
      passed: hasScenarioMatching((scenario) => scenario.editingCategory === 'storytelling'),
      message: 'Regression should include a Storytelling scenario.',
      relatedField: 'demoScenarios.editingCategory',
    }),
    globalCheck({
      id: 'regression-planning-system-audit-present',
      category: 'planning_system_audit',
      label: 'Planning system audit coverage',
      severity: 'error',
      passed: scenarioReports.length > 0 && scenarioReports.every((scenario) => scenarioCheckPassed(scenario, 'validation-planning-system-audit-exists')),
      message: 'All demo scenarios should include planningSystemAuditReport.',
      relatedField: 'EditPlan.planningSystemAuditReport',
    }),
    globalCheck({
      id: 'regression-aspect-ratio-frame-gate-present',
      category: 'aspect_ratio_frame_gate',
      label: 'Aspect ratio frame gate coverage',
      severity: 'blocking',
      passed: scenarioReports.length > 0 && scenarioReports.every((scenario) => scenarioCheckPassed(scenario, 'validation-aspect-ratio-frame-plan-exists')),
      message: 'Every demo scenario should include an AspectRatioFramePlan.',
      relatedField: 'EditPlan.aspectRatioFramePlan',
    }),
    globalCheck({
      id: 'regression-source-cleanup-present',
      category: 'source_cleanup',
      label: 'Source cleanup coverage',
      severity: 'blocking',
      passed: scenarioReports.length > 0 && scenarioReports.every((scenario) => scenarioCheckPassed(scenario, 'validation-source-cleanup-plan-exists')),
      message: 'Every demo scenario should include SourceCleanupPlan.',
      relatedField: 'EditPlan.sourceCleanupPlan',
    }),
    globalCheck({
      id: 'regression-source-cleanup-confirmed',
      category: 'source_cleanup',
      label: 'Confirmed scenarios pass cleanup gate',
      severity: 'blocking',
      passed: scenarioReports.length > 0 && scenarioReports.every((scenario) => scenarioCheckPassed(scenario, 'validation-source-cleanup-confirmed')),
      message: 'Normal regression scenarios should confirm cleanup preference before approval.',
      relatedField: 'PlannerInput.cleanupPreferenceConfirmed',
    }),
    globalCheck({
      id: 'regression-trim-review-present',
      category: 'trim_review',
      label: 'Trim review coverage',
      severity: 'blocking',
      passed: scenarioReports.length > 0 && scenarioReports.every((scenario) => scenarioCheckPassed(scenario, 'validation-trim-review-plan-exists')),
      message: 'Every demo scenario should include TrimReviewPlan.',
      relatedField: 'EditPlan.trimReviewPlan',
    }),
    globalCheck({
      id: 'regression-trim-review-meaning-validation',
      category: 'trim_review',
      label: 'Meaning preservation coverage',
      severity: 'blocking',
      passed: scenarioReports.length > 0 && scenarioReports.every((scenario) => scenarioCheckPassed(scenario, 'validation-trim-review-meaning-validation')),
      message: 'Every demo scenario should include MeaningPreservationValidationPlan.',
      relatedField: 'EditPlan.trimReviewPlan.meaningPreservationValidationPlan',
    }),
    globalCheck({
      id: 'regression-editing-agent-execution-present',
      category: 'editing_agent_execution',
      label: 'Editing agent execution coverage',
      severity: 'error',
      passed: scenarioReports.length > 0 && scenarioReports.every((scenario) => scenarioCheckPassed(scenario, 'validation-editing-agent-execution-plan-exists')),
      message: 'Every demo scenario should include EditingAgentExecutionPlan.',
      relatedField: 'EditPlan.editingAgentExecutionPlan',
    }),
    globalCheck({
      id: 'regression-editing-agent-manifest-present',
      category: 'editing_agent_execution',
      label: 'Execution asset manifest coverage',
      severity: 'error',
      passed: scenarioReports.length > 0 && scenarioReports.every((scenario) => scenarioCheckPassed(scenario, 'validation-editing-agent-asset-manifest')),
      message: 'Every demo scenario should include a mock execution asset manifest.',
      relatedField: 'EditPlan.editingAgentExecutionPlan.assetManifest',
    }),
    globalCheck({
      id: 'regression-async-asset-reconciliation-present',
      category: 'async_asset_reconciliation',
      label: 'Async reconciliation coverage',
      severity: 'error',
      passed: scenarioReports.length > 0 && scenarioReports.every((scenario) => scenarioCheckPassed(scenario, 'validation-async-reconciliation-plan-exists')),
      message: 'Every demo scenario should include AsyncAssetReconciliationPlan.',
      relatedField: 'EditPlan.asyncAssetReconciliationPlan',
    }),
    globalCheck({
      id: 'regression-async-merge-plan-present',
      category: 'async_asset_reconciliation',
      label: 'Async merge plan coverage',
      severity: 'error',
      passed: scenarioReports.length > 0 && scenarioReports.every((scenario) => scenarioCheckPassed(scenario, 'validation-async-merge-plan-covers-manifest')),
      message: 'Every demo scenario should include merge/version policy for the asset manifest.',
      relatedField: 'asyncAssetReconciliationPlan.mergePlanItems',
    }),
    globalCheck({
      id: 'regression-agent-qa-fallback-present',
      category: 'agent_qa_fallback',
      label: 'Agent QA fallback coverage',
      severity: 'error',
      passed: scenarioReports.length > 0 && scenarioReports.every((scenario) => scenarioCheckPassed(scenario, 'validation-agent-qa-fallback-plan-exists')),
      message: 'Every demo scenario should include AgentQAFallbackPlan.',
      relatedField: 'EditPlan.agentQAFallbackPlan',
    }),
    globalCheck({
      id: 'regression-agent-qa-fallback-veo-policy',
      category: 'agent_qa_fallback',
      label: 'Agent fallback model policy coverage',
      severity: 'blocking',
      passed: scenarioReports.length > 0 && scenarioReports.every((scenario) => scenarioCheckPassed(scenario, 'validation-agent-basic-pro-no-veo-fallback')),
      message: 'Agent fallback planning should preserve Basic/Pro no-Veo and Premium final-fallback-only Veo.',
      relatedField: 'agentQAFallbackPlan.fallbackActions',
    }),
    globalCheck({
      id: 'regression-confirmed-scenarios-pass-frame-gate',
      category: 'aspect_ratio_frame_gate',
      label: 'Confirmed demo scenarios pass frame gate',
      severity: 'blocking',
      passed: scenarioReports.length > 0 && scenarioReports.every((scenario) => scenarioCheckPassed(scenario, 'validation-aspect-ratio-confirmed-before-approval')),
      message: 'Normal regression scenarios should set aspectRatioConfirmed true and pass the frame gate.',
      relatedField: 'PlannerInput.aspectRatioConfirmed',
    }),
    globalCheck({
      id: 'regression-unconfirmed-frame-blocks-approval',
      category: 'aspect_ratio_frame_gate',
      label: 'Unconfirmed frame blocks approval',
      severity: 'blocking',
      passed: Boolean(unconfirmedFrameReport?.report.checks.some((check) =>
        check.id === 'validation-aspect-ratio-confirmed-before-approval' &&
        !check.passed &&
        check.severity === 'blocking',
      )),
      message: 'A recommended-but-unconfirmed aspect ratio must block approval in validation.',
      relatedField: 'aspectRatioFramePlan.status',
    }),
    globalCheck({
      id: 'regression-master-timing-present',
      category: 'master_timing',
      label: 'Master timing coverage',
      severity: 'blocking',
      passed: scenarioReports.length > 0 && scenarioReports.every((scenario) => scenarioCheckPassed(scenario, 'validation-master-timing-plan-exists')),
      message: 'Every demo scenario should include a MasterTimingPlan.',
      relatedField: 'EditPlan.masterTimingPlan',
    }),
    globalCheck({
      id: 'regression-master-timing-frame-accurate',
      category: 'master_timing',
      label: 'Master timing has frame base',
      severity: 'blocking',
      passed: scenarioReports.length > 0 && scenarioReports.every((scenario) => scenarioCheckPassed(scenario, 'validation-master-timing-base')),
      message: 'Every demo scenario should include fps and total frame timing.',
      relatedField: 'masterTimingPlan.timingBase',
    }),
    globalCheck({
      id: 'regression-unconfirmed-frame-blocks-timing',
      category: 'master_timing',
      label: 'Unconfirmed frame blocks timing readiness',
      severity: 'blocking',
      passed: Boolean(unconfirmedFrameReport?.report.checks.some((check) =>
        check.id === 'validation-master-timing-frame-gate' &&
        check.passed &&
        check.severity === 'blocking',
      )),
      message: 'A recommended-but-unconfirmed aspect ratio must keep Master Timing in a blocked/draft approval state.',
      relatedField: 'masterTimingPlan.status',
    }),
    globalCheck({
      id: 'regression-caption-visual-cue-timing-present',
      category: 'caption_visual_cue_timing',
      label: 'Caption + visual cue timing coverage',
      severity: 'blocking',
      passed: scenarioReports.length > 0 && scenarioReports.every((scenario) => scenarioCheckPassed(scenario, 'validation-caption-visual-cue-plan-exists')),
      message: 'Every demo scenario should include CaptionVisualCueTimingPlan.',
      relatedField: 'EditPlan.captionVisualCueTimingPlan',
    }),
    globalCheck({
      id: 'regression-caption-visual-cue-frame-ranges',
      category: 'caption_visual_cue_timing',
      label: 'Caption + visual cue frame ranges',
      severity: 'error',
      passed: scenarioReports.length > 0 && scenarioReports.every((scenario) =>
        scenarioCheckPassed(scenario, 'validation-refined-caption-ranges') &&
        scenarioCheckPassed(scenario, 'validation-visual-cue-ranges'),
      ),
      message: 'Demo scenarios should include frame-accurate refined captions and visual cues.',
      relatedField: 'captionVisualCueTimingPlan',
    }),
    globalCheck({
      id: 'regression-caption-visual-cue-basic-restraint',
      category: 'caption_visual_cue_timing',
      label: 'Basic caption cue restraint',
      severity: 'blocking',
      passed: scenarioReports.length > 0 && scenarioReports.every((scenario) => scenarioCheckPassed(scenario, 'validation-caption-visual-basic-restraint')),
      message: 'Basic scenarios should avoid aggressive kinetic caption defaults.',
      relatedField: 'captionVisualCueTimingPlan.captionPolicy',
    }),
    globalCheck({
      id: 'regression-soundsync-transition-timing-present',
      category: 'soundsync_transition_timing',
      label: 'SoundSync + transition timing coverage',
      severity: 'blocking',
      passed: scenarioReports.length > 0 && scenarioReports.every((scenario) => scenarioCheckPassed(scenario, 'validation-soundsync-transition-plan-exists')),
      message: 'Every demo scenario should include SoundSyncTransitionTimingPlan.',
      relatedField: 'EditPlan.soundSyncTransitionTimingPlan',
    }),
    globalCheck({
      id: 'regression-soundsync-transition-ranges',
      category: 'soundsync_transition_timing',
      label: 'SoundSync transition frame ranges',
      severity: 'error',
      passed: scenarioReports.length > 0 && scenarioReports.every((scenario) =>
        scenarioCheckPassed(scenario, 'validation-soundsync-transition-ranges') &&
        scenarioCheckPassed(scenario, 'validation-soundsync-sfx-linked') &&
        scenarioCheckPassed(scenario, 'validation-soundsync-speech-first'),
      ),
      message: 'Demo scenarios should include valid refined transition/SFX ranges with speech-first timing.',
      relatedField: 'soundSyncTransitionTimingPlan',
    }),
    globalCheck({
      id: 'regression-soundsync-basic-restraint',
      category: 'soundsync_transition_timing',
      label: 'Basic SoundSync restraint',
      severity: 'blocking',
      passed: scenarioReports.length > 0 && scenarioReports.every((scenario) => scenarioCheckPassed(scenario, 'validation-soundsync-basic-restraint')),
      message: 'Basic scenarios should keep SFX and beat complexity low.',
      relatedField: 'soundSyncTransitionTimingPlan.sfxDensityLevel',
    }),
    globalCheck({
      id: 'regression-soundsync-audioflux-not-essentia',
      category: 'soundsync_transition_timing',
      label: 'AudioFlux future analysis policy',
      severity: 'blocking',
      passed: scenarioReports.length > 0 && scenarioReports.every((scenario) => scenarioCheckPassed(scenario, 'validation-soundsync-audioflux-not-essentia')),
      message: 'AudioFlux should be represented as the future analysis tool; Essentia must not be the launch default.',
      relatedField: 'soundSyncTransitionTimingPlan.beatGridPlan.analysisToolPlanned',
    }),
    globalCheck({
      id: 'regression-timing-validation-present',
      category: 'timing_validation',
      label: 'Timing validation coverage',
      severity: 'blocking',
      passed: scenarioReports.length > 0 && scenarioReports.every((scenario) => scenarioCheckPassed(scenario, 'validation-timing-validation-plan-exists')),
      message: 'Every demo scenario should include TimingValidationPlan.',
      relatedField: 'EditPlan.timingValidationPlan',
    }),
    globalCheck({
      id: 'regression-timing-validation-confirmed-not-blocked',
      category: 'timing_validation',
      label: 'Confirmed scenarios pass timing validation gate',
      severity: 'blocking',
      passed: scenarioReports.length > 0 && scenarioReports.every((scenario) => scenarioCheckPassed(scenario, 'validation-timing-validation-status')),
      message: 'Confirmed-frame demo scenarios should not have blocking/failed timing validation.',
      relatedField: 'timingValidationPlan.overallStatus',
    }),
    globalCheck({
      id: 'regression-unconfirmed-frame-blocks-timing-validation',
      category: 'timing_validation',
      label: 'Unconfirmed frame blocks timing validation',
      severity: 'blocking',
      passed: Boolean(unconfirmedFrameReport?.report.checks.some((check) =>
        check.id === 'validation-timing-validation-status' &&
        !check.passed &&
        check.severity === 'blocking',
      )),
      message: 'A recommended-but-unconfirmed aspect ratio should make timing validation approval-blocking.',
      relatedField: 'timingValidationPlan.approvalBlocked',
    }),
    globalCheck({
      id: 'regression-timing-validation-tradeoffs',
      category: 'timing_validation',
      label: 'High timing complexity includes tradeoffs',
      severity: 'warning',
      passed: scenarioReports.length > 0 && scenarioReports.every((scenario) => scenarioCheckPassed(scenario, 'validation-timing-validation-credit-tradeoffs')),
      message: 'High/premium timing credit impact should include lower-cost timing alternatives.',
      relatedField: 'timingValidationPlan.lowerCostRecommendations',
    }),
    globalCheck({
      id: 'regression-planning-system-audit-not-blocking',
      category: 'planning_system_audit',
      label: 'No blocking audit status',
      severity: 'blocking',
      passed: scenarioReports.length > 0 && scenarioReports.every((scenario) => scenarioCheckPassed(scenario, 'validation-planning-system-audit-not-blocking')),
      message: 'No demo scenario should have a blocking planning system audit status.',
      relatedField: 'planningSystemAuditReport.overallStatus',
    }),
    globalCheck({
      id: 'regression-planning-system-audit-launch-stack',
      category: 'planning_system_audit',
      label: 'Launch stack audit checks pass',
      severity: 'warning',
      passed: scenarioReports.length > 0 && scenarioReports.every((scenario) => scenarioCheckPassed(scenario, 'validation-planning-system-audit-launch-stack')),
      message: 'Demo scenarios should pass launch stack checks for AudioFlux, Signalsmith Stretch, FFmpeg LGPL Configuration, VapourSynth, Sharp + libvips, and non-default Essentia/Rubber Band.',
      relatedField: 'planningSystemAuditReport.launchToolStackChecks',
    }),
    globalCheck({
      id: 'regression-supabase-schema-bridge-present',
      category: 'planning_system_audit',
      label: 'Supabase schema bridge coverage',
      severity: 'warning',
      passed: scenarioReports.length > 0 && scenarioReports.every((scenario) => scenarioCheckPassed(scenario, 'validation-supabase-schema-bridge-exists')),
      message: 'All demo scenarios should include the Supabase schema planning bridge for future migration planning.',
      relatedField: 'EditPlan.supabaseSchemaPlan',
    }),
    globalCheck({
      id: 'regression-supabase-approved-snapshot-planned',
      category: 'approved_snapshot',
      label: 'Approved snapshot table planned',
      severity: 'warning',
      passed: scenarioReports.length > 0 && scenarioReports.every((scenario) => scenarioCheckPassed(scenario, 'validation-supabase-approved-snapshot-table')),
      message: 'All demo scenarios should carry a schema bridge that plans approved_plan_snapshots.',
      relatedField: 'supabaseSchemaPlan.tables.approved_plan_snapshots',
    }),
    globalCheck({
      id: 'regression-migration-drafts-present',
      category: 'migration_drafts',
      label: 'SQL migration drafts coverage',
      severity: 'warning',
      passed: scenarioReports.length > 0 && scenarioReports.every((scenario) => scenarioCheckPassed(scenario, 'validation-migration-draft-plan-exists')),
      message: 'All demo scenarios should include the review-only SQL migration draft registry.',
      relatedField: 'EditPlan.migrationDraftPlan',
    }),
    globalCheck({
      id: 'regression-migration-drafts-not-active',
      category: 'migration_drafts',
      label: 'SQL drafts avoid active migration path',
      severity: 'blocking',
      passed: scenarioReports.length > 0 && scenarioReports.every((scenario) => scenarioCheckPassed(scenario, 'validation-migration-draft-no-active-path')),
      message: 'SQL migration draft plans must not use supabase/migrations/.',
      relatedField: 'migrationDraftPlan.files.path',
    }),
    globalCheck({
      id: 'regression-migration-drafts-do-not-run',
      category: 'migration_drafts',
      label: 'SQL drafts are must-not-run',
      severity: 'blocking',
      passed: scenarioReports.length > 0 && scenarioReports.every((scenario) => scenarioCheckPassed(scenario, 'validation-migration-draft-do-not-run')),
      message: 'All SQL draft files should remain review-only and marked mustNotRun.',
      relatedField: 'migrationDraftPlan.files.mustNotRun',
    }),
    globalCheck({
      id: 'regression-migration-review-present',
      category: 'migration_review_rls',
      label: 'Migration review coverage',
      severity: 'warning',
      passed: scenarioReports.length > 0 && scenarioReports.every((scenario) => scenarioCheckPassed(scenario, 'validation-migration-review-plan-exists')),
      message: 'All demo scenarios should include the RP-DATA-03 migration review and RLS hardening plan.',
      relatedField: 'EditPlan.migrationReviewPlan',
    }),
    globalCheck({
      id: 'regression-migration-review-approved-immutable',
      category: 'migration_review_rls',
      label: 'Approved snapshots immutable in review',
      severity: 'blocking',
      passed: scenarioReports.length > 0 && scenarioReports.every((scenario) => scenarioCheckPassed(scenario, 'validation-migration-review-approved-immutable')),
      message: 'Migration review should preserve approved snapshot immutability across demo scenarios.',
      relatedField: 'migrationReviewPlan.rlsHardeningPlan',
    }),
    globalCheck({
      id: 'regression-migration-review-worker-service-only',
      category: 'migration_review_rls',
      label: 'Worker writes service-only in review',
      severity: 'blocking',
      passed: scenarioReports.length > 0 && scenarioReports.every((scenario) => scenarioCheckPassed(scenario, 'validation-migration-review-worker-service-only')),
      message: 'Migration review should keep worker/generation/job writes service-only across demo scenarios.',
      relatedField: 'migrationReviewPlan.rlsHardeningPlan',
    }),
    globalCheck({
      id: 'regression-supabase-production-readiness-present',
      category: 'supabase_production_readiness',
      label: 'Supabase production-test readiness coverage',
      severity: 'warning',
      passed: scenarioReports.length > 0 && scenarioReports.every((scenario) => scenarioCheckPassed(scenario, 'validation-supabase-production-readiness-exists')),
      message: 'All demo scenarios should include the RP-DATA-04 Supabase production-test readiness plan.',
      relatedField: 'EditPlan.supabaseProductionReadinessPlan',
    }),
    globalCheck({
      id: 'regression-supabase-production-readiness-not-production-ready',
      category: 'supabase_production_readiness',
      label: 'Readiness stays local-testing required',
      severity: 'blocking',
      passed: scenarioReports.length > 0 && scenarioReports.every((scenario) => scenarioCheckPassed(scenario, 'validation-supabase-production-readiness-status')),
      message: 'Demo scenarios must not claim production readiness before manual local/staging testing and approval.',
      relatedField: 'supabaseProductionReadinessPlan.status',
    }),
    globalCheck({
      id: 'regression-supabase-production-readiness-no-execution',
      category: 'supabase_production_readiness',
      label: 'No Supabase execution in readiness plan',
      severity: 'blocking',
      passed: scenarioReports.length > 0 && scenarioReports.every((scenario) => scenarioCheckPassed(scenario, 'validation-supabase-production-readiness-no-execution')),
      message: 'Production-test readiness should list files and tests only; it must not imply SQL execution or Supabase connection.',
      relatedField: 'supabaseProductionReadinessPlan.limitations',
    }),
    globalCheck({
      id: 'regression-audioflux-launch-default',
      category: 'audio_pipeline',
      label: 'AudioFlux replaces Essentia for launch',
      severity: 'warning',
      passed: scenarioReports.length > 0 && scenarioReports.every((scenario) => scenarioCheckPassed(scenario, 'validation-audio-pipeline-audioflux-launch')),
      message: 'No demo scenario should use Essentia as the launch SoundSync analysis default.',
      relatedField: 'audioPipelinePlan.toolsPlanned',
    }),
    globalCheck({
      id: 'regression-signalsmith-launch-default',
      category: 'audio_pipeline',
      label: 'Signalsmith replaces Rubber Band for launch',
      severity: 'warning',
      passed: scenarioReports.length > 0 && scenarioReports.every((scenario) => scenarioCheckPassed(scenario, 'validation-audio-pipeline-signalsmith-launch')),
      message: 'No demo scenario should use Rubber Band as the launch stretch/pitch default.',
      relatedField: 'audioPipelinePlan.toolsPlanned',
    }),
    globalCheck({
      id: 'regression-signalsmith-stretch-scope',
      category: 'tool_strategy',
      label: 'Signalsmith only appears for stretch/pitch',
      severity: 'warning',
      passed: scenarioReports.length > 0 && scenarioReports.every((scenario) => scenarioCheckPassed(scenario, 'validation-tool-strategy-signalsmith-scope')),
      message: 'Signalsmith Stretch should be planned only when music stretch, pitch, or duration fitting is needed.',
      relatedField: 'toolStrategyPlan.items.selectedToolIds',
    }),
    globalCheck({
      id: 'regression-ffmpeg-lgpl-boundary',
      category: 'audio_pipeline',
      label: 'FFmpeg LGPL Configuration boundary',
      severity: 'warning',
      passed: scenarioReports.length > 0 && scenarioReports.every((scenario) => scenarioCheckPassed(scenario, 'validation-audio-pipeline-ffmpeg-lgpl')),
      message: 'Demo scenarios should keep FFmpeg as LGPL Configuration and avoid GPL/nonfree build assumptions.',
      relatedField: 'audioPipelinePlan.limitations',
    }),
    globalCheck({
      id: 'regression-basic-pro-no-veo',
      category: 'tier_policy',
      label: 'Basic/Pro no Veo still passes',
      severity: 'blocking',
      passed: scenarioReports.length > 0 && scenarioReports.every((scenario) => {
        if (scenario.editLevel === 'premium') {
          return true
        }

        return scenarioCheckPassed(scenario, 'validation-basic-pro-no-veo-routes') &&
          scenarioCheckPassed(scenario, 'validation-basic-pro-no-veo-prompts') &&
          scenarioCheckPassed(scenario, 'validation-basic-pro-no-veo-qa')
      }),
      message: 'Basic and Pro demo scenarios must not route to Veo.',
      relatedField: 'visualAssetPlan.providerRoute',
    }),
    globalCheck({
      id: 'regression-premium-veo-fallback-only',
      category: 'tier_policy',
      label: 'Premium fallback-only Veo still passes',
      severity: 'blocking',
      passed: scenarioReports.length > 0 && scenarioReports.every((scenario) => {
        if (scenario.editLevel !== 'premium') {
          return true
        }

        return scenarioCheckPassed(scenario, 'validation-premium-veo-fallback-only')
      }),
      message: 'Premium demo scenarios may reference Veo only as final fallback/rescue.',
      relatedField: 'visualAssetPlan.providerRoute',
    }),
    globalCheck({
      id: 'regression-tool-strategy-launch-audio-stack',
      category: 'tool_strategy',
      label: 'Tool strategy uses launch audio stack',
      severity: 'warning',
      passed: scenarioReports.length > 0 && scenarioReports.every((scenario) => scenarioCheckPassed(scenario, 'validation-tool-strategy-launch-audio-tools')),
      message: 'Demo tool strategies should use FFmpeg LGPL Configuration plus AudioFlux for SoundSync where audio analysis is planned.',
      relatedField: 'toolStrategyPlan.items.selectedToolIds',
    }),
  ]
}

function countFailures(checks: PlanValidationCheck[], severity: PlanValidationCheck['severity']) {
  return checks.filter((check) => !check.passed && check.severity === severity).length
}

function aggregateStatus(params: {
  scenarioReports: ScenarioValidationReport[]
  globalChecks: PlanValidationCheck[]
}): PlanValidationStatus {
  const { globalChecks, scenarioReports } = params
  const scenarioFailed = scenarioReports.some((scenario) => scenario.report.status === 'failed')
  const globalFailed = globalChecks.some((check) => !check.passed && (check.severity === 'blocking' || check.severity === 'error'))

  if (scenarioFailed || globalFailed) {
    return 'failed'
  }

  const scenarioWarning = scenarioReports.some((scenario) => scenario.report.status === 'warning')
  const globalWarning = globalChecks.some((check) => !check.passed && check.severity === 'warning')

  return scenarioWarning || globalWarning ? 'warning' : 'passed'
}

export function runPlannerRegression(): PlannerRegressionReport {
  const scenarioReports: ScenarioValidationReport[] = demoScenarios.map((scenario) => {
    const input = inputFromScenario(scenario)
    const plan = createMockEditPlan(input)
    const report = validateMockEditPlan({
      input,
      plan,
      scenarioId: scenario.id,
    })

    return {
      scenarioId: scenario.id,
      scenarioLabel: scenario.label,
      editLevel: scenario.editLevel,
      editingCategory: scenario.editingCategory,
      report,
    }
  })
  const unconfirmedScenario = demoScenarios[0]
  const unconfirmedInput = unconfirmedScenario
    ? {
        ...inputFromScenario(unconfirmedScenario),
        aspectRatioConfirmed: false,
        aspectRatioSource: 'platform_recommended' as const,
      }
    : undefined
  const unconfirmedPlan = unconfirmedInput ? createMockEditPlan(unconfirmedInput) : undefined
  const unconfirmedFrameReport: ScenarioValidationReport | undefined =
    unconfirmedScenario && unconfirmedInput && unconfirmedPlan
      ? {
          scenarioId: `${unconfirmedScenario.id}-unconfirmed-frame`,
          scenarioLabel: `${unconfirmedScenario.label} / unconfirmed frame gate`,
          editLevel: unconfirmedScenario.editLevel,
          editingCategory: unconfirmedScenario.editingCategory,
          report: validateMockEditPlan({
            input: unconfirmedInput,
            plan: unconfirmedPlan,
            scenarioId: unconfirmedScenario.id,
          }),
        }
      : undefined
  const globalChecks = createGlobalChecks(scenarioReports, unconfirmedFrameReport)
  const status = aggregateStatus({ globalChecks, scenarioReports })
  const blockingCount = scenarioReports.reduce((total, scenario) => total + scenario.report.blockingCount, 0) +
    countFailures(globalChecks, 'blocking')
  const errorCount = scenarioReports.reduce((total, scenario) => total + scenario.report.errorCount, 0) +
    countFailures(globalChecks, 'error')
  const warningCount = scenarioReports.reduce((total, scenario) => total + scenario.report.warningCount, 0) +
    countFailures(globalChecks, 'warning')
  const passedCount = scenarioReports.reduce((total, scenario) => total + scenario.report.passedCount, 0) +
    globalChecks.filter((check) => check.passed).length
  const issueCount = blockingCount + errorCount + warningCount

  return {
    id: 'planner-regression-launch-demos',
    status,
    summary:
      status === 'passed'
        ? 'All launch demo scenarios follow the current mock planner rules.'
        : `${issueCount} regression check${issueCount === 1 ? '' : 's'} need attention across launch demo scenarios.`,
    scenarioReports,
    globalChecks,
    blockingCount,
    errorCount,
    warningCount,
    passedCount,
  }
}
