import assert from 'node:assert/strict'

import {
  EDIT_REFERENCE_STUDY_CHAT_REASONING_OPERATIONS,
  EDIT_REFERENCE_STUDY_CHAT_REASONING_TABLES,
  editReferenceStudyChatProductionPersistenceContract,
  validateEditReferenceStudyChatProductionPersistenceContract,
  type EditReferenceStudyChatProductionPersistenceContract,
} from '../edit-references/edit-reference-study-chat-production-persistence-contract'
import {
  editReferenceProductionPersistenceContract,
  validateEditReferenceProductionPersistenceContract,
  type EditReferenceProductionPersistenceContract,
} from '../edit-references/edit-reference-production-persistence-contract'

const contract = editReferenceStudyChatProductionPersistenceContract
const summary = validateEditReferenceStudyChatProductionPersistenceContract(contract)
const aggregateSummary = validateEditReferenceProductionPersistenceContract()

assert.equal(summary.schemaVersion, 'edit-reference-study-chat-production-persistence-v1')
assert.equal(summary.tableCount, 6)
assert.equal(summary.operationCount, 13)
assert.equal(summary.routeCount, 3)
assert.equal(summary.approvedEditAuthorityFabricated, false)
assert.equal(summary.productionEnabled, false)
assert.deepEqual(contract.operations, EDIT_REFERENCE_STUDY_CHAT_REASONING_OPERATIONS)
assert.deepEqual(
  contract.routePolicy.exactOrder,
  ['kimi_k3_primary', 'qwen_3_7_fallback', 'deepseek_v4_pro_fallback'],
)
assert.equal(contract.routePolicy.qwenVisualSpecialistMaySubstituteForReasoning, false)
assert.equal(contract.routePolicy.fallbackRequiresCommittedFailedAttemptCost, true)
assert.equal(contract.routePolicy.unknownProviderOutcomeBlocksFallback, true)
assert.equal(contract.transaction.savedDirectionRunReservationAndIdempotencyShareTransaction, true)
assert.equal(contract.transaction.oneUseProviderSubmissionRequired, true)
assert.equal(contract.transaction.routeAttemptTerminalOutcomeAndCostShareTransaction, true)
assert.equal(contract.transaction.terminalRunReceiptAssistantMessageAndAggregateSettlementShareTransaction, true)
assert.equal(contract.cost.everyProviderAttemptMeteredSeparately, true)
assert.equal(contract.cost.failedAttemptCostRetained, true)
assert.equal(contract.cost.qwenVersionedCnyToUsdFxRequired, true)
assert.equal(contract.cost.customerPriceCalculated, false)
assert.equal(contract.cost.customerCreditsMutated, false)
assert.equal(contract.cost.serviceFeeIncluded, false)
assert.equal(contract.persistence.rawProviderRequestPersisted, false)
assert.equal(contract.persistence.rawProviderResponsePersisted, false)
assert.equal(contract.persistence.hiddenReasoningPersisted, false)
assert.equal(contract.persistence.providerCredentialPersisted, false)
assert.equal(contract.persistence.routeAttemptsCompareAndSwapVersioned, true)
assert.equal(contract.persistence.terminalRouteAttemptsImmutable, true)
assert.equal(contract.recovery.browserSessionRequiredForCompletion, false)
assert.equal(contract.recovery.automaticResubmissionAfterUnknownOutcomeAllowed, false)
assert.equal(contract.runtimeActivation.productionEnabled, false)

assert.equal(aggregateSummary.version, 'edit-reference-production-persistence-contract-v6')
assert.equal(aggregateSummary.studyChatReasoningTableCount, EDIT_REFERENCE_STUDY_CHAT_REASONING_TABLES.length)
assert.equal(aggregateSummary.studyChatReasoningTableCount, 6)
assert.equal(aggregateSummary.studyChatReasoningOperationCount, 13)
assert.equal(aggregateSummary.studyChatReasoningRuntimeEnabled, false)

for (const tableName of EDIT_REFERENCE_STUDY_CHAT_REASONING_TABLES) {
  const table = editReferenceProductionPersistenceContract.tables.find((candidate) => (
    candidate.name === tableName
  ))
  assert.ok(table, `Missing ${tableName}.`)
  assert.equal(table.rlsEnabled, true)
  assert.equal(table.rlsForced, true)
  assert.equal(table.serviceTransactionWritesOnly, true)
  assert.equal(table.directAuthenticatedInsertAllowed, false)
  assert.equal(table.directAuthenticatedUpdateAllowed, false)
  assert.equal(table.directAuthenticatedDeleteAllowed, false)
  assert.equal(table.authenticatedWorkspaceMemberRead, false)
}

const routeAttemptTable = editReferenceProductionPersistenceContract.tables.find((candidate) => (
  candidate.name === 'preference_study_reasoning_route_attempts'
))
assert.equal(routeAttemptTable?.requiredColumns.includes('revision'), true)
assert.equal(routeAttemptTable?.requiredColumns.includes('status'), true)
assert.equal(routeAttemptTable?.immutableAfterCommit, false)
assert.equal(routeAttemptTable?.appendOnly, false)

const reasoningRunTable = editReferenceProductionPersistenceContract.tables.find((candidate) => (
  candidate.name === 'preference_study_reasoning_runs'
))
for (const requiredColumn of [
  'reservation_idempotency_key_digest',
  'canonical_request_hash',
  'durable_response_digest',
]) {
  assert.equal(reasoningRunTable?.requiredColumns.includes(requiredColumn), true)
}
assert.equal(reasoningRunTable?.compositeForeignKeys.some((key) => (
  key.referencesTable === 'workspace_members'
  && key.columns.join('|') === 'workspace_id|actor_user_id'
  && key.referencesColumns.join('|') === 'workspace_id|user_id'
)), true)

const withoutReceiptTable = {
  ...editReferenceProductionPersistenceContract,
  tables: editReferenceProductionPersistenceContract.tables.filter((candidate) => (
    candidate.name !== 'preference_study_reasoning_run_receipts'
  )),
} as EditReferenceProductionPersistenceContract
assert.throws(
  () => validateEditReferenceProductionPersistenceContract(withoutReceiptTable),
  /production persistence contract is incomplete or unsafe/i,
)

const withoutActorMembershipBinding = {
  ...editReferenceProductionPersistenceContract,
  tables: editReferenceProductionPersistenceContract.tables.map((candidate) => (
    candidate.name === 'preference_study_reasoning_runs'
      ? {
          ...candidate,
          compositeForeignKeys: candidate.compositeForeignKeys.filter((key) => (
            key.referencesTable !== 'workspace_members'
          )),
        }
      : candidate
  )),
} as EditReferenceProductionPersistenceContract
assert.throws(
  () => validateEditReferenceProductionPersistenceContract(withoutActorMembershipBinding),
  /production persistence contract is incomplete or unsafe/i,
)

const withSkippedKimi = {
  ...contract,
  routePolicy: {
    ...contract.routePolicy,
    exactOrder: ['qwen_3_7_fallback', 'kimi_k3_primary', 'deepseek_v4_pro_fallback'],
  },
} as unknown as EditReferenceStudyChatProductionPersistenceContract
assert.throws(
  () => validateEditReferenceStudyChatProductionPersistenceContract(withSkippedKimi),
  /reasoning persistence contract is incomplete or unsafe/i,
)

const withRawProviderPayload = {
  ...contract,
  persistence: {
    ...contract.persistence,
    rawProviderResponsePersisted: true,
  },
} as unknown as EditReferenceStudyChatProductionPersistenceContract
assert.throws(
  () => validateEditReferenceStudyChatProductionPersistenceContract(withRawProviderPayload),
  /reasoning persistence contract is incomplete or unsafe/i,
)

const withFabricatedApprovedEditAuthority = {
  ...contract,
  approvedEditPlanSnapshotRequired: true,
} as unknown as EditReferenceStudyChatProductionPersistenceContract
assert.throws(
  () => validateEditReferenceStudyChatProductionPersistenceContract(withFabricatedApprovedEditAuthority),
  /reasoning persistence contract is incomplete or unsafe/i,
)

const withUnverifiedRuntimePromoted = {
  ...editReferenceProductionPersistenceContract,
  studyChatReasoning: {
    ...contract,
    runtimeActivation: {
      ...contract.runtimeActivation,
      productionEnabled: true,
    },
  },
} as unknown as EditReferenceProductionPersistenceContract
assert.throws(
  () => validateEditReferenceProductionPersistenceContract(withUnverifiedRuntimePromoted),
  /production persistence contract is incomplete or unsafe/i,
)

console.log(JSON.stringify({
  status: 'passed',
  contractVersion: summary.schemaVersion,
  aggregateContractVersion: aggregateSummary.version,
  authorityClass: contract.authorityClass,
  routeOrder: contract.routePolicy.exactOrder,
  tableCount: summary.tableCount,
  operationCount: summary.operationCount,
  failedAttemptCostRetained: contract.cost.failedAttemptCostRetained,
  unknownOutcomeBlocksFallback: contract.routePolicy.unknownProviderOutcomeBlocksFallback,
  approvedEditAuthorityFabricated: contract.approvedEditAuthorityFabricated,
  runtimeActivation: contract.runtimeActivation,
  productionReady: false,
}, null, 2))
