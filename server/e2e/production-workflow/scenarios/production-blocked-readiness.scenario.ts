import { defaultFixturePolicy, type ProductionWorkflowScenario } from '../production-workflow-scenario-types'

export const productionBlockedReadinessScenario: ProductionWorkflowScenario = {
  scenarioId: 'production-blocked-readiness',
  displayName: 'Production Blocked Readiness',
  description: 'Validates production-ready E2E blocking when current readiness/model/manual-review blockers remain.',
  mode: 'production_ready',
  targetPlatform: 'youtube',
  aspectRatio: '16:9',
  expectedStages: ['readiness_summary', 'final_render_export_execution', 'final_workflow_report'],
  requiredArtifacts: [],
  requiredQAGates: ['final_delivery'],
  allowedLocalDevTools: [],
  expectedBlockers: ['Production-ready workflow blocked by readiness/model/manual-review gates.'],
  expectedWarnings: ['Production-ready execution remains blocked until M12 readiness blockers are resolved.'],
  fixturePolicy: defaultFixturePolicy(['No media processing in production-ready blocker scenario.']),
  finalExportExpected: true,
  productionReadyExpected: false,
  notes: ['This scenario must not bypass readiness.'],
}
