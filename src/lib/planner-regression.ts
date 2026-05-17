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
  }
}

function globalCheck(params: PlanValidationCheck): PlanValidationCheck {
  return params
}

function hasScenarioMatching(predicate: (scenario: DemoScenario) => boolean) {
  return demoScenarios.some(predicate)
}

function createGlobalChecks(): PlanValidationCheck[] {
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
  const globalChecks = createGlobalChecks()
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
