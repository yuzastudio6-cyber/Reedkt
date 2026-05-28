import { buildEnhancementModelApprovalReport } from './enhancement-model-approval-report-builder'

export function buildEnhancementModelWeightSummary(): string {
  const report = buildEnhancementModelApprovalReport()
  const approved = report.approvedModels.map((model) => `${model.modelWeightManifestId}: ${model.modelName} (${model.checksum})`)
  const evaluated = report.evaluatedOnlyModels.map((candidate) => `${candidate.candidateId}: ${candidate.modelName}`)
  return [
    'Enhancement model weight summary',
    `Approved staging manifests: ${report.approvedModels.length}`,
    ...(approved.length ? approved.map((item) => `- ${item}`) : ['- none']),
    '',
    `Evaluated-only candidates: ${report.evaluatedOnlyModels.length}`,
    ...(evaluated.length ? evaluated.map((item) => `- ${item}`) : ['- none']),
    '',
    `Storage path: ${report.storagePlan.stagingStoragePath}`,
    `FILM future storage path: ${report.storagePlan.filmFutureStoragePath}`,
    `Checksum: ${report.approvedModels[0]?.checksum ?? 'missing_until_download'}`,
    `Download plan: text-only (${report.downloadCommandPlan.length} commands)`,
    `Model download executed: ${report.modelDownloadExecuted}`,
    `Enhancement execution ran: ${report.enhancementExecutionRan}`,
    `Slow motion execution ran: ${report.slowMotionExecutionRan}`,
    `Production ready allowed: ${report.productionReadyAllowed}`,
    `External beta allowed: ${report.externalBetaAllowed}`,
    `Broad real user media allowed: ${report.broadRealUserMediaAllowed}`,
  ].join('\n')
}
