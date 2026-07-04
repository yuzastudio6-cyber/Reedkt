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

export interface ProductionWalletLifecycleEvidenceCollectorEnv
  extends ProductionToolExecutionReadinessEvidenceCollectorEnv {
  REEDITPRO_PRODUCTION_WALLET_LIFECYCLE_CONFIRM_RECORD_EVIDENCE?: string
}

export interface ProductionWalletLifecycleEvidenceCollectorRunResult {
  ok: boolean
  mode: 'dry_run' | 'recorded' | 'blocked_recorded'
  readyForWalletLifecycleEvidence: boolean
  recordConfirmationRequired: boolean
  walletLifecycle: ProductionWalletLifecycleSliceStatus
  record?: Awaited<ReturnType<typeof runProductionToolExecutionReadinessEvidenceCollectorFromEnv>>
  warnings: string[]
}

export interface ProductionWalletLifecycleSliceStatus {
  ready: boolean
  evidenceArtifactIdPresent: boolean
  reviewedByPresent: boolean
  reviewedAtValid: boolean
  notesPresent: boolean
  checks: Record<string, boolean>
  blockers: string[]
}

export async function runProductionWalletLifecycleEvidenceCollectorFromEnv(
  env: ProductionWalletLifecycleEvidenceCollectorEnv,
  fetchImpl: ProductionToolExecutionReadinessEvidenceCollectorFetch = fetch as ProductionToolExecutionReadinessEvidenceCollectorFetch,
): Promise<ProductionWalletLifecycleEvidenceCollectorRunResult> {
  const evidenceEnv = resolveProductionToolExecutionReadinessEvidenceEnv(env).env
  const input = buildProductionToolExecutionReadinessGateInput(evidenceEnv)
  const secretLikeInputPaths = collectSecretLikePaths({
    sourceId: evidenceEnv.REEDITPRO_PRODUCTION_READINESS_SOURCE_ID,
    sourceSha: evidenceEnv.REEDITPRO_PRODUCTION_READINESS_SOURCE_SHA,
    workspaceId: evidenceEnv.REEDITPRO_PRODUCTION_READINESS_WORKSPACE_ID,
    projectId: evidenceEnv.REEDITPRO_PRODUCTION_READINESS_PROJECT_ID,
    reviewedBy: evidenceEnv.REEDITPRO_PRODUCTION_EVIDENCE_REVIEWED_BY,
    reviewedAt: evidenceEnv.REEDITPRO_PRODUCTION_EVIDENCE_REVIEWED_AT,
    walletArtifactId: evidenceEnv.REEDITPRO_PRODUCTION_WALLET_EVIDENCE_ARTIFACT_ID,
    walletNotes: evidenceEnv.REEDITPRO_PRODUCTION_WALLET_NOTES,
    idempotencyKey: env.REEDITPRO_PRODUCTION_READINESS_IDEMPOTENCY_KEY,
  }, 'productionWalletLifecycleEvidenceCollector')
  if (secretLikeInputPaths.length > 0) {
    throw new Error(`Production wallet lifecycle evidence collector inputs contain secret-like values: ${secretLikeInputPaths.join('; ')}`)
  }

  const walletLifecycle = buildSliceStatus({
    evidenceArtifactId: input.walletSettlement?.evidenceArtifactId,
    reviewedBy: input.walletSettlement?.reviewedBy,
    reviewedAt: input.walletSettlement?.reviewedAt,
    notes: input.walletSettlement?.notes,
    checks: {
      reservationVerified: Boolean(input.walletSettlement?.reservationVerified),
      spendVerified: Boolean(input.walletSettlement?.spendVerified),
      releaseVerified: Boolean(input.walletSettlement?.releaseVerified),
      refundVerified: Boolean(input.walletSettlement?.refundVerified),
      walletBalanceBeforeAfterReadbackVerified: Boolean(input.walletSettlement?.walletBalanceBeforeAfterReadbackVerified),
      settlementRpcVerified: Boolean(input.walletSettlement?.settlementRpcVerified),
      settlementRpcServiceRoleOnlyVerified: Boolean(input.walletSettlement?.settlementRpcServiceRoleOnlyVerified),
      idempotentSettlementReplayVerified: Boolean(input.walletSettlement?.idempotentSettlementReplayVerified),
      noSilentChargeVerified: Boolean(input.walletSettlement?.noSilentChargeVerified),
    },
  })
  const confirmRecordEvidence = parseBoolean(env.REEDITPRO_PRODUCTION_WALLET_LIFECYCLE_CONFIRM_RECORD_EVIDENCE)

  if (!walletLifecycle.ready) {
    return {
      ok: false,
      mode: 'dry_run',
      readyForWalletLifecycleEvidence: false,
      recordConfirmationRequired: true,
      walletLifecycle,
      warnings: [
        'Production wallet lifecycle evidence is incomplete; no backend record call was attempted.',
        'This collector does not mutate wallets, write ledgers, connect to Supabase directly, call Stripe, run tools, process media, or activate beta/production.',
      ],
    }
  }

  if (!confirmRecordEvidence) {
    return {
      ok: true,
      mode: 'dry_run',
      readyForWalletLifecycleEvidence: true,
      recordConfirmationRequired: true,
      walletLifecycle,
      warnings: [
        'Dry-run only: REEDITPRO_PRODUCTION_WALLET_LIFECYCLE_CONFIRM_RECORD_EVIDENCE=true is required before reusing the backend production readiness evidence route.',
        'The all-up production readiness packet still requires Supabase, tool-cost ledger, Stripe, ops/observability, tools, hard-safety, and final owner evidence before recording can pass.',
      ],
    }
  }

  const record = await runProductionToolExecutionReadinessEvidenceCollectorFromEnv({
    ...env,
    REEDITPRO_PRODUCTION_READINESS_CONFIRM_RECORD_EVIDENCE: 'true',
    REEDITPRO_PRODUCTION_READINESS_CONFIRM_RECORD_BLOCKED_EVIDENCE: 'true',
  }, fetchImpl)
  if (!record.ok || (record.mode !== 'recorded' && record.mode !== 'blocked_recorded')) {
    throw new Error('Production wallet lifecycle evidence could not be recorded as a passing or blocked audit packet through the all-up production readiness evidence collector.')
  }

  return {
    ok: true,
    mode: record.mode,
    readyForWalletLifecycleEvidence: true,
    recordConfirmationRequired: false,
    walletLifecycle,
    record,
    warnings: [
      ...record.warnings,
      record.mode === 'blocked_recorded'
        ? 'Wallet lifecycle evidence was recorded as a blocked audit packet while the all-up production readiness packet remains incomplete.'
        : 'Wallet lifecycle evidence was recorded as part of the authenticated all-up production readiness evidence packet.',
      'This collector did not mutate wallets, write ledgers directly, connect to Supabase directly, call Stripe, run tools, process media, or activate beta/production.',
    ],
  }
}

function buildSliceStatus(input: {
  evidenceArtifactId?: string
  reviewedBy?: string
  reviewedAt?: string
  notes?: string[]
  checks: Record<string, boolean>
}): ProductionWalletLifecycleSliceStatus {
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
    const result = await runProductionWalletLifecycleEvidenceCollectorFromEnv(process.env)
    console.log(JSON.stringify(result, null, 2))
    if (!result.ok) process.exitCode = 1
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  }
}
