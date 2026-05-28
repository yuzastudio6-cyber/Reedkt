import { buildMaskModelDownloadReport } from '../mask-model-download'
import { buildBiRefNetCustomCodeScanSummary } from './birefnet-runtime-custom-code-scan'
import { validateBiRefNetRuntimeExecutionReport } from './birefnet-runtime-mask-qa'
import { buildBiRefNetRuntimeModelSyncSummary } from './birefnet-runtime-model-sync'
import { birefnetRuntimeConfig, validateBiRefNetRuntimeEnv } from './birefnet-runtime-policy'
import type { BiRefNetRuntimeExecutionReport } from './birefnet-runtime-types'

export function buildBiRefNetRuntimeBlockers(input: {
  executionReport?: BiRefNetRuntimeExecutionReport
  env?: Parameters<typeof validateBiRefNetRuntimeEnv>[0]
} = {}): { blockers: string[]; warnings: string[] } {
  const blockers: string[] = []
  const warnings: string[] = []
  const downloadReport = buildMaskModelDownloadReport()
  const modelSync = buildBiRefNetRuntimeModelSyncSummary()
  const customCode = buildBiRefNetCustomCodeScanSummary()

  blockers.push(...validateBiRefNetRuntimeEnv(input.env ?? {
    projectId: birefnetRuntimeConfig.projectId,
    region: birefnetRuntimeConfig.region,
    env: birefnetRuntimeConfig.env,
    confirmation: 'true',
    imageTag: birefnetRuntimeConfig.imageTag,
    modelManifestId: birefnetRuntimeConfig.modelManifestId,
    modelGcsPath: birefnetRuntimeConfig.modelGcsPath,
    modelRevision: birefnetRuntimeConfig.modelRevision,
    modelChecksum: birefnetRuntimeConfig.modelAggregateSha256,
    gpuType: birefnetRuntimeConfig.gpuType,
  }))
  blockers.push(...downloadReport.blockers)
  blockers.push(...modelSync.blockers)
  blockers.push(...customCode.blockers)
  warnings.push(...downloadReport.warnings, ...modelSync.warnings, ...customCode.warnings)

  if (input.executionReport) blockers.push(...validateBiRefNetRuntimeExecutionReport(input.executionReport))
  else warnings.push('Phase 33C runtime execution report is not present until the Cloud Run job runs.')

  return {
    blockers: Array.from(new Set(blockers)),
    warnings: Array.from(new Set(warnings)),
  }
}
