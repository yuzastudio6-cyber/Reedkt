import type { BlockedPlanRecord, CandidateApprovedPlanSnapshot } from '../agent-tool-plan-bridge'
import type { RuntimeBlockValidationResult } from './approved-plan-validation-types'

export function validateApprovedPlanRuntimeBlocks(input: {
  candidatePlans: CandidateApprovedPlanSnapshot[]
  blockedPlans: BlockedPlanRecord[]
}): RuntimeBlockValidationResult {
  const blockers: string[] = []
  const details = []
  for (const plan of input.candidatePlans) {
    const passed = !plan.rawPromptExecution &&
      !plan.workerExecutionAllowed &&
      !plan.approvedForRuntime &&
      !plan.safetyFlags.toolRuntimeAllowed &&
      !plan.safetyFlags.providerCallsAllowed &&
      !plan.safetyFlags.modelInferenceAllowed
    if (!passed) blockers.push(`${plan.planId}: attempted runtime/provider/model/worker execution.`)
    details.push({ id: plan.planId, passed, summary: passed ? 'Runtime, provider, worker, and model execution remain blocked.' : 'Runtime block failed.' })
  }
  for (const plan of input.blockedPlans) {
    const passed = !plan.rawPromptExecution && !plan.workerExecutionAllowed && !plan.approvedForRuntime
    if (!passed) blockers.push(`${plan.planId}: attempted execution despite blocked/handoff status.`)
    details.push({ id: plan.planId, passed, summary: passed ? 'Blocked/handoff record remains non-executable.' : 'Blocked/handoff runtime block failed.' })
  }
  return {
    validationId: 'phase52e_runtime_block_validation',
    status: blockers.length ? 'blocked' : 'passed',
    checkedRecords: input.candidatePlans.length + input.blockedPlans.length,
    blockers,
    warnings: [],
    details,
    runtimeExecutionAllowed: false,
    workerExecutionAllowed: false,
    providerCallsAllowed: false,
    directAgentToolExecutionAllowed: false,
  }
}
