import { buildEnhancementModelDownloadReport } from '../enhancement-model-download'
import { validateRealEsrganRuntimeExecutionReport } from './real-esrgan-runtime-enhancement-qa'
import { buildRealEsrganRuntimeFixturePlan } from './real-esrgan-runtime-fixture-image'
import { buildRealEsrganRuntimeModelSyncSummary } from './real-esrgan-runtime-model-sync'
import { realEsrganRuntimeConfig, validateRealEsrganRuntimeEnv } from './real-esrgan-runtime-policy'
import type { RealEsrganRuntimeExecutionReport } from './real-esrgan-runtime-types'

export function buildRealEsrganRuntimeBlockers(input: {
  executionReport?: RealEsrganRuntimeExecutionReport
  env?: Parameters<typeof validateRealEsrganRuntimeEnv>[0]
} = {}): { blockers: string[]; warnings: string[] } {
  const blockers: string[] = []
  const warnings: string[] = []
  const downloadReport = buildEnhancementModelDownloadReport()
  const modelSync = buildRealEsrganRuntimeModelSyncSummary()
  const fixturePlan = buildRealEsrganRuntimeFixturePlan()

  blockers.push(...validateRealEsrganRuntimeEnv(input.env ?? {
    projectId: realEsrganRuntimeConfig.projectId,
    region: realEsrganRuntimeConfig.region,
    env: realEsrganRuntimeConfig.env,
    confirmation: 'true',
    imageTag: realEsrganRuntimeConfig.imageTag,
    modelManifestId: realEsrganRuntimeConfig.modelManifestId,
    modelGcsPath: realEsrganRuntimeConfig.modelGcsPath,
    fileSha256: realEsrganRuntimeConfig.modelFileSha256,
    aggregateSha256: realEsrganRuntimeConfig.modelAggregateSha256,
    gpuType: realEsrganRuntimeConfig.gpuType,
    faceEnhance: 'false',
  }))
  blockers.push(...downloadReport.blockers)
  blockers.push(...modelSync.blockers)
  blockers.push(...fixturePlan.blockers)
  warnings.push(...downloadReport.warnings, ...modelSync.warnings, ...fixturePlan.warnings)

  if (input.executionReport) blockers.push(...validateRealEsrganRuntimeExecutionReport(input.executionReport))
  else warnings.push('Phase 34C runtime execution report is not present until the Cloud Run job runs.')

  return {
    blockers: Array.from(new Set(blockers)),
    warnings: Array.from(new Set(warnings)),
  }
}
