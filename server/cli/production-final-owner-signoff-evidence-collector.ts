import {
  runProductionToolExecutionReadinessEvidenceCollectorFromEnv,
  type ProductionToolExecutionReadinessEvidenceCollectorEnv,
  type ProductionToolExecutionReadinessEvidenceCollectorFetch,
} from './production-tool-execution-readiness-evidence-collector'
import {
  buildProductionToolExecutionReadinessGateInput,
  resolveProductionToolExecutionReadinessEvidenceEnv,
} from './production-tool-execution-readiness-evidence-preflight'
import { collectSecretLikePaths } from '../tool-cost-metering/secret-safety'

export interface ProductionFinalOwnerSignoffEvidenceCollectorEnv
  extends ProductionToolExecutionReadinessEvidenceCollectorEnv {
  REEDITPRO_PRODUCTION_OWNER_SIGNOFF_CONFIRM_RECORD_EVIDENCE?: string
}

export interface ProductionFinalOwnerSignoffEvidenceCollectorRunResult {
  ok: boolean
  mode: 'dry_run' | 'recorded' | 'blocked_recorded'
  readyForFinalOwnerSignoffEvidence: boolean
  recordConfirmationRequired: boolean
  signoff: ProductionFinalOwnerSignoffSliceStatus
  record?: Awaited<ReturnType<typeof runProductionToolExecutionReadinessEvidenceCollectorFromEnv>>
  warnings: string[]
}

export interface ProductionFinalOwnerSignoffSliceStatus {
  ready: boolean
  evidenceArtifactIdPresent: boolean
  reviewedByPresent: boolean
  reviewedAtValid: boolean
  notesPresent: boolean
  approvals: Record<string, boolean>
  blockers: string[]
}

export async function runProductionFinalOwnerSignoffEvidenceCollectorFromEnv(
  env: ProductionFinalOwnerSignoffEvidenceCollectorEnv,
  fetchImpl: ProductionToolExecutionReadinessEvidenceCollectorFetch = fetch as ProductionToolExecutionReadinessEvidenceCollectorFetch,
): Promise<ProductionFinalOwnerSignoffEvidenceCollectorRunResult> {
  const evidenceEnv = resolveProductionToolExecutionReadinessEvidenceEnv(env).env
  const input = buildProductionToolExecutionReadinessGateInput(evidenceEnv)
  const secretLikeInputPaths = collectSecretLikePaths({
    sourceId: evidenceEnv.REEDITPRO_PRODUCTION_READINESS_SOURCE_ID,
    sourceSha: evidenceEnv.REEDITPRO_PRODUCTION_READINESS_SOURCE_SHA,
    workspaceId: evidenceEnv.REEDITPRO_PRODUCTION_READINESS_WORKSPACE_ID,
    projectId: evidenceEnv.REEDITPRO_PRODUCTION_READINESS_PROJECT_ID,
    reviewedBy: evidenceEnv.REEDITPRO_PRODUCTION_EVIDENCE_REVIEWED_BY,
    reviewedAt: evidenceEnv.REEDITPRO_PRODUCTION_EVIDENCE_REVIEWED_AT,
    ownerArtifactId: evidenceEnv.REEDITPRO_PRODUCTION_OWNER_EVIDENCE_ARTIFACT_ID,
    ownerNotes: evidenceEnv.REEDITPRO_PRODUCTION_OWNER_NOTES,
    idempotencyKey: env.REEDITPRO_PRODUCTION_READINESS_IDEMPOTENCY_KEY,
  }, 'productionFinalOwnerSignoffEvidenceCollector')
  if (secretLikeInputPaths.length > 0) {
    throw new Error(`Production final owner signoff evidence collector inputs contain secret-like values: ${secretLikeInputPaths.join('; ')}`)
  }

  const signoff = buildSignoffStatus({
    evidenceArtifactId: input.finalOwnerSignoff?.evidenceArtifactId,
    reviewedBy: input.finalOwnerSignoff?.reviewedBy,
    reviewedAt: input.finalOwnerSignoff?.reviewedAt,
    notes: input.finalOwnerSignoff?.notes,
    approvals: {
      deploymentOwnerApproved: Boolean(input.finalOwnerSignoff?.deploymentOwnerApproved),
      securityOwnerApproved: Boolean(input.finalOwnerSignoff?.securityOwnerApproved),
      storagePrivacyOwnerApproved: Boolean(input.finalOwnerSignoff?.storagePrivacyOwnerApproved),
      legalOwnerApproved: Boolean(input.finalOwnerSignoff?.legalOwnerApproved),
      supportOwnerApproved: Boolean(input.finalOwnerSignoff?.supportOwnerApproved),
      billingOwnerApproved: Boolean(input.finalOwnerSignoff?.billingOwnerApproved),
      operationsOwnerApproved: Boolean(input.finalOwnerSignoff?.operationsOwnerApproved),
      realUserMediaBetaApproved: Boolean(input.finalOwnerSignoff?.realUserMediaBetaApproved),
      privateMediaApproval: Boolean(input.finalOwnerSignoff?.privateMediaApproval),
      artifactPrivacyEvidenceReady: Boolean(input.finalOwnerSignoff?.artifactPrivacyEvidenceReady),
      paidProductionApproved: Boolean(input.finalOwnerSignoff?.paidProductionApproved),
      finalDeliveryShareApproved: Boolean(input.finalOwnerSignoff?.finalDeliveryShareApproved),
    },
  })
  const confirmRecordEvidence = parseBoolean(env.REEDITPRO_PRODUCTION_OWNER_SIGNOFF_CONFIRM_RECORD_EVIDENCE)

  if (!signoff.ready) {
    return {
      ok: false,
      mode: 'dry_run',
      readyForFinalOwnerSignoffEvidence: false,
      recordConfirmationRequired: true,
      signoff,
      warnings: [
        'Final owner signoff evidence is incomplete; no backend record call was attempted.',
        'This collector does not approve owners by itself, deploy, run tools, dispatch workers, process media, write Supabase directly, call Stripe, activate beta, or activate production.',
      ],
    }
  }

  if (!confirmRecordEvidence) {
    return {
      ok: true,
      mode: 'dry_run',
      readyForFinalOwnerSignoffEvidence: true,
      recordConfirmationRequired: true,
      signoff,
      warnings: [
        'Dry-run only: REEDITPRO_PRODUCTION_OWNER_SIGNOFF_CONFIRM_RECORD_EVIDENCE=true is required before reusing the backend production readiness evidence route.',
        'The all-up production readiness packet still requires Supabase, billing, wallet, Stripe, ops/observability, tools, and hard-safety evidence before recording can pass.',
      ],
    }
  }

  const record = await runProductionToolExecutionReadinessEvidenceCollectorFromEnv({
    ...env,
    REEDITPRO_PRODUCTION_READINESS_CONFIRM_RECORD_EVIDENCE: 'true',
    REEDITPRO_PRODUCTION_READINESS_CONFIRM_RECORD_BLOCKED_EVIDENCE: 'true',
  }, fetchImpl)
  if (!record.ok || (record.mode !== 'recorded' && record.mode !== 'blocked_recorded')) {
    throw new Error('Production final owner signoff evidence could not be recorded as a passing or blocked audit packet through the all-up production readiness evidence collector.')
  }

  return {
    ok: true,
    mode: record.mode,
    readyForFinalOwnerSignoffEvidence: true,
    recordConfirmationRequired: false,
    signoff,
    record,
    warnings: [
      ...record.warnings,
      record.mode === 'blocked_recorded'
        ? 'Final owner signoff evidence was recorded as a blocked audit packet while the all-up production readiness packet remains incomplete.'
        : 'Final owner signoff evidence was recorded as part of the authenticated all-up production readiness evidence packet.',
      'This collector did not approve owners by itself, deploy, run tools, dispatch workers, process media, write Supabase directly, call Stripe, activate beta, or activate production.',
    ],
  }
}

function buildSignoffStatus(input: {
  evidenceArtifactId?: string
  reviewedBy?: string
  reviewedAt?: string
  notes?: string[]
  approvals: Record<string, boolean>
}): ProductionFinalOwnerSignoffSliceStatus {
  const evidenceArtifactIdPresent = Boolean(input.evidenceArtifactId?.trim())
  const reviewedByPresent = Boolean(input.reviewedBy?.trim())
  const reviewedAtValid = Boolean(input.reviewedAt && isValidIsoDate(input.reviewedAt))
  const notesPresent = Boolean(input.notes?.length && input.notes.every((note) => note.trim().length > 0))
  const blockers = [
    evidenceArtifactIdPresent ? undefined : 'evidence artifact ID is missing.',
    reviewedByPresent ? undefined : 'reviewer reference is missing.',
    reviewedAtValid ? undefined : 'review timestamp is missing or invalid.',
    notesPresent ? undefined : 'evidence notes are missing.',
    ...Object.entries(input.approvals).map(([name, approved]) => approved ? undefined : `${name} is not approved.`),
  ].filter((item): item is string => Boolean(item))

  return {
    ready: blockers.length === 0,
    evidenceArtifactIdPresent,
    reviewedByPresent,
    reviewedAtValid,
    notesPresent,
    approvals: input.approvals,
    blockers,
  }
}

function isValidIsoDate(value: string): boolean {
  const time = Date.parse(value)
  return Number.isFinite(time) && new Date(time).toISOString() === value
}

function parseBoolean(value: string | undefined): boolean {
  return value === 'true' || value === '1'
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    const result = await runProductionFinalOwnerSignoffEvidenceCollectorFromEnv(process.env)
    console.log(JSON.stringify(result, null, 2))
    if (!result.ok) process.exitCode = 1
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  }
}
