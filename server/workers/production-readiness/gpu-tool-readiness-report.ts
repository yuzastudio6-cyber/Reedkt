import type { ProductionReadinessStatus } from './production-tool-readiness-types'
import type { GpuAiReadinessCheckResult } from './gpu-ai-readiness-checks'
import type { GpuModelWeightReadinessCheck } from './gpu-model-weight-checks'
import type { GpuRuntimeEnvironmentCheck } from './gpu-runtime-env-checks'

export interface GpuToolReadinessReport {
  totalChecks: number
  packageReadiness: ProductionReadinessStatus
  runtimeReadiness: ProductionReadinessStatus
  modelWeightReadiness: ProductionReadinessStatus
  licenseReviewStatus: ProductionReadinessStatus
  dryRunStatus: ProductionReadinessStatus
  optionalRealImportStatus: ProductionReadinessStatus
  productionBlockers: string[]
  modelWeightBlockedTools: string[]
  pendingSourceInstallReviewTools: string[]
  notes: string[]
}

function aggregateReadiness(statuses: ProductionReadinessStatus[]): ProductionReadinessStatus {
  if (statuses.includes('blocked')) return 'blocked'
  if (statuses.includes('missing')) return 'missing'
  if (statuses.includes('not_installed')) return 'not_installed'
  if (statuses.includes('needs_license_review')) return 'needs_license_review'
  if (statuses.includes('pending_manual_review')) return 'pending_manual_review'
  if (statuses.includes('warning')) return 'warning'
  if (statuses.length > 0 && statuses.every((status) => status === 'passed')) return 'passed'
  return 'not_checked'
}

export function buildGpuToolReadinessReport(input: {
  dryRun: boolean
  importChecks: GpuAiReadinessCheckResult[]
  modelWeightChecks: GpuModelWeightReadinessCheck[]
  runtimeChecks: GpuRuntimeEnvironmentCheck[]
  pendingSourceInstallReviewTools: string[]
}): GpuToolReadinessReport {
  const modelBlocked = input.modelWeightChecks.filter((check) => !check.productionEvaluation.allowedForProduction)
  const runtimeStatuses: ProductionReadinessStatus[] = input.runtimeChecks.map((check) => (
    check.status === 'passed' ? 'passed' : check.status
  ))
  const packageStatuses = input.importChecks.map((check) => check.status)

  return {
    totalChecks: input.importChecks.length + input.modelWeightChecks.length + input.runtimeChecks.length,
    packageReadiness: input.dryRun ? 'not_checked' : aggregateReadiness(packageStatuses),
    runtimeReadiness: aggregateReadiness(runtimeStatuses),
    modelWeightReadiness: modelBlocked.length > 0 ? 'blocked' : 'passed',
    licenseReviewStatus: modelBlocked.length > 0 ? 'needs_license_review' : 'passed',
    dryRunStatus: input.dryRun ? 'not_checked' : 'passed',
    optionalRealImportStatus: input.dryRun ? 'not_checked' : aggregateReadiness(packageStatuses),
    productionBlockers: [
      ...modelBlocked.flatMap((check) => check.productionEvaluation.blockingReasons),
      ...input.runtimeChecks.filter((check) => check.status === 'blocked').map((check) => check.message),
    ],
    modelWeightBlockedTools: Array.from(new Set(modelBlocked.map((check) => check.toolId))),
    pendingSourceInstallReviewTools: input.pendingSourceInstallReviewTools,
    notes: [
      'GPU readiness is dry-run by default and must not import heavy packages unless explicitly requested.',
      'Optional real import checks must not run inference, load weights, require GPU, or process media.',
      'Model/checkpoint license approval is separate from code/package license approval.',
      'Unknown, non-commercial, missing, or needs-review weights block paid production.',
    ],
  }
}
