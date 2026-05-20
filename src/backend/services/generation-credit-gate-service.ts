import type { CreditGateCheckInput, CreditGateCheckResult } from '../../types/credit-runtime'
import type { MockDatabase } from '../mock/mock-database'
import { checkCreditApprovalGate, createCreditGateCheckSummary } from './credit-approval-gate-service'

type GateInputWithoutPurpose = Omit<CreditGateCheckInput, 'purpose'>

export function checkGenerationCreditGate(
  db: MockDatabase,
  input: GateInputWithoutPurpose,
): CreditGateCheckResult {
  return checkCreditApprovalGate(db, {
    ...input,
    purpose: 'video_generation',
  })
}

export function checkMusicGenerationCreditGate(
  db: MockDatabase,
  input: GateInputWithoutPurpose,
): CreditGateCheckResult {
  return checkCreditApprovalGate(db, {
    ...input,
    purpose: 'music_generation',
  })
}

export function checkSFXGenerationCreditGate(
  db: MockDatabase,
  input: GateInputWithoutPurpose,
): CreditGateCheckResult {
  return checkCreditApprovalGate(db, {
    ...input,
    purpose: 'sfx_generation',
  })
}

export function checkSignatureGenerationCreditGate(
  db: MockDatabase,
  input: GateInputWithoutPurpose & {
    signaturePurpose?: 'stroke_motion_generation' | 'graphic_design_generation' | 'real_motion_generation'
  },
): CreditGateCheckResult {
  return checkCreditApprovalGate(db, {
    ...input,
    purpose: input.signaturePurpose ?? 'stroke_motion_generation',
  })
}

export function checkRenderCreditGate(
  db: MockDatabase,
  input: GateInputWithoutPurpose & { finalExport?: boolean },
): CreditGateCheckResult {
  return checkCreditApprovalGate(db, {
    ...input,
    purpose: input.finalExport ? 'final_export' : 'preview_render',
  })
}

export function checkWorkerJobCreditGate(
  db: MockDatabase,
  input: GateInputWithoutPurpose,
): CreditGateCheckResult {
  return checkCreditApprovalGate(db, {
    ...input,
    purpose: 'worker_job',
  })
}

export function createGenerationCreditGateSummary(result: CreditGateCheckResult): string {
  if (result.ok) {
    return 'Generation/render/worker credit gate passed.'
  }

  return createCreditGateCheckSummary(result)
}
