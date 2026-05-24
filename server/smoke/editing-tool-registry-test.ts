import {
  CURRENT_MILESTONE_REQUIRED_TOOL_IDS,
  EDITING_TOOL_IDS,
  type EditingToolCurrentReadiness,
  type EditingToolProductionApprovalStatus,
  type EditingToolReviewStatus,
} from '../tools/editing-tool-contracts'
import {
  getCurrentMilestoneRequiredToolIds,
  listEditingToolContracts,
} from '../tools/editing-tool-registry'

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message)
}

const validReviewStatuses = new Set<EditingToolReviewStatus>([
  'approved_for_staging_smoke',
  'pending_review',
  'not_required_current_milestone',
])

const validProductionStatuses = new Set<EditingToolProductionApprovalStatus>([
  'staging_smoke_only',
  'planning_only',
  'blocked_until_review',
])

const validReadinessStatuses = new Set<EditingToolCurrentReadiness>([
  'code_enforced_proven_staging',
  'safe_check_available',
  'planned_stub',
  'not_installed_optional',
])

const contracts = listEditingToolContracts()
const contractIds = new Set(contracts.map((contract) => contract.toolId))

for (const toolId of EDITING_TOOL_IDS) {
  assert(contractIds.has(toolId), `Registry should include ${toolId}.`)
}

for (const contract of contracts) {
  assert(contract.toolId.length > 0, `${contract.toolId} should have a tool id.`)
  assert(contract.displayName.length > 0, `${contract.toolId} should have a display name.`)
  assert(contract.productionPurpose.length > 0, `${contract.toolId} should have a production purpose.`)
  assert(contract.workerBoundary.length > 0, `${contract.toolId} should have a worker boundary.`)
  assert(contract.optionalUntil.length > 0, `${contract.toolId} should have an optional-until note.`)
  assert(contract.installTarget.length > 0, `${contract.toolId} should have an install target.`)
  assert(contract.runtimeCheck.safeCheckOnly, `${contract.toolId} runtime check must be safe-only.`)
  assert(contract.expectedVersionShape.length > 0, `${contract.toolId} should define expected version shape.`)
  assert(contract.inputContracts.length > 0, `${contract.toolId} should define input contracts.`)
  assert(contract.outputContracts.length > 0, `${contract.toolId} should define output contracts.`)
  assert(contract.timeoutMs > 0 && contract.timeoutMs <= 300000, `${contract.toolId} timeout should be bounded.`)
  assert(contract.memoryHint.length > 0, `${contract.toolId} should have a memory hint.`)
  assert(contract.cpuHint.length > 0, `${contract.toolId} should have a CPU hint.`)
  assert(contract.failureMode.length > 0, `${contract.toolId} should have a failure mode.`)
  assert(validReviewStatuses.has(contract.licenseReviewStatus), `${contract.toolId} license status should be valid.`)
  assert(validReviewStatuses.has(contract.securityReviewStatus), `${contract.toolId} security status should be valid.`)
  assert(validProductionStatuses.has(contract.productionApprovalStatus), `${contract.toolId} production status should be valid.`)
  assert(validReadinessStatuses.has(contract.currentReadiness), `${contract.toolId} readiness status should be valid.`)
}

for (const toolId of CURRENT_MILESTONE_REQUIRED_TOOL_IDS) {
  const contract = contracts.find((candidate) => candidate.toolId === toolId)
  assert(Boolean(contract), `${toolId} should be registered as a current required tool.`)
  assert(
    contract?.currentReadiness === 'code_enforced_proven_staging',
    `${toolId} should be marked code-enforced/proven for passed staging gates.`,
  )
  assert(
    contract?.productionApprovalStatus === 'staging_smoke_only',
    `${toolId} should stay staging-smoke-only, not production-approved.`,
  )
}

const serialized = JSON.stringify(contracts).toLowerCase()
for (const forbidden of ['api_key', 'service_role', 'stripe_secret', 'bearer ', 'authorization']) {
  assert(!serialized.includes(forbidden), `Registry should not contain secret/provider credential field ${forbidden}.`)
}

assert(
  getCurrentMilestoneRequiredToolIds().join(',') === [...CURRENT_MILESTONE_REQUIRED_TOOL_IDS].join(','),
  'Current milestone required tool ids should be stable.',
)

console.log(JSON.stringify({
  ok: true,
  checks: [
    'all_tools_registered',
    'contract_fields_complete',
    'statuses_valid',
    'passed_gate_tools_code_enforced',
    'no_secret_fields',
  ],
  requiredToolIds: getCurrentMilestoneRequiredToolIds(),
  toolCount: contracts.length,
}))
