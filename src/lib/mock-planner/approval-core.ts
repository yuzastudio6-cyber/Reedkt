import { createGuidedMockEditPlan } from './guided'
import type { EditPlan, PlannerInput } from '../../types/reeditpro'

export type ApprovalGateId =
  | 'planning_context'
  | 'aspect_ratio_frame'
  | 'source_cleanup'
  | 'trim_review'
  | 'master_timing'
  | 'soundsync_transition_timing'
  | 'timing_validation'

export type ApprovalGateContext = {
  cleanupPreferenceConfirmed: boolean
  planningContextStatus?: string
}

export type ApprovalGateCheck = {
  id: ApprovalGateId
  message: string
  passed: boolean
}

export type ApprovalGateResult =
  | {
      ok: true
      checks: ApprovalGateCheck[]
    }
  | {
      ok: false
      checks: ApprovalGateCheck[]
      failureMessage: string
    }

export type ApprovalCoreResult =
  | {
      ok: true
      gates: ApprovalGateResult
      plan: EditPlan
    }
  | {
      ok: false
      failureMessage: string
      gates: ApprovalGateResult
      plan: EditPlan
    }

function check(id: ApprovalGateId, passed: boolean, message: string): ApprovalGateCheck {
  return { id, message, passed }
}

export function createApprovalCorePlan(input: PlannerInput): EditPlan {
  return createGuidedMockEditPlan(input)
}

export function runApprovalCoreGates(plan: EditPlan, context: ApprovalGateContext): ApprovalGateResult {
  const checks: ApprovalGateCheck[] = [
    check(
      'planning_context',
      context.planningContextStatus !== 'blocked',
      'Resolve blocking Planning Context issues before approving credits or starting mock progress.',
    ),
    check(
      'aspect_ratio_frame',
      plan.aspectRatioFramePlan?.status === 'confirmed',
      'Confirm the output frame before approving the plan and credit estimate.',
    ),
    check(
      'source_cleanup',
      Boolean(plan.sourceCleanupPlan && plan.sourceCleanupPlan.status === 'confirmed' && context.cleanupPreferenceConfirmed),
      'Confirm the source cleanup style before approving trims, timing, and credits.',
    ),
    check(
      'trim_review',
      Boolean(plan.trimReviewPlan && !plan.trimReviewPlan.approvalBlocked),
      'Resolve trim review before approving retake selection, meaning-sensitive cuts, timing, and credits.',
    ),
    check(
      'master_timing',
      Boolean(plan.masterTimingPlan && plan.masterTimingPlan.status !== 'needs_frame_confirmation' && plan.masterTimingPlan.status !== 'blocked'),
      'Master timing needs the confirmed output frame and timing base before approval.',
    ),
    check(
      'soundsync_transition_timing',
      Boolean(plan.soundSyncTransitionTimingPlan && plan.soundSyncTransitionTimingPlan.status !== 'blocked'),
      'SoundSync + transition timing must be reviewable before approval.',
    ),
    check(
      'timing_validation',
      Boolean(
        plan.timingValidationPlan &&
          !plan.timingValidationPlan.approvalBlocked &&
          plan.timingValidationPlan.overallStatus !== 'blocking' &&
          plan.timingValidationPlan.overallStatus !== 'failed',
      ),
      'Timing validation must pass before approval. Resolve timing block reasons or choose a lower-cost timing alternative.',
    ),
  ]
  const failedCheck = checks.find((item) => !item.passed)

  if (failedCheck) {
    return {
      ok: false,
      checks,
      failureMessage: failedCheck.message,
    }
  }

  return { ok: true, checks }
}

export function createApprovedMockPlan(input: PlannerInput, context: ApprovalGateContext): ApprovalCoreResult {
  const plan = createApprovalCorePlan(input)
  const gates = runApprovalCoreGates(plan, context)

  if (!gates.ok) {
    return {
      ok: false,
      failureMessage: gates.failureMessage,
      gates,
      plan,
    }
  }

  return {
    ok: true,
    gates,
    plan,
  }
}
