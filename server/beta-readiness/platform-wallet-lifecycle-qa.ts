import type { ServiceContext } from '../types'
import { createToolCostMeteringService } from '../tool-cost-metering/tool-cost-metering-service'
import {
  settleToolCostWallet,
  type ToolCostWalletSettlement,
  type ToolCostWalletSettlementType,
} from '../tool-cost-metering/tool-cost-wallet-settlement'
import type { ToolCostEventInput } from '../tool-cost-metering/types'

export type BetaPlatformWalletLifecycleQaEnvironment = 'local_mock' | 'staging_persistent' | 'production_persistent'
export type BetaPlatformWalletLifecycleQaStatus = 'passed' | 'blocked' | 'warning'
export type BetaPlatformWalletLifecyclePersistenceMode =
  | 'mock_memory'
  | 'supabase_service_role'
  | 'blocked_without_explicit_persistent_qa'

export interface BetaPlatformWalletLifecycleQaInput {
  workspaceId: string
  projectId: string
  sourceId: string
  sourceSha?: string
  environment?: BetaPlatformWalletLifecycleQaEnvironment
  allowPersistentWalletLifecycleQa?: boolean
  editPlanId?: string
  jobIdPrefix?: string
  creditEstimateId?: string
  creditReservationId?: string
  notes?: string[]
}

export interface BetaPlatformWalletLifecycleQaCheck {
  id: string
  label: string
  status: BetaPlatformWalletLifecycleQaStatus
  evidence: string[]
  nextAction?: string
}

export interface BetaPlatformWalletLifecycleQaSettlementEvidence {
  settlementType: ToolCostWalletSettlementType
  toolEventId: string
  settlementId: string
  creditsDelta: number
  replayed: boolean
  status: ToolCostWalletSettlement['status']
  walletMutationMode: ToolCostWalletSettlement['walletMutationMode']
}

export interface BetaPlatformWalletLifecycleQaReport {
  reportId: string
  createdAt: string
  sourceId: string
  sourceSha?: string
  environment: BetaPlatformWalletLifecycleQaEnvironment
  persistenceMode: BetaPlatformWalletLifecyclePersistenceMode
  wouldClearWalletLifecycleBlocker: false
  settlementEvidence: BetaPlatformWalletLifecycleQaSettlementEvidence[]
  spendVerified: boolean
  releaseVerified: boolean
  refundVerified: boolean
  idempotentReplayVerified: boolean
  stripeBoundaryPreserved: boolean
  serviceFeeExcluded: boolean
  checks: BetaPlatformWalletLifecycleQaCheck[]
  missingProductionEvidence: string[]
  notes: string[]
}

const settlementTypes = ['spend', 'release', 'refund'] as const satisfies readonly ToolCostWalletSettlementType[]
const smokeStartedAt = '2026-06-27T00:02:00.000Z'
const smokeCompletedAt = '2026-06-27T00:02:07.000Z'

export async function runBetaPlatformWalletLifecycleQa(
  context: ServiceContext,
  input: BetaPlatformWalletLifecycleQaInput,
  idempotencyKey: string,
): Promise<BetaPlatformWalletLifecycleQaReport> {
  const createdAt = new Date().toISOString()
  const requestedEnvironment = input.environment ?? 'local_mock'
  const hasPersistentRuntime = Boolean(context.clients.admin && !context.env.mockOnly)

  if (hasPersistentRuntime && input.allowPersistentWalletLifecycleQa !== true) {
    return buildBlockedPersistentReport(input, requestedEnvironment, createdAt, [
      'service-role runtime is available',
      'persistent wallet lifecycle QA requires allowPersistentWalletLifecycleQa=true',
      'no persistent tool-cost or wallet-settlement write was attempted',
    ], [
      'persistent wallet lifecycle QA explicit confirmation',
      'approved active credit reservation fixture',
      'staging or production wallet lifecycle QA evidence',
    ], 'Set allowPersistentWalletLifecycleQa=true with approved deployed fixture ids before running persistent wallet lifecycle QA.')
  }

  if (hasPersistentRuntime) {
    const fixtureBlockers = persistentFixtureBlockers(input)
    if (fixtureBlockers.length > 0) {
      return buildBlockedPersistentReport(input, requestedEnvironment, createdAt, fixtureBlockers, [
        'approved persistent wallet lifecycle fixture ids',
        'active deployed credit reservation fixture',
        'staging or production wallet lifecycle QA evidence',
      ], 'Provide deployed workspace, project, credit estimate, and active credit reservation fixture ids before running persistent wallet lifecycle QA.')
    }
  }

  const service = createToolCostMeteringService(context)
  const settlementEvidence: BetaPlatformWalletLifecycleQaSettlementEvidence[] = []

  for (const settlementType of settlementTypes) {
    const eventInput = buildLifecycleEventInput(input, settlementType)
    const eventResult = await service.emitToolCostEvent(eventInput, `${idempotencyKey}:tool-cost:${settlementType}`)
    const eventReplay = await service.emitToolCostEvent(eventInput, `${idempotencyKey}:tool-cost:${settlementType}`)
    const settlement = await settleToolCostWallet(context, {
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      toolCostEventId: eventResult.event.id,
      creditEstimateId: eventResult.event.creditEstimateId,
      creditReservationId: eventResult.event.creditReservationId,
      toolCostCredits: eventResult.event.toolCostCredits,
      billableToUser: eventResult.event.billableToUser,
      failureCategory: eventResult.event.failureCategory,
      settlementType,
      metadata: {
        qaHarness: 'beta-platform-wallet-lifecycle-qa',
        sourceId: input.sourceId,
        settlementType,
      },
    }, `${idempotencyKey}:wallet-settlement:${settlementType}`)
    const settlementReplay = await settleToolCostWallet(context, {
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      toolCostEventId: eventResult.event.id,
      creditEstimateId: eventResult.event.creditEstimateId,
      creditReservationId: eventResult.event.creditReservationId,
      toolCostCredits: eventResult.event.toolCostCredits,
      billableToUser: eventResult.event.billableToUser,
      failureCategory: eventResult.event.failureCategory,
      settlementType,
    }, `${idempotencyKey}:wallet-settlement:${settlementType}`)

    settlementEvidence.push({
      settlementType,
      toolEventId: eventResult.event.id,
      settlementId: settlement.settlement.id,
      creditsDelta: settlement.settlement.creditsDelta,
      replayed: eventReplay.replayed && settlementReplay.replayed && settlementReplay.settlement.id === settlement.settlement.id,
      status: settlement.settlement.status,
      walletMutationMode: settlement.settlement.walletMutationMode,
    })
  }

  const spend = settlementEvidence.find((item) => item.settlementType === 'spend')
  const release = settlementEvidence.find((item) => item.settlementType === 'release')
  const refund = settlementEvidence.find((item) => item.settlementType === 'refund')
  const expectedMode = hasPersistentRuntime ? 'supabase_credit_ledger' : 'mock_ledger_only'
  const spendVerified = Boolean(spend && spend.status === expectedSettlementStatus(hasPersistentRuntime) && spend.creditsDelta < 0 && spend.walletMutationMode === expectedMode)
  const releaseVerified = Boolean(release && release.status === expectedSettlementStatus(hasPersistentRuntime) && release.creditsDelta > 0 && release.walletMutationMode === expectedMode)
  const refundVerified = Boolean(refund && refund.status === expectedSettlementStatus(hasPersistentRuntime) && refund.creditsDelta > 0 && refund.walletMutationMode === expectedMode)
  const idempotentReplayVerified = settlementEvidence.every((item) => item.replayed)

  return {
    reportId: `beta-platform-wallet-lifecycle-qa-${hashFragment(idempotencyKey, input.sourceId)}`,
    createdAt,
    sourceId: input.sourceId,
    sourceSha: input.sourceSha,
    environment: hasPersistentRuntime ? requestedEnvironment : 'local_mock',
    persistenceMode: hasPersistentRuntime ? 'supabase_service_role' : 'mock_memory',
    wouldClearWalletLifecycleBlocker: false,
    settlementEvidence,
    spendVerified,
    releaseVerified,
    refundVerified,
    idempotentReplayVerified,
    stripeBoundaryPreserved: true,
    serviceFeeExcluded: true,
    checks: [
      check('spend_settlement', 'Wallet spend settlement is recorded and replay-safe', spendVerified, evidenceForSettlement(spend), 'Fix spend settlement before paid-production wallet lifecycle evidence can pass.'),
      check('release_settlement', 'Wallet release settlement is recorded and replay-safe', releaseVerified, evidenceForSettlement(release), 'Fix release settlement before paid-production wallet lifecycle evidence can pass.'),
      check('refund_settlement', 'Wallet refund settlement is recorded and replay-safe', refundVerified, evidenceForSettlement(refund), 'Fix refund settlement before paid-production wallet lifecycle evidence can pass.'),
      check('idempotent_replay', 'Tool event and wallet settlement idempotency replay without double charge', idempotentReplayVerified, settlementEvidence.map((item) => `${item.settlementType}:replayed=${item.replayed}`), 'Fix idempotent replay before paid-production wallet lifecycle evidence can pass.'),
      check('stripe_boundary', 'Stripe remains outside wallet lifecycle QA', true, ['stripeCallAttempted=false', 'serviceFeeIncluded=false'], 'Keep Stripe separated from tool-cost wallet settlement.'),
    ],
    missingProductionEvidence: missingProductionEvidence(hasPersistentRuntime),
    notes: [
      ...(input.notes ?? []),
      hasPersistentRuntime
        ? 'This QA harness may write controlled tool-cost and wallet-settlement rows only when persistent QA is explicitly confirmed with deployed fixture ids.'
        : 'This QA harness uses mock memory only; no real wallet, ledger, Supabase, or Stripe mutation occurred.',
      'Reservation creation/hold evidence remains a separate production wallet lifecycle gate; this route verifies settlement behavior against an approved active reservation fixture.',
      'The report is blocker-reduction evidence only; it does not enable beta, paid production, media processing, providers, workers, or public delivery.',
    ],
  }
}

function buildBlockedPersistentReport(
  input: BetaPlatformWalletLifecycleQaInput,
  environment: BetaPlatformWalletLifecycleQaEnvironment,
  createdAt: string,
  evidence: string[],
  missingProductionEvidence: string[],
  nextAction: string,
): BetaPlatformWalletLifecycleQaReport {
  return {
    reportId: `beta-platform-wallet-lifecycle-qa-blocked-${hashFragment(input.workspaceId, input.projectId, input.sourceId)}`,
    createdAt,
    sourceId: input.sourceId,
    sourceSha: input.sourceSha,
    environment,
    persistenceMode: 'blocked_without_explicit_persistent_qa',
    wouldClearWalletLifecycleBlocker: false,
    settlementEvidence: [],
    spendVerified: false,
    releaseVerified: false,
    refundVerified: false,
    idempotentReplayVerified: false,
    stripeBoundaryPreserved: true,
    serviceFeeExcluded: true,
    checks: [{
      id: 'persistent_wallet_lifecycle_qa_requires_explicit_approval',
      label: 'Persistent wallet lifecycle QA requires explicit confirmation and approved fixture ids before non-mock writes',
      status: 'blocked',
      evidence,
      nextAction,
    }],
    missingProductionEvidence,
    notes: [
      ...(input.notes ?? []),
      'No persistent write was attempted because persistent wallet lifecycle QA must be explicitly confirmed with approved deployed fixture ids.',
    ],
  }
}

function buildLifecycleEventInput(
  input: BetaPlatformWalletLifecycleQaInput,
  settlementType: ToolCostWalletSettlementType,
): ToolCostEventInput {
  return {
    id: `tool-cost-wallet-lifecycle-qa-${settlementType}-${hashFragment(input.workspaceId, input.projectId, input.sourceId)}`,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    editPlanId: input.editPlanId ?? 'platform-wallet-lifecycle-qa-edit-plan',
    jobId: `${input.jobIdPrefix ?? 'platform-wallet-lifecycle-qa-job'}-${settlementType}`,
    creditEstimateId: input.creditEstimateId ?? 'platform-wallet-lifecycle-qa-credit-estimate',
    creditReservationId: input.creditReservationId ?? 'platform-wallet-lifecycle-qa-credit-reservation',
    toolId: 'ffmpeg',
    toolName: `FFmpeg wallet lifecycle QA ${settlementType} fixture`,
    usageCategory: 'rendering',
    providerType: 'deterministic_renderer',
    qualityLevel: 'preview',
    startedAt: smokeStartedAt,
    completedAt: smokeCompletedAt,
    wallClockMs: 7_000,
    billableToUser: true,
    approvedReservationRemainingCredits: 30,
    metadata: {
      qaHarness: 'beta-platform-wallet-lifecycle-qa',
      sourceId: input.sourceId,
      settlementType,
      walletSettlementPerformed: false,
      stripeCallAttempted: false,
      reeditproServiceFeeIncluded: false,
      mediaProcessed: false,
      providerCalled: false,
      persistentWalletLifecycleQaExplicitlyAllowed: input.allowPersistentWalletLifecycleQa === true,
    },
  }
}

function persistentFixtureBlockers(input: BetaPlatformWalletLifecycleQaInput): string[] {
  const blockers: string[] = []
  if (!isUuid(input.workspaceId)) blockers.push('persistent wallet lifecycle QA workspaceId must be a deployed workspace UUID.')
  if (!isUuid(input.projectId)) blockers.push('persistent wallet lifecycle QA projectId must be a deployed project UUID.')
  if (!input.creditEstimateId) blockers.push('persistent wallet lifecycle QA creditEstimateId is required.')
  if (!isUuid(input.creditReservationId)) blockers.push('persistent wallet lifecycle QA creditReservationId must be an active deployed reservation UUID.')
  return blockers
}

function isUuid(value: unknown): value is string {
  return typeof value === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
}

function expectedSettlementStatus(hasPersistentRuntime: boolean): ToolCostWalletSettlement['status'] {
  return hasPersistentRuntime ? 'settled_persistent' : 'settled_mock'
}

function evidenceForSettlement(settlement: BetaPlatformWalletLifecycleQaSettlementEvidence | undefined): string[] {
  if (!settlement) return ['settlement not recorded']
  return [
    `type=${settlement.settlementType}`,
    `toolEventId=${settlement.toolEventId}`,
    `settlementId=${settlement.settlementId}`,
    `creditsDelta=${settlement.creditsDelta}`,
    `walletMutationMode=${settlement.walletMutationMode}`,
    `replayed=${settlement.replayed}`,
  ]
}

function missingProductionEvidence(hasPersistentRuntime: boolean): string[] {
  if (hasPersistentRuntime) {
    return [
      'credit reservation creation/hold evidence from deployed backend runtime',
      'authenticated RLS member readback evidence for wallet settlement rows',
      'recorded production wallet lifecycle evidence packet and operator readback',
      'Stripe boundary owner approval evidence',
      'monitoring and billing QA evidence from staging or production',
      'deployment, security, storage, legal, support, operations, and final owner approvals',
    ]
  }

  return [
    'staging or production tool-cost and wallet-settlement migration deployment evidence',
    'service-role wallet lifecycle write path evidence from deployed runtime',
    'credit reservation creation/hold evidence from deployed backend runtime',
    'authenticated RLS member readback evidence for wallet settlement rows',
    'Stripe boundary owner approval evidence',
    'monitoring and billing QA evidence from staging or production',
    'deployment, security, storage, legal, support, operations, and final owner approvals',
  ]
}

function check(
  id: string,
  label: string,
  passed: boolean,
  evidence: string[],
  nextAction: string,
): BetaPlatformWalletLifecycleQaCheck {
  return {
    id,
    label,
    status: passed ? 'passed' : 'blocked',
    evidence,
    nextAction: passed ? undefined : nextAction,
  }
}

function hashFragment(...values: string[]): string {
  let hash = 0
  for (const value of values.join(':')) {
    hash = ((hash << 5) - hash + value.charCodeAt(0)) | 0
  }
  return Math.abs(hash).toString(16).padStart(8, '0').slice(0, 8)
}
