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

export interface ProductionStripeBoundaryEvidenceCollectorEnv
  extends ProductionToolExecutionReadinessEvidenceCollectorEnv {
  REEDITPRO_PRODUCTION_STRIPE_BOUNDARY_CONFIRM_RECORD_EVIDENCE?: string
}

export interface ProductionStripeBoundaryEvidenceCollectorRunResult {
  ok: boolean
  mode: 'dry_run' | 'recorded'
  readyForStripeBoundaryEvidence: boolean
  recordConfirmationRequired: boolean
  stripeBoundary: ProductionStripeBoundarySliceStatus
  record?: Awaited<ReturnType<typeof runProductionToolExecutionReadinessEvidenceCollectorFromEnv>>
  warnings: string[]
}

export interface ProductionStripeBoundarySliceStatus {
  ready: boolean
  evidenceArtifactIdPresent: boolean
  reviewedByPresent: boolean
  reviewedAtValid: boolean
  notesPresent: boolean
  checks: Record<string, boolean>
  blockers: string[]
}

export async function runProductionStripeBoundaryEvidenceCollectorFromEnv(
  env: ProductionStripeBoundaryEvidenceCollectorEnv,
  fetchImpl: ProductionToolExecutionReadinessEvidenceCollectorFetch = fetch as ProductionToolExecutionReadinessEvidenceCollectorFetch,
): Promise<ProductionStripeBoundaryEvidenceCollectorRunResult> {
  const evidenceEnv = resolveProductionToolExecutionReadinessEvidenceEnv(env).env
  const input = buildProductionToolExecutionReadinessGateInput(evidenceEnv)
  const secretLikeInputPaths = collectSecretLikePaths({
    sourceId: evidenceEnv.REEDITPRO_PRODUCTION_READINESS_SOURCE_ID,
    sourceSha: evidenceEnv.REEDITPRO_PRODUCTION_READINESS_SOURCE_SHA,
    workspaceId: evidenceEnv.REEDITPRO_PRODUCTION_READINESS_WORKSPACE_ID,
    projectId: evidenceEnv.REEDITPRO_PRODUCTION_READINESS_PROJECT_ID,
    reviewedBy: evidenceEnv.REEDITPRO_PRODUCTION_EVIDENCE_REVIEWED_BY,
    reviewedAt: evidenceEnv.REEDITPRO_PRODUCTION_EVIDENCE_REVIEWED_AT,
    stripeArtifactId: evidenceEnv.REEDITPRO_PRODUCTION_STRIPE_EVIDENCE_ARTIFACT_ID,
    stripeNotes: evidenceEnv.REEDITPRO_PRODUCTION_STRIPE_BOUNDARY_NOTES,
    idempotencyKey: env.REEDITPRO_PRODUCTION_READINESS_IDEMPOTENCY_KEY,
  }, 'productionStripeBoundaryEvidenceCollector')
  if (secretLikeInputPaths.length > 0) {
    throw new Error(`Production Stripe boundary evidence collector inputs contain secret-like values: ${secretLikeInputPaths.join('; ')}`)
  }

  const stripeBoundary = buildSliceStatus({
    evidenceArtifactId: input.stripeBoundary?.evidenceArtifactId,
    reviewedBy: input.stripeBoundary?.reviewedBy,
    reviewedAt: input.stripeBoundary?.reviewedAt,
    notes: input.stripeBoundary?.notes,
    checks: {
      billingOwnerApproved: Boolean(input.stripeBoundary?.billingOwnerApproved),
      noStripeFromToolCostSurface: Boolean(input.stripeBoundary?.noStripeFromToolCostSurface),
      serviceFeeExcludedFromToolEvents: Boolean(input.stripeBoundary?.serviceFeeExcludedFromToolEvents),
      stripeWebhookSeparatedFromToolLedger: Boolean(input.stripeBoundary?.stripeWebhookSeparatedFromToolLedger),
    },
  })
  const confirmRecordEvidence = parseBoolean(env.REEDITPRO_PRODUCTION_STRIPE_BOUNDARY_CONFIRM_RECORD_EVIDENCE)

  if (!stripeBoundary.ready) {
    return {
      ok: false,
      mode: 'dry_run',
      readyForStripeBoundaryEvidence: false,
      recordConfirmationRequired: true,
      stripeBoundary,
      warnings: [
        'Production Stripe boundary evidence is incomplete; no backend record call was attempted.',
        'This collector does not import Stripe, call Stripe, mutate billing records, mutate wallets, write Supabase directly, run tools, process media, or activate beta/production.',
      ],
    }
  }

  if (!confirmRecordEvidence) {
    return {
      ok: true,
      mode: 'dry_run',
      readyForStripeBoundaryEvidence: true,
      recordConfirmationRequired: true,
      stripeBoundary,
      warnings: [
        'Dry-run only: REEDITPRO_PRODUCTION_STRIPE_BOUNDARY_CONFIRM_RECORD_EVIDENCE=true is required before reusing the backend production readiness evidence route.',
        'The all-up production readiness packet still requires Supabase, tool-cost ledger, wallet, ops/observability, tools, hard-safety, and final owner evidence before recording can pass.',
      ],
    }
  }

  const record = await runProductionToolExecutionReadinessEvidenceCollectorFromEnv({
    ...env,
    REEDITPRO_PRODUCTION_READINESS_CONFIRM_RECORD_EVIDENCE: 'true',
  }, fetchImpl)
  if (!record.ok || record.mode !== 'recorded') {
    throw new Error('Production Stripe boundary evidence could not be recorded because the all-up production readiness evidence collector did not record a passing packet.')
  }

  return {
    ok: true,
    mode: 'recorded',
    readyForStripeBoundaryEvidence: true,
    recordConfirmationRequired: false,
    stripeBoundary,
    record,
    warnings: [
      ...record.warnings,
      'Stripe boundary evidence was recorded only as part of the authenticated all-up production readiness evidence packet.',
      'This collector did not import Stripe, call Stripe, mutate billing records, mutate wallets, write Supabase directly, run tools, process media, or activate beta/production.',
    ],
  }
}

function buildSliceStatus(input: {
  evidenceArtifactId?: string
  reviewedBy?: string
  reviewedAt?: string
  notes?: string[]
  checks: Record<string, boolean>
}): ProductionStripeBoundarySliceStatus {
  const evidenceArtifactIdPresent = Boolean(input.evidenceArtifactId?.trim())
  const reviewedByPresent = Boolean(input.reviewedBy?.trim())
  const reviewedAtValid = Boolean(input.reviewedAt && isValidIsoDate(input.reviewedAt))
  const notesPresent = Boolean(input.notes?.length && input.notes.every((note) => note.trim().length > 0))
  const blockers = [
    evidenceArtifactIdPresent ? undefined : 'evidence artifact ID is missing.',
    reviewedByPresent ? undefined : 'reviewer reference is missing.',
    reviewedAtValid ? undefined : 'review timestamp is missing or invalid.',
    notesPresent ? undefined : 'evidence notes are missing.',
    ...Object.entries(input.checks).map(([name, ok]) => ok ? undefined : `${name} is not verified.`),
  ].filter((item): item is string => Boolean(item))

  return {
    ready: blockers.length === 0,
    evidenceArtifactIdPresent,
    reviewedByPresent,
    reviewedAtValid,
    notesPresent,
    checks: input.checks,
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
    const result = await runProductionStripeBoundaryEvidenceCollectorFromEnv(process.env)
    console.log(JSON.stringify(result, null, 2))
    if (!result.ok) process.exitCode = 1
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  }
}
