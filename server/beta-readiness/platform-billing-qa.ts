import type { ServiceContext } from '../types'
import { createToolCostMeteringService } from '../tool-cost-metering/tool-cost-metering-service'
import { settleToolCostWallet } from '../tool-cost-metering/tool-cost-wallet-settlement'
import type { ToolCostEventInput } from '../tool-cost-metering/types'

export type BetaPlatformBillingQaEnvironment = 'local_mock' | 'staging_persistent' | 'production_persistent'
export type BetaPlatformBillingQaStatus = 'passed' | 'blocked' | 'warning'

export interface BetaPlatformBillingQaInput {
  workspaceId: string
  projectId: string
  sourceId: string
  sourceSha?: string
  environment?: BetaPlatformBillingQaEnvironment
  allowPersistentStoreQa?: boolean
  editPlanId?: string
  jobId?: string
  creditEstimateId?: string
  creditReservationId?: string
  notes?: string[]
}

export interface BetaPlatformBillingQaCheck {
  id: string
  label: string
  status: BetaPlatformBillingQaStatus
  evidence: string[]
  nextAction?: string
}

export interface BetaPlatformBillingQaReport {
  reportId: string
  createdAt: string
  sourceId: string
  sourceSha?: string
  environment: BetaPlatformBillingQaEnvironment
  persistenceMode: 'mock_memory' | 'supabase_service_role' | 'blocked_without_explicit_persistent_qa'
  wouldClearPlatformBlocker: false
  toolEventId: string | null
  toolEventCredits: number
  walletSettlementId: string | null
  walletSettlementCreditsDelta: number
  walletMutationMode: 'mock_ledger_only' | 'supabase_credit_ledger' | 'not_attempted'
  billableEventCount: number
  summaryCredits: number
  checks: BetaPlatformBillingQaCheck[]
  missingPlatformEvidence: string[]
  notes: string[]
}

const smokeStartedAt = '2026-06-27T00:00:00.000Z'
const smokeCompletedAt = '2026-06-27T00:00:08.000Z'

export async function runBetaPlatformBillingQa(
  context: ServiceContext,
  input: BetaPlatformBillingQaInput,
  idempotencyKey: string,
): Promise<BetaPlatformBillingQaReport> {
  const createdAt = new Date().toISOString()
  const requestedEnvironment = input.environment ?? 'local_mock'
  const hasPersistentRuntime = Boolean(context.clients.admin && !context.env.mockOnly)

  if (hasPersistentRuntime && input.allowPersistentStoreQa !== true) {
    return buildBlockedPersistentReport(input, requestedEnvironment, createdAt, [
      'service-role runtime is available',
      'persistent platform billing QA requires allowPersistentStoreQa=true',
      'no persistent write was attempted',
    ], [
      'persistent billing QA explicit confirmation',
      'staging or production billing QA evidence',
    ], 'Set allowPersistentStoreQa=true with approved staging/production fixture ids before running persistent billing QA.')
  }

  if (hasPersistentRuntime) {
    const fixtureBlockers = persistentFixtureBlockers(input)
    if (fixtureBlockers.length > 0) {
      return buildBlockedPersistentReport(input, requestedEnvironment, createdAt, fixtureBlockers, [
        'approved persistent billing QA fixture ids',
        'staging or production billing QA evidence',
      ], 'Provide deployed workspace, project, credit estimate, and active credit reservation fixture ids before running persistent billing QA.')
    }
  }

  const service = createToolCostMeteringService(context)
  const eventInput = buildQaEventInput(input)
  const first = await service.emitToolCostEvent(eventInput, `${idempotencyKey}:tool-cost-event`)
  const replay = await service.emitToolCostEvent(eventInput, `${idempotencyKey}:tool-cost-event`)
  const settlement = await settleToolCostWallet(context, {
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    toolCostEventId: first.event.id,
    creditEstimateId: first.event.creditEstimateId,
    creditReservationId: first.event.creditReservationId,
    toolCostCredits: first.event.toolCostCredits,
    billableToUser: first.event.billableToUser,
    failureCategory: first.event.failureCategory,
    settlementType: 'spend',
    metadata: {
      qaHarness: 'beta-platform-billing-qa',
      sourceId: input.sourceId,
    },
  }, `${idempotencyKey}:wallet-settlement`)
  const settlementReplay = await settleToolCostWallet(context, {
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    toolCostEventId: first.event.id,
    creditEstimateId: first.event.creditEstimateId,
    creditReservationId: first.event.creditReservationId,
    toolCostCredits: first.event.toolCostCredits,
    billableToUser: first.event.billableToUser,
    failureCategory: first.event.failureCategory,
    settlementType: 'spend',
  }, `${idempotencyKey}:wallet-settlement`)
  const summary = await service.getToolCostSummary({
    workspaceId: input.workspaceId,
    projectId: input.projectId,
  })

  const replayMatched = replay.replayed && replay.event.id === first.event.id
  const summaryEvent = summary.summary.events.find((event) => event.id === first.event.id)
  const summaryHasSingleQaEvent = summary.summary.events.filter((event) => event.id === first.event.id).length === 1
  const serviceFeeExcluded = first.event.metadata.reeditproServiceFeeIncluded === false

  return {
    reportId: `beta-platform-billing-qa-${hashFragment(idempotencyKey, first.event.id)}`,
    createdAt,
    sourceId: input.sourceId,
    sourceSha: input.sourceSha,
    environment: hasPersistentRuntime ? requestedEnvironment : 'local_mock',
    persistenceMode: hasPersistentRuntime ? 'supabase_service_role' : 'mock_memory',
    wouldClearPlatformBlocker: false,
    toolEventId: first.event.id,
    toolEventCredits: first.event.toolCostCredits,
    walletSettlementId: settlement.settlement.id,
    walletSettlementCreditsDelta: settlement.settlement.creditsDelta,
    walletMutationMode: settlement.settlement.walletMutationMode,
    billableEventCount: summary.summary.billableEventCount,
    summaryCredits: summary.summary.actualToolCostCredits,
    checks: [
      check(
        'tool_cost_event_write',
        'Tool cost event write path accepts an approved estimate and reservation context',
        first.event.billableToUser && Boolean(first.event.creditEstimateId && first.event.creditReservationId),
        [
          `eventId=${first.event.id}`,
          `credits=${first.event.toolCostCredits}`,
          `persistenceMode=${hasPersistentRuntime ? 'supabase_service_role' : 'mock_memory'}`,
        ],
        hasPersistentRuntime
          ? 'Attach this deployed service-role write evidence to the platform billing QA packet.'
          : 'Deploy and run this QA against staging with service-role persistence before platform evidence can clear.',
      ),
      check(
        'idempotent_replay',
        'Duplicate idempotency key replays the original event without double recording',
        replayMatched && summaryHasSingleQaEvent,
        [
          `replayed=${replay.replayed}`,
          `originalEventId=${first.event.id}`,
          `replayEventId=${replay.event.id}`,
        ],
        'Fix idempotent replay before any billable external beta.',
      ),
      check(
        'summary_readback',
        'Project tool-cost summary reads back the recorded event',
        Boolean(summaryEvent) && summary.summary.actualToolCostCredits >= first.event.toolCostCredits,
        [
          `summaryEventCount=${summary.summary.events.length}`,
          `summaryCredits=${summary.summary.actualToolCostCredits}`,
        ],
        hasPersistentRuntime
          ? 'Attach deployed service-role summary readback plus separate authenticated RLS member readback evidence.'
          : 'Verify authenticated RLS member readback in staging before platform evidence can clear.',
      ),
      check(
        'wallet_settlement_boundary',
        'Wallet settlement is not silently performed by tool event recording',
        first.event.billableToUser && first.event.metadata.walletSettlementPerformed === false,
        [
          'tool cost event is billable metadata only',
          'wallet settlement remains a separate transactional backend step',
        ],
        hasPersistentRuntime
          ? 'Keep wallet settlement as an explicit backend RPC step and separately verify release/refund lifecycle cases before paid production.'
          : 'Implement and verify wallet spend/release/refund settlement before platform evidence can clear.',
      ),
      check(
        'explicit_wallet_settlement',
        hasPersistentRuntime
          ? 'Explicit wallet settlement records an idempotent persistent ledger effect through the service-role RPC'
          : 'Explicit wallet settlement skeleton records an idempotent mock ledger effect',
        settlement.settlement.status === (hasPersistentRuntime ? 'settled_persistent' : 'settled_mock') &&
          settlement.settlement.creditsDelta === -first.event.toolCostCredits &&
          settlementReplay.replayed &&
          settlementReplay.settlement.id === settlement.settlement.id,
        [
          `settlementId=${settlement.settlement.id}`,
          `creditsDelta=${settlement.settlement.creditsDelta}`,
          `replayed=${settlementReplay.replayed}`,
          `walletMutationMode=${settlement.settlement.walletMutationMode}`,
        ],
        hasPersistentRuntime
          ? 'Attach deployed service-role settlement evidence and separately verify release/refund lifecycle cases before paid production.'
          : 'Replace mock settlement with a transactional Supabase wallet settlement RPC before platform evidence can clear.',
      ),
      check(
        'stripe_boundary',
        'Stripe is isolated from tool event recording',
        first.event.metadata.stripeCallAttempted === false,
        [
          'no Stripe checkout, webhook, invoice, or charge path is called by this QA harness',
          'tool costs exclude ReEditPro service/edit fees',
        ],
        'Add billing owner approval proving Stripe remains backend-only and separated from tool event recording.',
      ),
      check(
        'service_fee_excluded',
        'ReEditPro service fee is excluded from tool cost events',
        serviceFeeExcluded,
        ['event metadata confirms service fee exclusion'],
        'Keep service/edit fees outside tool owner cost events.',
      ),
    ],
    missingPlatformEvidence: missingPlatformEvidence(hasPersistentRuntime),
    notes: [
      ...(input.notes ?? []),
      hasPersistentRuntime
        ? 'This QA harness does not process media, call providers, call Stripe, enable beta, or mark production ready; it may write controlled tool-cost and wallet-settlement rows only when persistent QA is explicitly confirmed.'
        : 'This QA harness does not process media, call providers, call Stripe, settle real wallets, enable beta, or mark production ready.',
      'The report is blocker-reduction evidence only; ToolBetaPlatformReadinessEvidence still requires staging or production proof.',
    ],
  }
}

function buildBlockedPersistentReport(
  input: BetaPlatformBillingQaInput,
  environment: BetaPlatformBillingQaEnvironment,
  createdAt: string,
  evidence: string[],
  missingPlatformEvidence: string[],
  nextAction: string,
): BetaPlatformBillingQaReport {
  return {
    reportId: `beta-platform-billing-qa-blocked-${hashFragment(input.workspaceId, input.projectId)}`,
    createdAt,
    sourceId: input.sourceId,
    sourceSha: input.sourceSha,
    environment,
    persistenceMode: 'blocked_without_explicit_persistent_qa',
    wouldClearPlatformBlocker: false,
    toolEventId: null,
    toolEventCredits: 0,
    walletSettlementId: null,
    walletSettlementCreditsDelta: 0,
    walletMutationMode: 'not_attempted',
    billableEventCount: 0,
    summaryCredits: 0,
    checks: [
      {
        id: 'persistent_store_qa_requires_explicit_approval',
        label: 'Persistent platform billing QA requires explicit confirmation and approved fixture ids before non-mock writes',
        status: 'blocked',
        evidence,
        nextAction,
      },
    ],
    missingPlatformEvidence,
    notes: [
      ...(input.notes ?? []),
      'No persistent write was attempted because persistent platform billing QA must be explicitly confirmed with approved fixture ids.',
    ],
  }
}

function buildQaEventInput(input: BetaPlatformBillingQaInput): ToolCostEventInput {
  return {
    id: `tool-cost-platform-qa-${hashFragment(input.workspaceId, input.projectId, input.sourceId)}`,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    editPlanId: input.editPlanId ?? 'platform-billing-qa-edit-plan',
    jobId: input.jobId ?? 'platform-billing-qa-job',
    creditEstimateId: input.creditEstimateId ?? 'platform-billing-qa-credit-estimate',
    creditReservationId: input.creditReservationId ?? 'platform-billing-qa-credit-reservation',
    toolId: 'ffmpeg',
    toolName: 'FFmpeg platform billing QA fixture',
    usageCategory: 'rendering',
    providerType: 'deterministic_renderer',
    qualityLevel: 'preview',
    startedAt: smokeStartedAt,
    completedAt: smokeCompletedAt,
    wallClockMs: 8_000,
    billableMs: 8_000,
    vcpuCount: 2,
    memoryGiB: 4,
    renderDurationSeconds: 4,
    outputResolution: '1920x1080',
    outputFrameRate: 30,
    billableToUser: true,
    approvedReservationRemainingCredits: 25,
    metadata: {
      qaHarness: 'beta-platform-billing-qa',
      sourceId: input.sourceId,
      walletSettlementPerformed: false,
      stripeCallAttempted: false,
      reeditproServiceFeeIncluded: false,
      mediaProcessed: false,
      providerCalled: false,
      persistentStoreQaExplicitlyAllowed: input.allowPersistentStoreQa === true,
    },
  }
}

function persistentFixtureBlockers(input: BetaPlatformBillingQaInput): string[] {
  const blockers: string[] = []
  if (!isUuid(input.workspaceId)) blockers.push('persistent billing QA workspaceId must be a deployed workspace UUID.')
  if (!isUuid(input.projectId)) blockers.push('persistent billing QA projectId must be a deployed project UUID.')
  if (!input.creditEstimateId) blockers.push('persistent billing QA creditEstimateId is required.')
  if (!isUuid(input.creditReservationId)) blockers.push('persistent billing QA creditReservationId must be an active deployed reservation UUID.')
  return blockers
}

function isUuid(value: unknown): value is string {
  return typeof value === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
}

function missingPlatformEvidence(hasPersistentRuntime: boolean): string[] {
  if (hasPersistentRuntime) {
    return [
      'authenticated RLS member summary readback evidence',
      'release and refund wallet lifecycle evidence from deployed backend runtime',
      'Stripe boundary owner approval evidence',
      'monitoring and billing QA evidence from staging or production',
      'deployment, security, storage, legal, and support approvals',
      'recorded platform evidence packet and operator readback',
    ]
  }

  return [
    'staging or production migration deployment evidence',
    'service-role write path evidence from deployed runtime',
    'authenticated RLS member summary readback evidence',
    'transactional wallet settlement evidence from deployed backend runtime',
    'Stripe boundary owner approval evidence',
    'monitoring and billing QA evidence from staging or production',
    'deployment, security, storage, legal, and support approvals',
  ]
}

function check(
  id: string,
  label: string,
  passed: boolean,
  evidence: string[],
  nextAction: string,
): BetaPlatformBillingQaCheck {
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
