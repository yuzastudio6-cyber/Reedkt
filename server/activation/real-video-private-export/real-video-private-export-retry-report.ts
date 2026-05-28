import { buildPhase30BIamPlan } from './real-video-private-export-iam-plan'
import { buildRealVideoPrivateExportReport } from './real-video-private-export-report-builder'

export interface Phase30BRetryReport {
  reportId: 'activation-phase-30b-render-iam-retry'
  createdAt: string
  iamPlanStatus: 'planned' | 'blocked'
  iamBindingCount: number
  exportStatus: 'pending' | 'ready' | 'blocked'
  blockers: string[]
  warnings: string[]
  productionReadyAllowed: false
  externalBetaAllowed: false
  realUserMediaTestingAllowed: false
}

export function buildPhase30BRetryReport(): Phase30BRetryReport {
  const iamPlan = buildPhase30BIamPlan()
  const exportReport = buildRealVideoPrivateExportReport()
  const blockers = [
    ...iamPlan.blockers,
    ...exportReport.blockers,
  ]
  return {
    reportId: 'activation-phase-30b-render-iam-retry',
    createdAt: new Date().toISOString(),
    iamPlanStatus: iamPlan.blockers.length > 0 ? 'blocked' : 'planned',
    iamBindingCount: iamPlan.bindings.length,
    exportStatus: exportReport.status === 'ready' ? 'ready' : exportReport.status === 'blocked' ? 'blocked' : 'pending',
    blockers,
    warnings: [
      ...iamPlan.warnings,
      ...exportReport.warnings,
    ],
    productionReadyAllowed: false,
    externalBetaAllowed: false,
    realUserMediaTestingAllowed: false,
  }
}
