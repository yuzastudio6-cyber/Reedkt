import { detectRawPromptExecutionFindings, detectSignedUrlSafetyFindings } from '../security-review'
import type { ProductionReadinessReport } from '../workers/readiness-validation'
import type { ProductionLaunchBlockerSummary } from './production-hardening-types'

export interface ClassifyProductionLaunchBlockersOptions {
  readinessReport?: ProductionReadinessReport
  modelWeightsApproved?: boolean
  launchCoreToolsReady?: boolean
  ffmpegLgplReviewed?: boolean
  renderReadinessApproved?: boolean
  revideoRequested?: boolean
  payload?: unknown
  secretsDetected?: boolean
  frontendHeavyToolPathDetected?: boolean
  idempotencyGatesPresent?: boolean
  approvedSnapshotGatesPresent?: boolean
  costControlsPresent?: boolean
  concurrencyLimitsPresent?: boolean
  retentionDeletionPolicyPresent?: boolean
  auditLoggingPolicyPresent?: boolean
  incidentRunbookExists?: boolean
  finalE2EDryRunPassed?: boolean
  blockingQAFailuresPresent?: boolean
  productionDeploymentApproved?: boolean
}

export function classifyProductionLaunchBlockers(options: ClassifyProductionLaunchBlockersOptions = {}): ProductionLaunchBlockerSummary {
  const hardBlockers: string[] = []
  const warnings: string[] = []
  const manualReviewItems: string[] = []
  const payload = options.payload ?? {}

  if (!options.readinessReport || options.readinessReport.overallStatus === 'blocked') {
    hardBlockers.push('Production readiness summary is still blocked.')
  }
  if (options.modelWeightsApproved !== true) hardBlockers.push('Model weights are missing, blocked, or still needs_review.')
  if (options.launchCoreToolsReady === false) hardBlockers.push('Required launch-core tool readiness is missing.')
  if (options.ffmpegLgplReviewed !== true) {
    manualReviewItems.push('FFmpeg LGPL commercial verification is pending.')
    warnings.push('FFmpeg LGPL commercial verification remains a manual launch blocker.')
  }
  if (options.renderReadinessApproved === false) hardBlockers.push('libass/render readiness is pending where final export is required.')
  if (options.revideoRequested) hardBlockers.push('Revideo is evaluation-only and blocked for production execution.')
  if (detectRawPromptExecutionFindings(payload).length > 0) hardBlockers.push('Raw prompt execution path is present.')
  if (detectSignedUrlSafetyFindings(payload).length > 0) hardBlockers.push('Signed URL is persisted or supplied as source of truth.')
  if (options.secretsDetected) hardBlockers.push('Secrets are present in logs, config, scripts, or payloads.')
  if (options.frontendHeavyToolPathDetected) hardBlockers.push('Frontend heavy media/AI tool execution path is present.')
  if (options.idempotencyGatesPresent === false) hardBlockers.push('Worker idempotency gates are missing.')
  if (options.approvedSnapshotGatesPresent === false) hardBlockers.push('Approved snapshot gates are missing.')
  if (options.costControlsPresent === false) hardBlockers.push('Cost controls are missing.')
  if (options.concurrencyLimitsPresent === false) hardBlockers.push('Worker concurrency limits are missing.')
  if (options.retentionDeletionPolicyPresent === false) hardBlockers.push('Artifact retention/deletion policy is missing.')
  if (options.auditLoggingPolicyPresent === false) hardBlockers.push('Audit logging policy is missing.')
  if (options.incidentRunbookExists === false) hardBlockers.push('Incident response runbook is missing.')
  if (options.finalE2EDryRunPassed === false) hardBlockers.push('Final full E2E dry-run has not passed.')
  if (options.blockingQAFailuresPresent) hardBlockers.push('Blocking QA gates failed in E2E validation.')
  if (options.productionDeploymentApproved !== true) warnings.push('No production deployment has been approved or performed.')

  warnings.push('Optional/future tools may still be missing.')
  warnings.push('OpenColorIO/OpenImageIO manual review may remain pending.')
  warnings.push('GPU tools are not built or production-enabled yet.')
  warnings.push('Runtime execution remains local-dev/static only.')
  warnings.push('Large Vite chunk warning, if present, is not a production readiness pass/fail signal yet.')

  return {
    hardBlockers: [...new Set(hardBlockers)],
    warnings: [...new Set(warnings)],
    manualReviewItems: [...new Set(manualReviewItems)],
  }
}
