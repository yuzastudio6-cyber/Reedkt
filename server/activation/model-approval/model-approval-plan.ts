import { buildModelApprovalReport } from './model-approval-report-builder'

export function buildModelApprovalPlanReport() {
  const report = buildModelApprovalReport()
  return {
    reportId: 'activation-phase-26-model-approval-plan',
    approvedModelScope: report.approvedModels.map((model) => ({
      manifestId: model.modelWeightManifestId,
      modelName: model.modelName,
      approvedFor: model.approvedFor,
      productionStatus: model.productionStatus,
    })),
    storagePlan: report.storagePlan,
    downloadCommandPlan: report.downloadCommandPlan,
    blockers: report.blockers,
    warnings: report.warnings,
    modelDownloadExecuted: false,
    providerExecuted: false,
    gpuDeployed: false,
    productionReadyAllowed: false,
    externalBetaAllowed: false,
    realUserMediaTestingAllowed: false,
  }
}

export function summarizeModelApprovalPlan(report: ReturnType<typeof buildModelApprovalPlanReport>): string {
  return [
    `Model approval plan: ${report.reportId}`,
    `Approved model scope: ${report.approvedModelScope.map((scope) => scope.modelName).join(', ') || '(none)'}`,
    `Storage path: ${report.storagePlan.stagingStoragePath}`,
    `Runtime path: ${report.storagePlan.expectedRuntimePath}`,
    `Download commands: ${report.downloadCommandPlan.length} (text-only, not executed)`,
    `Blockers: ${report.blockers.length}`,
    `Model download executed: ${report.modelDownloadExecuted}`,
    `Production ready allowed: ${report.productionReadyAllowed}`,
    `External beta allowed: ${report.externalBetaAllowed}`,
    `Real user media testing allowed: ${report.realUserMediaTestingAllowed}`,
    '',
    'Download command plan:',
    ...report.downloadCommandPlan.map((plan) => `- ${plan.commandId}: ${plan.commandString}`),
    '',
    'Warnings:',
    ...(report.warnings.length ? report.warnings.map((warning) => `- ${warning}`) : ['- none']),
  ].join('\n')
}
