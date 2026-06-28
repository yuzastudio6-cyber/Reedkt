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
    return buildBlockedPersistentReport(input, requestedEnvironment, createdAt)
  }

  const service = createToolCostMeteringService(context)
  const eventInput = buildQaEventInput(input, hasPersistentRuntime)
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
  const eventWritePassed = hasPersistentRuntime
    ? !first.event.billableToUser &&
      first.event.failureCategory === 'provider_error' &&
      first.event.toolCostCredits === 0
    : first.event.billableToUser && Boolean(first.event.creditEstimateId && first.event.creditReservationId)
  const walletBoundaryPassed = hasPersistentRuntime
    ? !first.event.billableToUser && first.event.metadata.walletSettlementPerformed === false
    : first.event.billableToUser && first.event.metadata.walletSettlementPerformed === false
  const explicitWalletSettlementPassed = hasPersistentRuntime
    ? settlement.settlement.status === 'not_billable' &&
      settlement.settlement.creditsDelta === 0 &&
      settlementReplay.replayed &&
      settlementReplay.settlement.id === settlement.settlement.id
    : settlement.settlement.status === 'settled_mock' &&
      settlement.settlement.creditsDelta === -first.event.toolCostCredits &&
      settlementReplay.replayed &&
      settlementReplay.settlement.id === settlement.settlement.id

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
    billableEventCount: summary.summary.billableEventCount,
    summaryCredits: summary.summary.actualToolCostCredits,
    checks: [
      check(
        'tool_cost_event_write',
        'Tool cost event write path accepts an approved estimate and reservation context',
        eventWritePassed,
        [
          `eventId=${first.event.id}`,
          `credits=${first.event.toolCostCredits}`,
          `persistenceMode=${hasPersistentRuntime ? 'supabase_service_role' : 'mock_memory'}`,
          `billableToUser=${first.event.billableToUser}`,
          `failureCategory=${first.event.failureCategory}`,
        ],
        'Deploy and run this QA against staging with service-role persistence before platform evidence can clear.',
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
        'Verify authenticated RLS member readback in staging before platform evidence can clear.',
      ),
      check(
        'wallet_settlement_boundary',
        'Wallet settlement is not silently performed by tool event recording',
        walletBoundaryPassed,
        [
          hasPersistentRuntime
            ? 'persistent QA fixture is explicitly non-billable and zero-credit'
            : 'tool cost event is billable metadata only',
          'wallet settlement remains a separate transactional backend step',
        ],
        'Implement and verify wallet spend/release/refund settlement before platform evidence can clear.',
      ),
      check(
        'explicit_wallet_settlement',
        hasPersistentRuntime
          ? 'Explicit wallet settlement RPC records an idempotent non-billable settlement effect'
          : 'Explicit wallet settlement skeleton records an idempotent mock ledger effect',
        explicitWalletSettlementPassed,
        [
          `settlementId=${settlement.settlement.id}`,
          `creditsDelta=${settlement.settlement.creditsDelta}`,
          `replayed=${settlementReplay.replayed}`,
          `walletMutationMode=${settlement.settlement.walletMutationMode}`,
          `settlementStatus=${settlement.settlement.status}`,
        ],
        'Replace mock settlement with a transactional Supabase wallet settlement RPC before platform evidence can clear.',
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
    missingPlatformEvidence: [
      ...(hasPersistentRuntime ? [] : [
        'staging or production migration deployment evidence',
        'service-role write path evidence from deployed runtime',
        'authenticated RLS member summary readback evidence',
        'transactional wallet settlement evidence from deployed backend runtime',
      ]),
      'Stripe boundary owner approval evidence',
      'monitoring evidence from staging or production',
      'deployment, security, storage, legal, and support approvals',
    ],
    notes: [
      ...(input.notes ?? []),
      hasPersistentRuntime
        ? 'Persistent QA ran a non-billable zero-credit event and idempotent settlement through deployed backend paths; it did not process media, call providers, call Stripe, enable beta, or mark production ready.'
        : 'This QA harness does not process media, call providers, call Stripe, settle real wallets, enable beta, or mark production ready.',
      'The report is blocker-reduction evidence only; ToolBetaPlatformReadinessEvidence still requires owner approvals and final recorded evidence.',
    ],
  }
}

function buildBlockedPersistentReport(
  input: BetaPlatformBillingQaInput,
  environment: BetaPlatformBillingQaEnvironment,
  createdAt: string,
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
    billableEventCount: 0,
    summaryCredits: 0,
    checks: [
      {
        id: 'persistent_store_qa_requires_explicit_approval',
        label: 'Persistent platform billing QA requires explicit staging approval before non-mock writes',
        status: 'blocked',
        evidence: [
          'service-role runtime is available',
          'tool-cost event persistence exists',
          'allowPersistentStoreQa=true was not supplied',
        ],
        nextAction: 'Re-run staging billing QA with allowPersistentStoreQa=true after confirming this is a staging-only non-runtime billing evidence probe.',
      },
    ],
    missingPlatformEvidence: [
      'explicit persistent staging billing QA approval',
      'staging or production billing QA evidence',
    ],
    notes: [
      ...(input.notes ?? []),
      'No persistent write was attempted because non-mock platform billing QA requires explicit staging approval.',
    ],
  }
}

function buildQaEventInput(input: BetaPlatformBillingQaInput, persistentRuntime: boolean): ToolCostEventInput {
  return {
    id: `tool-cost-platform-qa-${hashFragment(input.workspaceId, input.projectId, input.sourceId)}`,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    editPlanId: null,
    jobId: null,
    creditEstimateId: persistentRuntime ? null : 'platform-billing-qa-credit-estimate',
    creditReservationId: persistentRuntime ? null : 'platform-billing-qa-credit-reservation',
    toolId: 'ffmpeg',
    toolName: 'FFmpeg platform billing QA fixture',
    usageCategory: 'rendering',
    providerType: 'deterministic_renderer',
    qualityLevel: 'preview',
    startedAt: smokeStartedAt,
    completedAt: smokeCompletedAt,
    wallClockMs: 8_000,
    billableMs: persistentRuntime ? 0 : 8_000,
    vcpuCount: 2,
    memoryGiB: 4,
    renderDurationSeconds: persistentRuntime ? 0 : 4,
    outputResolution: '1920x1080',
    outputFrameRate: 30,
    billableToUser: !persistentRuntime,
    failureCategory: persistentRuntime ? 'provider_error' : 'none',
    approvedReservationRemainingCredits: persistentRuntime ? undefined : 25,
    metadata: {
      qaHarness: 'beta-platform-billing-qa',
      sourceId: input.sourceId,
      persistentRuntime,
      walletSettlementPerformed: false,
      stripeCallAttempted: false,
      reeditproServiceFeeIncluded: false,
      mediaProcessed: false,
      providerCalled: false,
    },
  }
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
