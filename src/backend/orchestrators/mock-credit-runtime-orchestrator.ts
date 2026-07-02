import type { CreditLedgerEntryRecord, CreditReservationRecord } from '../../types'
import type { CreditGateCheckResult } from '../../types/credit-runtime'
import {
  getMockCreditRuntimeScenarioById,
  prepareMockCreditRuntimeScenario,
  type MockCreditRuntimeScenarioId,
} from '../mock/mock-credit-runtime-scenarios'
import { checkCreditApprovalGate } from '../services/credit-approval-gate-service'
import { refundCreditsForFailedJobMock, spendReservedCreditsMock } from '../services/credit-ledger-runtime-service'
import { reserveCreditsForApprovedEstimate } from '../services/credit-reservation-runtime-service'
import { checkGenerationCreditGate, checkRenderCreditGate } from '../services/generation-credit-gate-service'
import { unwrapServiceResult } from '../service-result'

export interface MockCreditRuntimeFlowOutput {
  creditGateResult: CreditGateCheckResult
  reservation?: CreditReservationRecord
  ledgerEntry?: CreditLedgerEntryRecord
  nextStep: 'queue_generation' | 'reserve_credits' | 'spend_reserved_credits' | 'release_or_refund' | 'fix_gate_blocker'
  warnings: string[]
}

export function runMockCreditRuntimeFlow(
  scenarioId: MockCreditRuntimeScenarioId = 'approved-plan-approved-estimate-reservation-allowed',
): MockCreditRuntimeFlowOutput {
  const scenario = getMockCreditRuntimeScenarioById(scenarioId)
  const prepared = prepareMockCreditRuntimeScenario(scenario)
  const creditGateResult = checkCreditApprovalGate(prepared.db, prepared.gateInput)

  return {
    creditGateResult,
    reservation: prepared.reservation,
    nextStep: creditGateResult.ok ? 'queue_generation' : 'fix_gate_blocker',
    warnings: [
      ...creditGateResult.warnings,
      `Expected mock decision: ${prepared.scenario.expectedDecision}.`,
    ],
  }
}

export function runMockCreditGateAllowedFlow(): MockCreditRuntimeFlowOutput {
  return runMockCreditRuntimeFlow('approved-plan-approved-estimate-reservation-allowed')
}

export function runMockCreditGateBlockedFlow(): MockCreditRuntimeFlowOutput {
  return runMockCreditRuntimeFlow('reservation-missing-blocked')
}

export function runMockCreditReservationFlow(): MockCreditRuntimeFlowOutput {
  const prepared = prepareMockCreditRuntimeScenario({
    ...prepareMockCreditRuntimeScenario().scenario,
    createReservation: false,
  })
  const result = unwrapServiceResult(reserveCreditsForApprovedEstimate(prepared.db, {
    workspaceId: prepared.gateInput.workspaceId,
    projectId: prepared.gateInput.projectId,
    creditWalletId: prepared.wallet?.id,
    creditEstimateId: prepared.creditEstimate?.id ?? '',
    creditApprovalId: prepared.creditApproval?.id,
    editPlanId: prepared.editPlan?.id,
    requestedByUserId: prepared.gateInput.requestedByUserId,
    purpose: prepared.gateInput.purpose,
  }))
  const creditGateResult = checkCreditApprovalGate(prepared.db, {
    ...prepared.gateInput,
    creditReservationId: result.reservation.id,
  })

  return {
    creditGateResult,
    reservation: result.reservation,
    nextStep: 'queue_generation',
    warnings: [...result.warnings, ...creditGateResult.warnings],
  }
}

export function runMockCreditSpendFlow(): MockCreditRuntimeFlowOutput {
  const prepared = prepareMockCreditRuntimeScenario(
    getMockCreditRuntimeScenarioById('successful-job-spends-reservation'),
  )
  const spend = prepared.reservation
    ? unwrapServiceResult(spendReservedCreditsMock(prepared.db, prepared.reservation.id))
    : undefined

  return {
    creditGateResult: checkCreditApprovalGate(prepared.db, prepared.gateInput),
    reservation: spend?.reservation ?? prepared.reservation,
    ledgerEntry: spend?.ledgerEntry,
    nextStep: 'spend_reserved_credits',
    warnings: spend?.warnings ?? ['Spend scenario did not create a reservation.'],
  }
}

export function runMockCreditRefundFlow(): MockCreditRuntimeFlowOutput {
  const prepared = prepareMockCreditRuntimeScenario(
    getMockCreditRuntimeScenarioById('failed-job-releases-reservation'),
  )
  const refund = prepared.reservation
    ? unwrapServiceResult(refundCreditsForFailedJobMock(prepared.db, prepared.reservation.id))
    : undefined

  return {
    creditGateResult: checkCreditApprovalGate(prepared.db, prepared.gateInput),
    reservation: refund?.reservation ?? prepared.reservation,
    ledgerEntry: refund?.ledgerEntry,
    nextStep: 'release_or_refund',
    warnings: refund?.warnings ?? ['Refund scenario did not create a reservation.'],
  }
}

export function runMockGenerationCreditGateFlow(): MockCreditRuntimeFlowOutput {
  const prepared = prepareMockCreditRuntimeScenario(
    getMockCreditRuntimeScenarioById('music-generation-gate-allowed'),
  )
  const creditGateResult = checkGenerationCreditGate(prepared.db, {
    ...prepared.gateInput,
    estimatedCredits: 18,
    requiresApproval: true,
  })

  return {
    creditGateResult,
    reservation: prepared.reservation,
    nextStep: creditGateResult.ok ? 'queue_generation' : 'fix_gate_blocker',
    warnings: creditGateResult.warnings,
  }
}

export function runMockRenderCreditGateFlow(): MockCreditRuntimeFlowOutput {
  const prepared = prepareMockCreditRuntimeScenario(
    getMockCreditRuntimeScenarioById('render-gate-allowed'),
  )
  const creditGateResult = checkRenderCreditGate(prepared.db, {
    ...prepared.gateInput,
    estimatedCredits: 8,
    requiresApproval: true,
  })

  return {
    creditGateResult,
    reservation: prepared.reservation,
    nextStep: creditGateResult.ok ? 'queue_generation' : 'fix_gate_blocker',
    warnings: creditGateResult.warnings,
  }
}
