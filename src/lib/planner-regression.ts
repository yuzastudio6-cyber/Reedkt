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

function createGlobalChecks(scenarioReports: ScenarioValidationReport[]): PlanValidationCheck[] {
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
  const globalChecks = createGlobalChecks(scenarioReports)
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
