import { privateMediaPolicy } from '../privacy-retention'
import { detectFrontendBackendBoundaryFindings } from './frontend-backend-boundary-policy'
import { modelWeightSecurityPolicy } from './model-weight-security-policy'
import { detectRawPromptExecutionFindings } from './raw-prompt-execution-block-policy'
import { detectSecretSafetyFindings } from './secret-safety-policy'
import { detectSignedUrlSafetyFindings } from './signed-url-safety-policy'
import { toolExecutionSecurityPolicy } from './tool-execution-security-policy'
import type { SecurityReviewFinding, SecurityReviewReport, SecurityReviewStatus, SourceFileSnapshot } from './security-review-types'

export interface BuildSecurityReviewReportOptions {
  payload?: unknown
  files?: SourceFileSnapshot[]
  modelWeightStatuses?: string[]
  storagePrivate?: boolean
}

function statusForArea(findings: SecurityReviewFinding[], area: SecurityReviewFinding['area'], defaultStatus: SecurityReviewStatus = 'passed'): SecurityReviewStatus {
  if (findings.some((finding) => finding.area === area && finding.status === 'blocked')) return 'blocked'
  if (findings.some((finding) => finding.area === area && finding.status === 'warning')) return 'warning'
  return defaultStatus
}

export function buildSecurityReviewReport(options: BuildSecurityReviewReportOptions = {}): SecurityReviewReport {
  const payload = options.payload ?? {}
  const files = options.files ?? []
  const findings: SecurityReviewFinding[] = [
    ...detectSecretSafetyFindings(payload, files),
    ...detectSignedUrlSafetyFindings(payload),
    ...detectRawPromptExecutionFindings(payload),
    ...detectFrontendBackendBoundaryFindings(files),
  ]

  if (!options.modelWeightStatuses?.every((status) => status === 'approved')) {
    findings.push({
      area: 'model_weight_security',
      status: 'blocked',
      message: 'Model weights are not approved for production; unknown, missing, or needs_review manifests block launch.',
    })
  }

  if (!toolExecutionSecurityPolicy.approvedSnapshotRequired || !toolExecutionSecurityPolicy.idempotencyRequired) {
    findings.push({
      area: 'tool_execution_security',
      status: 'blocked',
      message: 'Tool execution must require approved snapshots and idempotency.',
    })
  }

  if (options.storagePrivate === false || !privateMediaPolicy.privateStorageRefsRequired) {
    findings.push({
      area: 'storage_privacy',
      status: 'blocked',
      message: 'Private storage refs are required for media and exports.',
    })
  }

  const blockers = findings.filter((finding) => finding.status === 'blocked').map((finding) => finding.message)
  const warnings = findings.filter((finding) => finding.status === 'warning').map((finding) => finding.message)

  return {
    reportId: `security-review-${new Date().toISOString()}`,
    createdAt: new Date().toISOString(),
    secretSafetyStatus: statusForArea(findings, 'secret_safety'),
    signedUrlSafetyStatus: statusForArea(findings, 'signed_url_safety'),
    rawPromptExecutionStatus: statusForArea(findings, 'raw_prompt_execution'),
    frontendBackendBoundaryStatus: statusForArea(findings, 'frontend_backend_boundary'),
    modelWeightSecurityStatus: statusForArea(findings, 'model_weight_security', modelWeightSecurityPolicy.needsReviewBlocksProduction ? 'blocked' : 'passed'),
    toolExecutionSecurityStatus: statusForArea(findings, 'tool_execution_security'),
    storagePrivacyStatus: statusForArea(findings, 'storage_privacy'),
    findings,
    blockers,
    warnings,
    nextActions: [
      'Complete model-weight and license review before production-ready execution.',
      'Run frontend/backend boundary scans in CI before external beta.',
      'Keep logs, audit events, and artifacts free of secrets, signed URLs, and raw prompts.',
    ],
  }
}
