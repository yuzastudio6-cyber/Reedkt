import type {
  CreditApprovalRecord,
  CreditEstimateRecord,
  CreditReservationRecord,
  CreditWalletRecord,
  EditPlanRecord,
} from '../../types'
import type { CreditGateCheckInput, CreditGateDecision, CreditSpendPurpose } from '../../types/credit-runtime'
import { runChatNativeEditPlanningFlow } from '../orchestrators/chat-native-editor-orchestrator'
import { approveCreditEstimate, createCreditWallet, grantWeeklyBonusCredits } from '../services/credit-service'
import { approveEditPlan } from '../services/edit-plan-service'
import { reserveCreditsForApprovedEstimate } from '../services/credit-reservation-runtime-service'
import { unwrapServiceResult } from '../service-result'
import { createMockDatabase, type MockDatabase } from './mock-database'
import { MOCK_USER_ID, MOCK_WORKSPACE_ID } from './mock-service-data'

export type MockCreditRuntimeScenarioId =
  | 'approved-plan-approved-estimate-reservation-allowed'
  | 'missing-edit-plan-approval-blocked'
  | 'missing-credit-estimate-blocked'
  | 'estimate-not-approved-blocked'
  | 'reservation-missing-blocked'
  | 'insufficient-credits-blocked'
  | 'wrong-project-reservation-blocked'
  | 'music-generation-gate-allowed'
  | 'sfx-generation-gate-allowed'
  | 'render-gate-allowed'
  | 'failed-job-releases-reservation'
  | 'successful-job-spends-reservation'
  | 'provider-generation-without-reservation-blocked'
  | 'mock-demo-free-operation-allowed'
  | 'expired-reservation-blocked'

export interface MockCreditRuntimeScenario {
  id: MockCreditRuntimeScenarioId
  label: string
  purpose: CreditSpendPurpose
  estimatedCredits: number
  availableCredits: number
  requiresApproval: boolean
  approveEditPlan: boolean
  approveEstimate: boolean
  createReservation: boolean
  omitEstimateFromGate?: boolean
  wrongProjectReservation?: boolean
  expireReservation?: boolean
  expectedDecision: CreditGateDecision
}

export interface PreparedMockCreditRuntimeScenario {
  scenario: MockCreditRuntimeScenario
  db: MockDatabase
  wallet?: CreditWalletRecord
  editPlan?: EditPlanRecord
  creditEstimate?: CreditEstimateRecord
  creditApproval?: CreditApprovalRecord
  reservation?: CreditReservationRecord
  gateInput: CreditGateCheckInput
}

export const mockCreditRuntimeScenarios: MockCreditRuntimeScenario[] = [
  scenario('approved-plan-approved-estimate-reservation-allowed', 'Approved edit plan + approved estimate + reservation allowed.', 'video_generation', 'allowed', { createReservation: true }),
  scenario('missing-edit-plan-approval-blocked', 'Missing edit plan approval blocks generation.', 'video_generation', 'blocked_estimate_not_approved', { approveEditPlan: false, approveEstimate: true }),
  scenario('missing-credit-estimate-blocked', 'Missing credit estimate blocks generation.', 'video_generation', 'blocked_no_estimate', { omitEstimateFromGate: true }),
  scenario('estimate-not-approved-blocked', 'Unapproved credit estimate blocks generation.', 'video_generation', 'blocked_estimate_not_approved', { approveEstimate: false }),
  scenario('reservation-missing-blocked', 'Missing reservation blocks provider/render work.', 'video_generation', 'blocked_reservation_missing'),
  scenario('insufficient-credits-blocked', 'Insufficient credits block reservation.', 'video_generation', 'blocked_insufficient_credits', { availableCredits: 4 }),
  scenario('wrong-project-reservation-blocked', 'Reservation scoped to the wrong project blocks generation.', 'video_generation', 'blocked_wrong_user_or_workspace', { createReservation: true, wrongProjectReservation: true }),
  scenario('music-generation-gate-allowed', 'Music generation gate allowed with approved estimate and reservation.', 'music_generation', 'allowed', { createReservation: true, estimatedCredits: 18 }),
  scenario('sfx-generation-gate-allowed', 'SFX generation gate allowed with approved estimate and reservation.', 'sfx_generation', 'allowed', { createReservation: true, estimatedCredits: 6 }),
  scenario('render-gate-allowed', 'Preview render gate allowed with approved estimate and reservation.', 'preview_render', 'allowed', { createReservation: true, estimatedCredits: 8 }),
  scenario('failed-job-releases-reservation', 'Failed job can release reservation.', 'worker_job', 'allowed', { createReservation: true }),
  scenario('successful-job-spends-reservation', 'Successful job can spend reservation.', 'worker_job', 'allowed', { createReservation: true }),
  scenario('provider-generation-without-reservation-blocked', 'Provider generation blocked without reservation.', 'video_generation', 'blocked_reservation_missing'),
  scenario('mock-demo-free-operation-allowed', 'Mock demo/free operation allowed without spend.', 'edit_planning', 'allowed', { requiresApproval: false, estimatedCredits: 0, approveEditPlan: false, approveEstimate: false, availableCredits: 0 }),
  scenario('expired-reservation-blocked', 'Expired reservation blocks generation.', 'video_generation', 'blocked_reservation_expired', { createReservation: true, expireReservation: true }),
]

export function getMockCreditRuntimeScenarioById(
  id: MockCreditRuntimeScenarioId,
): MockCreditRuntimeScenario | undefined {
  return mockCreditRuntimeScenarios.find((candidate) => candidate.id === id)
}

export function getDefaultMockCreditRuntimeScenario(): MockCreditRuntimeScenario {
  return mockCreditRuntimeScenarios[0]
}

export function prepareMockCreditRuntimeScenario(
  scenarioInput: MockCreditRuntimeScenario = getDefaultMockCreditRuntimeScenario(),
): PreparedMockCreditRuntimeScenario {
  const db = createMockDatabase()
  const planningState = unwrapServiceResult(runChatNativeEditPlanningFlow({}, db))
  const wallet = unwrapServiceResult(createCreditWallet(db, MOCK_WORKSPACE_ID, MOCK_USER_ID))
  unwrapServiceResult(grantWeeklyBonusCredits(db, wallet.id, scenarioInput.availableCredits))

  const editPlan = planningState.editPlan
  if (scenarioInput.approveEditPlan) {
    unwrapServiceResult(approveEditPlan(db, editPlan.id, MOCK_USER_ID))
  }

  const creditEstimate = planningState.creditEstimate
  creditEstimate.totalEstimatedCredits = scenarioInput.estimatedCredits
  creditEstimate.minimumEstimatedCredits = Math.max(0, scenarioInput.estimatedCredits - 2)
  creditEstimate.maximumEstimatedCredits = scenarioInput.estimatedCredits + 4
  creditEstimate.availableCreditsSnapshot = wallet.cachedAvailableCredits
  creditEstimate.updatedAt = new Date().toISOString()

  const creditApproval = scenarioInput.approveEstimate && scenarioInput.requiresApproval
    ? unwrapServiceResult(approveCreditEstimate(db, {
        workspaceId: MOCK_WORKSPACE_ID,
        projectId: planningState.project.id,
        creditEstimateId: creditEstimate.id,
        approvedByUserId: MOCK_USER_ID,
      }))
    : undefined

  const reservation = scenarioInput.createReservation && creditApproval
    ? unwrapServiceResult(reserveCreditsForApprovedEstimate(db, {
        workspaceId: MOCK_WORKSPACE_ID,
        projectId: planningState.project.id,
        creditWalletId: wallet.id,
        creditEstimateId: creditEstimate.id,
        creditApprovalId: creditApproval.id,
        editPlanId: editPlan.id,
        requestedByUserId: MOCK_USER_ID,
        purpose: scenarioInput.purpose,
      })).reservation
    : undefined

  if (reservation && scenarioInput.wrongProjectReservation) {
    reservation.projectId = 'mock-other-project'
  }

  if (reservation && scenarioInput.expireReservation) {
    reservation.expiresAt = '2020-01-01T00:00:00.000Z'
  }

  return {
    scenario: scenarioInput,
    db,
    wallet,
    editPlan,
    creditEstimate,
    creditApproval,
    reservation,
    gateInput: {
      workspaceId: MOCK_WORKSPACE_ID,
      projectId: planningState.project.id,
      editPlanId: editPlan.id,
      creditEstimateId: scenarioInput.omitEstimateFromGate ? undefined : creditEstimate.id,
      creditReservationId: reservation?.id,
      requestedByUserId: MOCK_USER_ID,
      purpose: scenarioInput.purpose,
      estimatedCredits: scenarioInput.estimatedCredits,
      requiresApproval: scenarioInput.requiresApproval,
    },
  }
}

function scenario(
  id: MockCreditRuntimeScenarioId,
  label: string,
  purpose: CreditSpendPurpose,
  expectedDecision: CreditGateDecision,
  overrides: Partial<MockCreditRuntimeScenario> = {},
): MockCreditRuntimeScenario {
  return {
    id,
    label,
    purpose,
    estimatedCredits: 18,
    availableCredits: 100,
    requiresApproval: true,
    approveEditPlan: true,
    approveEstimate: true,
    createReservation: false,
    expectedDecision,
    ...overrides,
  }
}
