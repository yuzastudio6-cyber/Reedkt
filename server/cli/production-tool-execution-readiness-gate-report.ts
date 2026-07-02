import { evaluateProductionToolExecutionReadinessGate } from '../beta-readiness'

const report = evaluateProductionToolExecutionReadinessGate({
  sourceId: 'production-tool-execution-readiness-gate:local-report',
  sourceSha: process.env.REEDITPRO_SOURCE_SHA,
  workspaceId: process.env.REEDITPRO_WORKSPACE_ID ?? 'workspace-production-readiness-local-report',
  projectId: process.env.REEDITPRO_PROJECT_ID ?? 'project-production-readiness-local-report',
})

console.log(JSON.stringify(report, null, 2))
