import { buildMaskModelApprovalReport } from './mask-model-approval-report-builder'

export function buildMaskModelWeightSummary(): string {
  const report = buildMaskModelApprovalReport()
  const approved = report.approvedModels.map((model) => `${model.modelWeightManifestId}: ${model.modelName} (${model.checksum})`)
  const evaluated = report.evaluatedOnlyModels.map((candidate) => `${candidate.candidateId}: ${candidate.modelName}`)
  return [
    'Mask model weight summary',
    `Approved staging manifests: ${report.approvedModels.length}`,
    ...(approved.length ? approved.map((item) => `- ${item}`) : ['- none']),
    '',
    `Evaluated-only candidates: ${report.evaluatedOnlyModels.length}`,
    ...(evaluated.length ? evaluated.map((item) => `- ${item}`) : ['- none']),
    '',
    `Storage path: ${report.storagePlan.stagingStoragePath}`,
    `Download plan: text-only (${report.downloadCommandPlan.length} commands)`,
    `Model download executed: ${report.modelDownloadExecuted}`,
    `Production ready allowed: ${report.productionReadyAllowed}`,
    `External beta allowed: ${report.externalBetaAllowed}`,
    `Broad real user media allowed: ${report.broadRealUserMediaAllowed}`,
  ].join('\n')
}
